"""Database backup export and import for dashboard superusers."""

from __future__ import annotations

import gzip
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings
from django.db import connection, connections

MAX_IMPORT_BYTES = 500 * 1024 * 1024  # 500 MB


class DbBackupError(Exception):
    pass


def _engine_name() -> str:
    return connection.settings_dict.get("ENGINE", "")


def _is_mysql() -> bool:
    return "mysql" in _engine_name()


def _is_sqlite() -> bool:
    return "sqlite" in _engine_name()


def _mysql_config() -> dict[str, str]:
    cfg = connection.settings_dict
    return {
        "host": str(cfg.get("HOST") or "127.0.0.1"),
        "port": str(cfg.get("PORT") or "3306"),
        "user": str(cfg.get("USER") or ""),
        "password": str(cfg.get("PASSWORD") or ""),
        "name": str(cfg.get("NAME") or ""),
    }


def _sqlite_path() -> Path:
    cfg = connection.settings_dict
    name = cfg.get("NAME")
    if not name:
        raise DbBackupError("SQLite database path is not configured.")
    return Path(name).resolve()


def _tool_available(name: str) -> bool:
    return shutil.which(name) is not None


def _write_mysql_defaults(password: str) -> str:
    fd, path = tempfile.mkstemp(prefix="mysql-", suffix=".cnf")
    os.close(fd)
    content = f"[client]\npassword={password}\n"
    Path(path).write_text(content, encoding="utf-8")
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return path


def database_backup_info() -> dict:
    engine = "mysql" if _is_mysql() else ("sqlite" if _is_sqlite() else "other")
    info: dict = {
        "engine": engine,
        "database_name": "",
        "host": "",
        "can_export": False,
        "can_import": False,
        "export_format": "",
        "tools": {},
        "max_import_mb": MAX_IMPORT_BYTES // (1024 * 1024),
    }
    if _is_mysql():
        cfg = _mysql_config()
        info["database_name"] = cfg["name"]
        info["host"] = cfg["host"]
        has_dump = _tool_available("mysqldump")
        has_mysql = _tool_available("mysql")
        info["tools"] = {"mysqldump": has_dump, "mysql": has_mysql}
        info["can_export"] = has_dump and bool(cfg["name"])
        info["can_import"] = has_mysql and bool(cfg["name"])
        info["export_format"] = "sql.gz"
    elif _is_sqlite():
        path = _sqlite_path()
        info["database_name"] = path.name
        info["host"] = str(path.parent)
        info["can_export"] = path.is_file()
        info["can_import"] = True
        info["export_format"] = "sqlite3"
        info["tools"] = {"sqlite3": True}
    return info


def export_database_backup() -> tuple[bytes, str, str]:
    """Returns (payload bytes, filename, content_type)."""
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    if _is_mysql():
        if not _tool_available("mysqldump"):
            raise DbBackupError("mysqldump is not installed on the server.")
        cfg = _mysql_config()
        if not cfg["name"]:
            raise DbBackupError("MySQL database name is not configured.")
        defaults = _write_mysql_defaults(cfg["password"])
        try:
            proc = subprocess.run(
                [
                    "mysqldump",
                    f"--defaults-extra-file={defaults}",
                    f"--host={cfg['host']}",
                    f"--port={cfg['port']}",
                    f"--user={cfg['user']}",
                    "--single-transaction",
                    "--routines",
                    "--triggers",
                    "--add-drop-table",
                    "--set-gtid-purged=OFF",
                    cfg["name"],
                ],
                capture_output=True,
                check=False,
            )
        finally:
            try:
                os.unlink(defaults)
            except OSError:
                pass
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout or b"").decode("utf-8", errors="replace")[:2000]
            raise DbBackupError(f"mysqldump failed: {err}")
        raw = proc.stdout
        payload = gzip.compress(raw, compresslevel=6)
        filename = f"db_backup_{cfg['name']}_{stamp}.sql.gz"
        return payload, filename, "application/gzip"
    if _is_sqlite():
        path = _sqlite_path()
        if not path.is_file():
            raise DbBackupError(f"SQLite file not found: {path}")
        payload = path.read_bytes()
        filename = f"db_backup_{path.stem}_{stamp}.sqlite3"
        return payload, filename, "application/octet-stream"
    raise DbBackupError(f"Unsupported database engine: {_engine_name()}")


def _validate_import_name(name: str) -> None:
    lower = (name or "").lower()
    allowed = (".sql", ".sql.gz", ".gz", ".sqlite3", ".db")
    if not any(lower.endswith(ext) for ext in allowed):
        raise DbBackupError(
            "Invalid file type. Upload .sql, .sql.gz, .sqlite3, or .db backup."
        )


def import_database_backup(file_obj) -> dict:
    """
    Replace the current database from an uploaded backup file.
    file_obj: Django UploadedFile with .read(), .size, .name
    """
    name = getattr(file_obj, "name", "") or "backup"
    _validate_import_name(name)
    size = int(getattr(file_obj, "size", 0) or 0)
    if size <= 0:
        raise DbBackupError("Uploaded file is empty.")
    if size > MAX_IMPORT_BYTES:
        raise DbBackupError(
            f"Backup file exceeds maximum size ({MAX_IMPORT_BYTES // (1024 * 1024)} MB)."
        )

    raw = file_obj.read()
    lower = name.lower()

    connections.close_all()

    if _is_mysql():
        if not _tool_available("mysql"):
            raise DbBackupError("mysql client is not installed on the server.")
        cfg = _mysql_config()
        if not cfg["name"]:
            raise DbBackupError("MySQL database name is not configured.")

        if lower.endswith(".gz"):
            try:
                sql_bytes = gzip.decompress(raw)
            except OSError as e:
                raise DbBackupError(f"Could not decompress gzip backup: {e}") from e
        else:
            sql_bytes = raw

        if not sql_bytes.strip():
            raise DbBackupError("Backup SQL content is empty.")

        defaults = _write_mysql_defaults(cfg["password"])
        try:
            proc = subprocess.run(
                [
                    "mysql",
                    f"--defaults-extra-file={defaults}",
                    f"--host={cfg['host']}",
                    f"--port={cfg['port']}",
                    f"--user={cfg['user']}",
                    cfg["name"],
                ],
                input=sql_bytes,
                capture_output=True,
                check=False,
            )
        finally:
            try:
                os.unlink(defaults)
            except OSError:
                pass
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout or b"").decode("utf-8", errors="replace")[:2000]
            raise DbBackupError(f"mysql import failed: {err}")
        return {
            "ok": True,
            "engine": "mysql",
            "database_name": cfg["name"],
            "bytes_restored": len(sql_bytes),
        }

    if _is_sqlite():
        path = _sqlite_path()
        if lower.endswith(".gz"):
            try:
                payload = gzip.decompress(raw)
            except OSError as e:
                raise DbBackupError(f"Could not decompress gzip backup: {e}") from e
        else:
            payload = raw
        backup_path = path.with_suffix(path.suffix + ".bak")
        if path.is_file():
            shutil.copy2(path, backup_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)
        return {
            "ok": True,
            "engine": "sqlite",
            "database_name": path.name,
            "bytes_restored": len(payload),
            "previous_saved_to": str(backup_path) if backup_path.is_file() else None,
        }

    raise DbBackupError(f"Unsupported database engine: {_engine_name()}")

from django.utils import timezone


def soft_delete(obj, field_name: str = "deleted_at") -> None:
    setattr(obj, field_name, timezone.now())
    obj.save(update_fields=[field_name])


def soft_restore(obj, field_name: str = "deleted_at") -> None:
    setattr(obj, field_name, None)
    obj.save(update_fields=[field_name])

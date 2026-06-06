"""
Python 3.14 makes copy.copy(super()) return a super proxy; Django 5.0's
BaseContext.__copy__ then breaks admin (and any RequestContext copy).

Django 5.2 fixes this but requires MariaDB 10.5+; XAMPP often ships 10.4.
This patch applies the upstream BaseContext.__copy__ fix while staying on Django 5.0.x.
"""
from __future__ import annotations

import sys


def apply() -> None:
    if sys.version_info < (3, 14):
        return

    from copy import copy as copy_fn

    from django.template.context import BaseContext

    def __copy__(self):  # noqa: ANN001
        duplicate = BaseContext()
        duplicate.__class__ = self.__class__
        duplicate.__dict__ = copy_fn(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate

    BaseContext.__copy__ = __copy__  # type: ignore[method-assign]

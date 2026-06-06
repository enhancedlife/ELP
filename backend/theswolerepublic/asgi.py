"""
ASGI config for theswolerepublic project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'theswolerepublic.settings')

import theswolerepublic.py314_context_fix as _py314  # noqa: E402

_py314.apply()

from django.core.asgi import get_asgi_application  # noqa: E402

application = get_asgi_application()

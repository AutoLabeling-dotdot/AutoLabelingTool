# Copyright (C) 2018-2022 Intel Corporation
#
# SPDX-License-Identifier: MIT

# Inherit parent config
from .base import *  # pylint: disable=wildcard-import

CSRF_TRUSTED_ORIGINS = [
    "https://2dot.ai",
]

# CSRF 쿠키 설정 추가
CSRF_COOKIE_SAMESITE = 'Lax'  # 또는 'Strict'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False  # JavaScript가 접근 가능해야 함
CSRF_USE_SESSIONS = False

# 세션 설정
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = True

DEBUG = False

NUCLIO["HOST"] = os.getenv("CVAT_NUCLIO_HOST", "nuclio")

# Django-sendfile:
# https://github.com/moggers87/django-sendfile2
SENDFILE_BACKEND = "django_sendfile.backends.nginx"
SENDFILE_URL = "/"

LOGGING["formatters"]["verbose_uvicorn_access"] = {
    "()": "uvicorn.logging.AccessFormatter",
    "format": '[{asctime}] {levelprefix} {client_addr} - "{request_line}" {status_code}',
    "style": "{",
}
LOGGING["handlers"]["verbose_uvicorn_access"] = {
    "formatter": "verbose_uvicorn_access",
    "class": "logging.StreamHandler",
    "stream": "ext://sys.stdout",
}
LOGGING["loggers"]["uvicorn.access"] = {
    "handlers": ["verbose_uvicorn_access"],
    "level": "INFO",
    "propagate": False,
}

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential gcc default-mysql-client \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

# Outbound mail: set EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS, EMAIL_HOST_USER,
# EMAIL_HOST_PASSWORD, DEFAULT_FROM_EMAIL at runtime (e.g. docker run --env-file .env).
# backend/.env is gitignored and is not copied unless you add it to the build context explicitly.

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn elp.wsgi:application --bind 0.0.0.0:8000"]


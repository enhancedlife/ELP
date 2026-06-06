FROM nginx:1.27-alpine
RUN mkdir -p /var/defaults
COPY deploy/maintenance/maintenance.html /var/defaults/maintenance.html

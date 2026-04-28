# Dockerfile — build n8n with pandoc installed
FROM n8nio/n8n:latest

# Install pandoc (Debian/Ubuntu base)
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends pandoc \
    && rm -rf /var/lib/apt/lists/*
USER node
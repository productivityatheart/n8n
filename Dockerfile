# Dockerfile — build n8n with pandoc installed
FROM n8nio/n8n:latest

USER root

# Install pandoc on Alpine
RUN apk add --no-cache pandoc

USER node
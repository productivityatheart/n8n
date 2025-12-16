FROM n8nio/n8n:latest

# Switch to root to install system packages
USER root

# Install bash and pandoc dependencies using apk (Alpine Linux)
RUN apk update && \
    apk add --no-cache \
    bash \
    pandoc \
    texlive \
    texlive-xetex \
    && rm -rf /var/cache/apk/*

# Install node-fetch globally (not in n8n's node_modules)
RUN npm install -g node-fetch@2

# Switch back to node user
USER node

# Create .n8n directory if it doesn't exist
RUN mkdir -p /home/node/.n8n

# Install n8n-nodes-pandoc community package
RUN npm install -g n8n-nodes-pandoc || true
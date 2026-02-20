FROM node:20-slim

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone repo at build time for initial setup
ARG REPO_URL=https://github.com/0yeonnnn0/kimitter.git
RUN git clone ${REPO_URL} /repo

# Install frontend dependencies
WORKDIR /repo/frontend
RUN npm ci

# Copy scripts
COPY entrypoint-nas.sh /entrypoint-nas.sh
COPY sync.sh /sync.sh
RUN chmod +x /entrypoint-nas.sh /sync.sh

EXPOSE 8081

ENTRYPOINT ["/entrypoint-nas.sh"]

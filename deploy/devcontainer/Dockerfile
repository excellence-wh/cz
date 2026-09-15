# 开发容器镜像：Node + pnpm + Go + git
FROM mcr.microsoft.com/devcontainers/base:bookworm

ARG NODE_MAJOR=24
ARG GO_VERSION=1.27.1

ENV DEBIAN_FRONTEND=noninteractive
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl git xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Node.js + corepack（pnpm 由 packageManager 字段决定版本）
RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

# Go
RUN ARCH="$(dpkg --print-architecture)" \
    && case "${ARCH}" in \
         amd64) GOARCH=amd64 ;; \
         arm64) GOARCH=arm64 ;; \
         *) GOARCH=amd64 ;; \
       esac \
    && curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${GOARCH}.tar.gz" -o /tmp/go.tar.gz \
    && tar -C /usr/local -xzf /tmp/go.tar.gz \
    && rm /tmp/go.tar.gz

ENV PATH=/usr/local/go/bin:${PATH}
ENV GOPROXY=https://proxy.golang.org,direct

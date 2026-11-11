FROM node:22-alpine

WORKDIR /app

# Корневые сертификаты корпоративной сети: положите *.crt / *.cer / *.pem (Base-64) в certs/
COPY certs/ /tmp/corp-certs/
RUN find /tmp/corp-certs -type f \( -name '*.crt' -o -name '*.cer' -o -name '*.pem' \) \
      -exec sh -c 'sed "s/\r$//" "$1"; echo' _ {} \; >> /etc/ssl/certs/ca-certificates.crt && \
    rm -rf /tmp/corp-certs
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY docker/openssl-legacy.cnf /etc/ssl/openssl-legacy.cnf
ENV OPENSSL_CONF=/etc/ssl/openssl-legacy.cnf

# Prisma engines берутся из prisma-engines/ (лежат в репозитории)
COPY docker/download-prisma-engines.sh /tmp/download-prisma-engines.sh
COPY prisma-engines/ /tmp/local-engines/
RUN sed -i 's/\r$//' /tmp/download-prisma-engines.sh && sh /tmp/download-prisma-engines.sh && \
    rm -rf /tmp/local-engines
ENV PRISMA_QUERY_ENGINE_LIBRARY=/opt/prisma-engines/libquery_engine-linux-musl-openssl-3.0.x.so.node
ENV PRISMA_SCHEMA_ENGINE_BINARY=/opt/prisma-engines/schema-engine-linux-musl-openssl-3.0.x

COPY package*.json ./
ARG NPM_STRICT_SSL=true
RUN if [ "$NPM_STRICT_SSL" = "false" ]; then \
      export NODE_TLS_REJECT_UNAUTHORIZED=0; \
      npm config set strict-ssl false; \
    fi && \
    npm ci --include=dev --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 3002
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]

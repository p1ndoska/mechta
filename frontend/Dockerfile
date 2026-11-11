FROM node:22-alpine AS builder
WORKDIR /app
# Корневые сертификаты корпоративной сети: положите *.crt / *.cer / *.pem (Base-64) в certs/
COPY certs/ /tmp/corp-certs/
RUN find /tmp/corp-certs -type f \( -name '*.crt' -o -name '*.cer' -o -name '*.pem' \) \
      -exec sh -c 'sed "s/\r$//" "$1"; echo' _ {} \; >> /etc/ssl/certs/ca-certificates.crt && \
    rm -rf /tmp/corp-certs
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
COPY package*.json ./
ARG NPM_STRICT_SSL=true
RUN if [ "$NPM_STRICT_SSL" = "false" ]; then \
      export NODE_TLS_REJECT_UNAUTHORIZED=0; \
      npm config set strict-ssl false; \
    fi && \
    npm ci --include=dev
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:stable-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

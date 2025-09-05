FROM ghcr.io/puppeteer/puppeteer:24.16.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

USER root

RUN set -eux; \
	curl -fsSL https://nodejs.org/dist/v22.19.0/node-v22.19.0-linux-x64.tar.xz -o /tmp/node.tar.xz; \
	tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1; \
	rm /tmp/node.tar.xz; \
	node -v; npm -v

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]
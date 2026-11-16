FROM docker.io/oven/bun

WORKDIR /app

COPY package.* bun.lock ./

RUN bun install

COPY index.ts ./

CMD ["bun","run","index.ts"]

EXPOSE 3000
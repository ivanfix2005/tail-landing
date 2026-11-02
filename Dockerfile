FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node public ./public
COPY --chown=node:node server ./server
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV HOST=0.0.0.0 PORT=8790 DATABASE_PATH=/app/data/tail.sqlite
EXPOSE 8790
CMD ["node", "server/index.mjs"]

FROM node:22-alpine3.20

WORKDIR /srv/app

COPY package.json .
COPY yarn.lock .

RUN yarn install --no-dev

COPY . .

RUN yarn tsc
RUN rm -rf ./configuration.json

COPY .docker/prod/configuration.json ./configuration.json

CMD ["node", "dist/server.js"]

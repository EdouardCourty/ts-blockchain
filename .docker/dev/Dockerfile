FROM node:22-alpine3.20

WORKDIR /srv/app

COPY . .

RUN yarn install
RUN yarn tsc

# Delete the base config file to use the scoped one (.docker/nodes/{index}/configuration.json)
RUN rm -f configuration.json

CMD ["yarn", "dev"]

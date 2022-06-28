# builder will help reduce layers of final image
FROM node:16-alpine as builder
WORKDIR /node/src/twitter-relay
RUN apk update && apk upgrade && apk add bash
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
ADD src ./src
RUN npm run build

# inherit only necessary files from builder
FROM node:16-alpine as runner
RUN apk update && apk upgrade && apk add --no-cache bash
WORKDIR /usr/src/app
# set up required default ENV
ENV LOG_LEVEL=${LOG_LEVEL:-info}
ENV HOST=${HOST:-0.0.0.0}
ENV PORT=${PORT:-3000}
COPY --from=builder /node/src/twitter-relay/node_modules ./node_modules
COPY --from=builder /node/src/twitter-relay/dist ./dist
COPY --from=builder /node/src/twitter-relay/package.json .
CMD ["node", "dist"]
FROM node:10-alpine

RUN mkdir -p /app/packages
ADD yarn.lock /app/yarn.lock
ADD package.json /app/package.json
ADD tsconfig.json /app/tsconfig.json
ADD packages/server /app/packages/server
ADD shared /app/shared
WORKDIR /app

RUN yarn
RUN yarn workspace @interwebs/webrtc-server build
CMD ["node", "/app/packages/server/dist/index"]
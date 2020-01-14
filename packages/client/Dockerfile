FROM node:10-alpine

RUN mkdir -p /app/packages
ADD .env /app/packages/client/.env
ADD yarn.lock /app/yarn.lock
ADD package.json /app/package.json
ADD tsconfig.json /app/tsconfig.json
ADD packages/client /app/packages/client
ADD shared /app/shared
WORKDIR /app

RUN yarn
RUN yarn workspace @interwebs/webrtc-client build
RUN yarn global add serve
CMD ["serve", "-l", "8080", "-s", "/app/packages/client/build"]

FROM node:4.4

RUN apt-get update && \
 apt-get install -y vim

COPY src /opt/app

WORKDIR /opt/app

CMD ["node","index.js"]

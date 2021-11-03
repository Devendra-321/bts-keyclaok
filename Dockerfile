FROM node:14

# Create app directory
WORKDIR /usr/src/app

COPY /backend/package.json ./

RUN npm install
# Bundle app source
COPY /backend .

EXPOSE 8080
CMD [ "node", "index.js" ]

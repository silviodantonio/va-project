FROM node

WORKDIR /app

COPY ./package.json ./webpack.config.js ./

# Not copying the source files since we are using volumes
# COPY ./src .

RUN npm install

EXPOSE 80

CMD npm start
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
# Windows'ta oluşturulmuş lockfile'ı yok say, Linux Alpine için sıfırdan yükle
RUN npm install --no-package-lock

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

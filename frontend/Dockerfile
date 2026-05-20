FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
# Windows'ta oluşturulmuş lockfile'ı yok say, native binary'leri Alpine Linux için derle
RUN npm install --no-package-lock

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

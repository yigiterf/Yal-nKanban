#!/bin/bash
set -e
set -x
cd /home/f/Desktop/WebÖdev/WEBProgrammingHomework

USER_ID=$(id -u)
GROUP_ID=$(id -g)

mkdir -p backend
docker run --rm -v $(pwd)/backend:/usr/src/app -w /usr/src/app node:18-alpine sh -c "
  npm init -y
  npm install express mysql2 dotenv cors jsonwebtoken bcryptjs
  npm install --save-dev nodemon
  npm pkg set scripts.dev='nodemon index.js'
  echo \"console.log('Backend connected');\" > index.js
  chown -R ${USER_ID}:${GROUP_ID} .
"

cd /home/f/Desktop/WebÖdev/WEBProgrammingHomework
rm -rf frontend-temp
docker run --rm -v $(pwd):/usr/src/app -w /usr/src/app node:18-alpine sh -c "
  npx -y create-vite@latest frontend-temp --template react
  cd frontend-temp
  npm install
  npm install bootstrap bootstrap-icons react-router-dom axios
  chown -R ${USER_ID}:${GROUP_ID} .
"

cp -a frontend-temp/. frontend/ || true
rm -rf frontend-temp

cd /home/f/Desktop/WebÖdev/WEBProgrammingHomework
docker compose up -d --build

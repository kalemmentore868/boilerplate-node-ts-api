FROM node:20

WORKDIR /app

# Copy only package.json and package-lock.json first for dependency installation
COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5500

RUN npm run build

CMD ["npm", "run", "start"]
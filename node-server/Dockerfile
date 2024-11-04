# Bazowy obraz
FROM node:18

# Ustawienie katalogu roboczego
WORKDIR /usr/src/app

# Skopiowanie plików package.json i package-lock.json
COPY package*.json ./

# Instalacja zależności
RUN npm install

# Skopiowanie reszty aplikacji
COPY . .

# Komenda do uruchomienia serwera
CMD ["node", "server.js"]

# Port na zewnątrz
EXPOSE 5050

# Bazowy obraz
FROM node:18

# Ustawienie katalogu roboczego
WORKDIR /app

# Skopiowanie plików package.json i package-lock.json
COPY package*.json ./

# Instalacja zależności
RUN npm install

# Skopiowanie całego projektu do kontenera
COPY . .

# Budowanie aplikacji
RUN npm run build

# Instalacja serwera do obsługi statycznych plików
RUN npm install -g serve

# Komenda do uruchomienia aplikacji
CMD ["serve", "-s", "build"]

# Port na zewnątrz
EXPOSE 3000

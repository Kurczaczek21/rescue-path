# Bazowy obraz
FROM python:3.10

# Ustawienie katalogu roboczego
WORKDIR /app

# Skopiowanie pliku app.py i instalacja zależności
COPY app.py ./
RUN pip install flask flask-cors

# Komenda do uruchomienia aplikacji
CMD ["python", "app.py"]

# Port na zewnątrz
EXPOSE 5000

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Funkcja do konwersji współrzędnych z formatu E7
def convert_coordinates(e7_coordinate):
    return e7_coordinate / 1e7

# Funkcja do przeliczenia confidence na wagę (weight) od 50 do 100
def calculate_weight(confidence):
    # Mapa wartości confidence (0-100) na zakres (50-100)
    return 50 + (confidence * 0.5)

# Funkcja do obliczenia czasu w sekundach
def calculate_duration(timestamp_list):
    if len(timestamp_list) < 2:
        return 0
    start_time = datetime.fromisoformat(timestamp_list[0].replace("Z", "+00:00"))
    end_time = datetime.fromisoformat(timestamp_list[-1].replace("Z", "+00:00"))
    duration = (end_time - start_time).total_seconds()
    return duration

@app.route('/parse', methods=['POST'])
def parse_file():
    try:
        # Odbieramy ścieżkę do pliku z POST requesta
        data = request.json

        if not data or 'file_path' not in data:
            return jsonify({"status": "FAIL", "message": "No file path provided"}), 400

        file_path = data['file_path']

        # Sprawdzamy, czy plik istnieje
        if not os.path.isfile(file_path):
            return jsonify({"status": "FAIL", "message": f"File {file_path} not found"}), 404

        # Otwieramy plik JSON
        with open(file_path, 'r') as file:
            input_data = json.load(file)

        output_data = []
        i = 0

        # Przetwarzanie danych
        for location in input_data["locations"]:
            i += 1
            if i % 10 != 0:
                continue

            lat = convert_coordinates(location["latitudeE7"])
            lng = convert_coordinates(location["longitudeE7"])
            time = location["timestamp"]
            source = location.get("source", "UNKNOWN")
            weight = 50  # Minimalna waga
            duration = 0

            # Obliczanie wagi i czasu
            if "activity" in location:
                activity_data = location["activity"][0]  # Weź pierwszy zestaw aktywności
                if "activity" in activity_data:
                    # Oblicz średnią pewność aktywności
                    average_confidence = sum(activity["confidence"] for activity in activity_data["activity"]) / len(activity_data["activity"])
                    # Przelicz wagę na zakres 50-100
                    # weight = calculate_weight(average_confidence)

                # Oblicz czas trwania (duration) dla danej lokalizacji
                timestamps = [activity["timestamp"] for activity in location["activity"]]
                duration = calculate_duration(timestamps)

            # Dodaj przetworzone dane do listy wynikowej
            output_data.append({
                "location": {
                    "lat": lat,
                    "lng": lng
                },
                "weight": 1,
                "time": time,
                "duration": duration,
                "source": source
            })

        # Tworzenie ścieżki do nowego pliku
        output_file_path = file_path.replace('.json', '_processed.json')

        # Zapisanie danych do pliku heatmap_data.json
        with open(output_file_path, 'w') as outfile:
            json.dump(output_data, outfile, indent=4)

        # Zwracamy odpowiedź z informacją o sukcesie oraz ścieżką do pliku
        return jsonify({
            "status": "OK",
            "message": "File processed successfully",
            "file_path": output_file_path
        }), 200

    except Exception as e:
        return jsonify({"status": "FAIL", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

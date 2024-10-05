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
        # Odbieramy ścieżki do plików z POST requesta
        data = request.json

        # Sprawdzamy, czy podano obie ścieżki
        if not data or 'records_path' not in data or 'settings_path' not in data:
            return jsonify({"status": "FAIL", "message": "No records path or settings path provided"}), 400

        records_path = data['records_path']
        settings_path = data['settings_path']

        # Sprawdzamy, czy pliki istnieją
        if not os.path.isfile(records_path):
            return jsonify({"status": "FAIL", "message": f"File {records_path} not found"}), 404
        if not os.path.isfile(settings_path):
            return jsonify({"status": "FAIL", "message": f"File {settings_path} not found"}), 404

        # Otwieramy pliki JSON
        with open(records_path, 'r') as records_file:
            records_data = json.load(records_file)

        with open(settings_path, 'r') as settings_file:
            settings_data = json.load(settings_file)

        output_data = []

        # Przetwarzanie danych z pliku records
        for location in records_data["locations"]:
            lat = convert_coordinates(location["latitudeE7"])
            lng = convert_coordinates(location["longitudeE7"])
            time = location["timestamp"]
            source = location.get("source", "UNKNOWN")
            accuracy = location.get("accuracy", 0)  # Get accuracy
            duration = 0

            # Set weight based on accuracy
            if accuracy > 200:
                weight = 30
            else:
                weight = 200 - accuracy

            # Oblicz czas trwania (duration) dla danej lokalizacji
            if "activity" in location:
                timestamps = [activity["timestamp"] for activity in location["activity"]]
                duration = calculate_duration(timestamps)

            device_tag = location.get("deviceTag", None)  # Get device tag

            # Dodaj przetworzone dane do listy wynikowej
            output_data.append({
                "location": {
                    "lat": lat,
                    "lng": lng
                },
                "weight": weight,
                "time": time,
                "duration": duration,
                "source": source,
                "deviceTag": device_tag  # Include device tag in the output
            })

        # Przetwarzanie danych z pliku settings
        devices = []
        for device in settings_data.get("deviceSettings", []):
            devices.append({
                "devicePrettyName": device.get("devicePrettyName"),
                "platformType": device.get("platformType"),
                "manufacturer": device["deviceSpec"].get("manufacturer"),
                "model": device["deviceSpec"].get("model"),
                "timelineEnabled": settings_data.get("timelineEnabled"),
                "deviceTag": device.get("deviceTag")  # Include deviceTag from settings
            })

        # Tworzenie ścieżki do nowego pliku
        output_file_path = records_path.replace('.json', '_processed.json')

        # Zapisanie danych do pliku
        processed_data = {
            "devices": devices,
            "locations": output_data
        }

        with open(output_file_path, 'w') as outfile:
            json.dump(processed_data, outfile, indent=4)

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

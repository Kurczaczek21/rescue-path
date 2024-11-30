from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os
import traceback

app = Flask(__name__)
CORS(app)

def convert_coordinates(e7_coordinate):
    return e7_coordinate / 1e7

def calculate_duration(timestamp_list):
    if len(timestamp_list) < 2:
        return 0
    start_time = datetime.fromisoformat(timestamp_list[0].replace("Z", "+00:00"))
    end_time = datetime.fromisoformat(timestamp_list[-1].replace("Z", "+00:00"))
    duration = (end_time - start_time).total_seconds()
    return duration

def validate_json_file(file_path):
    if not file_path.lower().endswith('.json'):
        return False, f"Wysłany plik nie jest w formacie JSON"
    try:
        with open(file_path, 'r') as file:
            json.load(file) 
    except json.JSONDecodeError:
        return False, f"Błąd dekodowania pliku JSON"
    except Exception as e:
        return False, f"Nie udało się wczytać pliku: {str(e)}"
    return True, None

@app.route('/parse', methods=['POST'])
def parse_file():
    try:
        data = request.json

        if not data or 'records_path' not in data or 'settings_path' not in data:
            return jsonify({"status": "FAIL", "message": "No records path or settings path provided"}), 400

        records_path = data['records_path']
        settings_path = data['settings_path']

        is_valid, error_message = validate_json_file(records_path)
        if not is_valid:
            return jsonify({"status": "FAIL", "message": error_message}), 400

        is_valid, error_message = validate_json_file(settings_path)
        if not is_valid:
            return jsonify({"status": "FAIL", "message": error_message}), 400

        with open(records_path, 'r') as records_file:
            records_data = json.load(records_file)

        with open(settings_path, 'r') as settings_file:
            settings_data = json.load(settings_file)

        output_data = []
        for location in records_data["locations"]:
            lat = convert_coordinates(location["latitudeE7"])
            lng = convert_coordinates(location["longitudeE7"])
            time = location["timestamp"]
            source = location.get("source", "UNKNOWN")
            accuracy = location.get("accuracy", 0)
            duration = 0
            weight = accuracy

            if "activity" in location:
                timestamps = [activity["timestamp"] for activity in location["activity"]]
                duration = calculate_duration(timestamps)

            device_tag = location.get("deviceTag", None)

            output_data.append({
                "location": {
                    "lat": lat,
                    "lng": lng
                },
                "weight": weight,
                "time": time,
                "duration": duration,
                "source": source,
                "deviceTag": device_tag
            })

        devices = []
        for device in settings_data.get("deviceSettings", []):
            devices.append({
                "devicePrettyName": device.get("devicePrettyName"),
                "platformType": device.get("platformType"),
                "manufacturer": device["deviceSpec"].get("manufacturer"),
                "model": device["deviceSpec"].get("model"),
                "timelineEnabled": settings_data.get("timelineEnabled"),
                "deviceTag": device.get("deviceTag")
            })

        output_file_path = records_path.replace('.json', '_processed.json')
        processed_data = {
            "devices": devices,
            "locations": output_data
        }

        with open(output_file_path, 'w') as outfile:
            json.dump(processed_data, outfile, indent=4)

        return jsonify({
            "status": "OK",
            "message": "File processed successfully",
            "file_path": output_file_path
        }), 200

    except KeyError as e:
        return jsonify({"status": "FAIL", "message": f"Brakujący klucz w wysłanym pliku: {str(e)}"}), 400
    except Exception as e:
        error_details = traceback.format_exc()
        return jsonify({"status": "FAIL", "message": f"{str(e)}", "details": error_details}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

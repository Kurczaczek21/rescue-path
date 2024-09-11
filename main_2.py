import json
from datetime import datetime

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

# Wczytywanie danych z pliku JSON
input_path = r"Takeout\Historia lokalizacji (oś czasu)\Records.json"
with open(input_path, 'r') as file:
    data = json.load(file)

output_data = []

i = 0

# Przetwarzanie danych
for location in data["locations"]:
    
    
    i=i+1
    if i%10!=0: continue
    
    
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
            weight = calculate_weight(average_confidence)

        # Oblicz czas trwania (duration) dla danej lokalizacji
        timestamps = [activity["timestamp"] for activity in location["activity"]]
        duration = calculate_duration(timestamps)
    
    # Dodaj przetworzone dane do listy wynikowej
    output_data.append({
        "location": {
            "lat": lat,
            "lng": lng
        },
        "weight": weight,
        "time": time,
        "duration": duration,
        "source": source
    })

# Zapisanie danych do pliku heatmap_data.json
with open('heatmap_data.json', 'w') as outfile:
    json.dump(output_data, outfile, indent=4)

print("Dane zostały przetworzone i zapisane do pliku heatmap_data.json")

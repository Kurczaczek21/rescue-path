import json

def extract_location_data(file_path, output_path):
    try:
        # Open the JSON file
        with open(file_path, 'r', encoding='utf-8') as json_file:
            # Load data from the file
            data = json.load(json_file)
        
        # Check if 'timelineObjects' exists and is a list
        if "timelineObjects" in data and isinstance(data["timelineObjects"], list):
            heatmap_data = []

            # Loop through each object in 'timelineObjects'
            for obj in data["timelineObjects"]:
                # Check for 'activitySegment' or 'placeVisit' to extract location data
                if "activitySegment" in obj:
                    activity_segment = obj["activitySegment"]

                    # Extract start location data
                    start_location = activity_segment.get("startLocation", {})
                    start_lat = start_location.get("latitudeE7", 0) / 1e7
                    start_lng = start_location.get("longitudeE7", 0) / 1e7
                    weight = 100  # Confidence can be used as a weight

                    # Append start location to heatmap data
                    if start_lat and start_lng:
                        heatmap_data.append({
                            "location": {"lat": start_lat, "lng": start_lng},
                            "weight": weight
                        })

                    # Extract end location data
                    end_location = activity_segment.get("endLocation", {})
                    end_lat = end_location.get("latitudeE7", 0) / 1e7
                    end_lng = end_location.get("longitudeE7", 0) / 1e7

                    # Append end location to heatmap data
                    if end_lat and end_lng:
                        heatmap_data.append({
                            "location": {"lat": end_lat, "lng": end_lng},
                            "weight": weight
                        })

                elif "placeVisit" in obj:
                    place_visit = obj["placeVisit"]

                    # Extract location data
                    location = place_visit.get("location", {})
                    lat = location.get("latitudeE7", 0) / 1e7
                    lng = location.get("longitudeE7", 0) / 1e7
                    weight = location.get("locationConfidence", 0)

                    # Append place visit location to heatmap data
                    if lat and lng:
                        heatmap_data.append({
                            "location": {"lat": lat, "lng": lng},
                            "weight": weight
                        })

            # Save the extracted data to a new file
            with open(output_path, 'w', encoding='utf-8') as output_file:
                json.dump(heatmap_data, output_file, ensure_ascii=False, indent=4)
            print(f"Data successfully extracted to {output_path}")
        else:
            print("The JSON data does not contain a 'timelineObjects' list or it is empty.")

    except FileNotFoundError:
        print(f"The file {file_path} was not found.")
    except json.JSONDecodeError:
        print(f"Error decoding the JSON file: {file_path}.")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")

# Path to the JSON input file
input_path = r"Takeout\Historia lokalizacji (oś czasu)\Semantic Location History\2024\2024_MAY.json"
# Path to the JSON output file
output_path = "heatmap_data.json"

# Function call
extract_location_data(input_path, output_path)

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const Map = () => {
  const location = useLocation();
  const { locations } = location.state || { locations: [] };

  const [map, setMap] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false); // Stan przełączania dla heatmapy
  const [showCircles, setShowCircles] = useState(false); // Stan przełączania dla okręgów

  const mapStyles = {
    height: "100vh",
    width: "100%",
  };

  const defaultCenter = {
    lat: 50.06594034606738,
    lng: 19.927688668349095,
  };

  // Funkcja do ładowania API Google Maps
  const loadGoogleMapsScript = (callback) => {
    const existingScript = document.getElementById("googleMaps");

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
      script.id = "googleMaps";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        if (callback) callback();
      };
    } else {
      if (callback) callback();
    }
  };

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (!locations.length || !window.google) return;

      // Inicjalizacja mapy
      const newMap = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: defaultCenter,
          zoom: 13,
          mapTypeId: "roadmap",
        }
      );
      setMap(newMap);

      // Dynamiczne dopasowanie widoku mapy do wszystkich punktów
      const bounds = new window.google.maps.LatLngBounds();

      // Tworzenie pinezek i okręgów dla każdej lokalizacji
      const markersAndCircles = locations
        .map((loc) => {
          const lat = parseFloat(loc.location?.lat);
          const lng = parseFloat(loc.location?.lng);
          const signalType = loc.source || "OTHER"; // Typ sygnału, np. WIFI, CELL, OTHER

          if (!isNaN(lat) && !isNaN(lng)) {
            const position = new window.google.maps.LatLng(lat, lng);

            // Tworzenie markera
            const marker = new window.google.maps.Marker({
              position,
              map: newMap,
              title: loc.name || "Lokalizacja",
            });

            // Ustalanie koloru okręgu na podstawie typu sygnału
            let circleColor;
            switch (signalType.toUpperCase()) {
              case "WIFI":
                circleColor = "#0000FF"; // Niebieski dla WIFI
                break;
              case "CELL":
                circleColor = "#008000"; // Zielony dla CELL
                break;
              case "GPS":
                circleColor = "#FF0000"; // Zielony dla CELL
                break;
              default:
                circleColor = "#000000"; // Czerwony dla innych
            }

            // Tworzenie okręgu wokół markera
            const circle = new window.google.maps.Circle({
              strokeColor: circleColor,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: circleColor,
              fillOpacity: 0.35,
              map: showCircles ? newMap : null, // Pokazuj/ukrywaj w zależności od wyboru
              center: position,
              radius: 100, // Można dostosować promień okręgu w metrach
            });

            bounds.extend(position);
            return { marker, circle };
          }
          return null;
        })
        .filter(Boolean); // Filtracja nulli

      if (locations.length > 0) {
        newMap.fitBounds(bounds);
      } else {
        newMap.setCenter(defaultCenter);
      }

      // Przygotowanie danych do mapy cieplnej z użyciem WeightedLocation
      const heatMapData = locations
        .map((loc) => {
          const lat = parseFloat(loc.location?.lat);
          const lng = parseFloat(loc.location?.lng);

          if (!isNaN(lat) && !isNaN(lng)) {
            return {
              location: new window.google.maps.LatLng(lat, lng),
              weight: 1, // Możesz dostosować wagę w zależności od danych
            };
          }
          return null;
        })
        .filter(Boolean);

      // Tworzenie mapy cieplnej
      const newHeatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatMapData,
        dissipating: true, // Zmienia rozpraszanie punktów przy powiększeniu
        maxIntensity: 5, // Dostosowuje maksymalną intensywność (można zmieniać)
        radius: 20, // Promień w pikselach (można dostosować w zależności od mapy)
        opacity: 0.7, // Przezroczystość mapy cieplnej
      });
      setHeatmap(newHeatmap);

      // Pokazywanie/ukrywanie markerów, okręgów lub mapy cieplnej
      markersAndCircles.forEach(({ marker, circle }) => {
        marker.setMap(showHeatmap || showCircles ? null : newMap); // Ukrywaj jeśli widok mapy cieplnej lub okręgów jest włączony
        circle.setMap(showCircles ? newMap : null); // Ukrywaj/wyświetlaj okręgi
      });
      newHeatmap.setMap(showHeatmap ? newMap : null);
    });
  }, [locations, showHeatmap, showCircles]);

  // Funkcja przełączająca widok mapy cieplnej
  const toggleHeatmap = () => {
    setShowHeatmap((prev) => !prev);
    setShowCircles(false); // Wyłącz okręgi, jeśli przełączamy na heatmapę
  };

  // Funkcja przełączająca widok okręgów
  const toggleCircles = () => {
    setShowCircles((prev) => !prev);
    setShowHeatmap(false); // Wyłącz heatmapę, jeśli przełączamy na okręgi
  };

  return (
    <div>
      <button onClick={toggleHeatmap}>
        {showHeatmap ? "Pokaż pinezki" : "Pokaż mapę cieplną"}
      </button>
      <button onClick={toggleCircles}>
        {showCircles ? "Pokaż pinezki" : "Pokaż okręgi"}
      </button>
      <div id="map" style={mapStyles}></div>
    </div>
  );
};

export default Map;

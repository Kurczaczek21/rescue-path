import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  Button,
  Typography,
  Grid,
  Divider,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { locations } = location.state || { locations: [] };

  const [map, setMap] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCircles, setShowCircles] = useState(false);
  const [isCircleButtonDisabled, setIsCircleButtonDisabled] = useState(false);

  // Data range selector
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoSelect, setAutoSelect] = useState("");
  const [error, setError] = useState(null);

  const defaultCenter = {
    lat: 50.06594034606738,
    lng: 19.927688668349095,
  };

  const loadGoogleMapsScript = (callback) => {
    const existingScript = document.getElementById("googleMaps");

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=visualization&callback=initMap`;
      script.id = "googleMaps";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      window.initMap = () => {
        if (callback) callback();
      };
    } else {
      if (callback) callback();
    }
  };

  const calculateDateRange = () => {
    const times = locations
      .map((loc) => new Date(loc.time))
      .filter((time) => !isNaN(time));

    if (times.length < 2) return 0;

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeDifferenceInMs = maxTime - minTime;
    return timeDifferenceInMs / (1000 * 60 * 60 * 24);
  };

  const getAutoSelectedDates = (option) => {
    const today = new Date();
    let start, end;

    switch (option) {
      case "lastYear":
        start = new Date(
          today.getFullYear() - 1,
          today.getMonth(),
          today.getDate()
        );
        end = today;
        break;
      case "lastMonth":
        start = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        );
        end = today;
        break;
      case "last14Days":
        start = new Date(today.setDate(today.getDate() - 14));
        end = new Date();
        break;
      case "last7Days":
        start = new Date(today.setDate(today.getDate() - 7));
        end = new Date();
        break;
      case "last3Days":
        start = new Date(today.setDate(today.getDate() - 3));
        end = new Date();
        break;
      default:
        start = "";
        end = "";
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const handleAutoSelectChange = (e) => {
    const selectedOption = e.target.value;
    setAutoSelect(selectedOption);

    if (selectedOption) {
      const { start, end } = getAutoSelectedDates(selectedOption);
      setStartDate(start);
      setEndDate(end);
      setError(null);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleSubmit = async () => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("Data końcowa nie może być wcześniejsza niż data początkowa.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5050/filter-data", {
        startDate,
        endDate,
      });

      let filteredLocations = response.data;

      // Check if the time span is greater than 6 months
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeSpanInMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        end.getMonth() -
        start.getMonth();

      if (timeSpanInMonths > 6) {
        // Remove every third point
        filteredLocations = filteredLocations.filter(
          (_, index) => index % 2 !== 0
        );
      }

      navigate("/map", { state: { locations: filteredLocations } });
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    }
  };

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (!locations.length || !window.google) return;

      const dateRange = calculateDateRange();
      if (dateRange > 40) {
        setIsCircleButtonDisabled(true);
      } else {
        setIsCircleButtonDisabled(false);
      }

      const newMap = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: defaultCenter,
          zoom: 13,
          mapTypeId: "roadmap",
        }
      );
      setMap(newMap);

      const bounds = new window.google.maps.LatLngBounds();

      const circles = locations
        .map((loc) => {
          const lat = parseFloat(loc.location?.lat);
          const lng = parseFloat(loc.location?.lng);
          const signalType = loc.source || "OTHER";

          if (!isNaN(lat) && !isNaN(lng)) {
            const position = new window.google.maps.LatLng(lat, lng);

            let circleColor;
            switch (signalType.toUpperCase()) {
              case "WIFI":
                circleColor = "#0000FF";
                break;
              case "CELL":
                circleColor = "#008000";
                break;
              case "GPS":
                circleColor = "#FF0000";
                break;
              default:
                circleColor = "#000000";
            }

            const circle = new window.google.maps.Circle({
              strokeColor: circleColor,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: circleColor,
              fillOpacity: 0.35,
              map: showCircles ? newMap : null,
              center: position,
              radius: loc.weight || 100,
            });

            circle.addListener("click", () => {
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div>
                    <p><strong>Latitude:</strong> ${lat}</p>
                    <p><strong>Longitude:</strong> ${lng}</p>
                    <p><strong>Time:</strong> ${loc.time || "N/A"}</p>
                    <p><strong>Device Source:</strong> ${signalType}</p>
                  </div>
                `,
              });
              infoWindow.setPosition(position);
              infoWindow.open(newMap);
            });

            bounds.extend(position);
            return circle;
          }
          return null;
        })
        .filter(Boolean);

      if (locations.length > 0) {
        newMap.fitBounds(bounds);
      } else {
        newMap.setCenter(defaultCenter);
      }

      const heatMapData = locations
        .map((loc) => {
          const lat = parseFloat(loc.location?.lat);
          const lng = parseFloat(loc.location?.lng);

          if (!isNaN(lat) && !isNaN(lng)) {
            return {
              location: new window.google.maps.LatLng(lat, lng),
              weight: loc.weight || 1,
            };
          }
          return null;
        })
        .filter(Boolean);

      const newHeatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatMapData,
        dissipating: true,
        maxIntensity: 5,
        radius: 50,
        opacity: 0.7,
      });

      setHeatmap(newHeatmap);
    });
  }, [locations, showCircles]);

  const toggleHeatmap = () => {
    if (showHeatmap) {
      heatmap?.setMap(null);
    } else {
      heatmap?.setMap(map);
    }
    setShowHeatmap(!showHeatmap);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Drawer
        sx={{
          width: 400,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 400,
            boxSizing: "border-box",
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box p={2}>
          <Typography variant="h5" gutterBottom>
            Opcje mapy
          </Typography>

          {/* Liczba punktów i zakres dat */}
          <Typography variant="body1">
            Liczba punktów: {locations.length}
          </Typography>
          <Typography variant="body1">
            Zakres dat:{" "}
            {locations.length > 0 ? calculateDateRange() : "Brak danych"}
          </Typography>

          <Divider style={{ margin: "20px 0" }} />

          {/* Guziki do map */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={toggleHeatmap}
              >
                {showHeatmap ? "Ukryj mapę cieplną" : "Pokaż mapę cieplną"}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowCircles(!showCircles)}
                disabled={isCircleButtonDisabled}
              >
                {showCircles ? "Ukryj punkty" : "Pokaż punkty"}
              </Button>
            </Grid>
          </Grid>

          <Divider style={{ margin: "20px 0" }} />

          {/* Formularz do wyboru dat */}
          <Box mt={2}>
            <Typography variant="h6">Wybierz zakres dat</Typography>

            <Select
              fullWidth
              value={autoSelect}
              onChange={handleAutoSelectChange}
              displayEmpty
            >
              <MenuItem value="">Wybierz opcję</MenuItem>
              <MenuItem value="lastYear">Ostatni rok</MenuItem>
              <MenuItem value="lastMonth">Ostatni miesiąc</MenuItem>
              <MenuItem value="last14Days">Ostatnie 14 dni</MenuItem>
              <MenuItem value="last7Days">Ostatnie 7 dni</MenuItem>
              <MenuItem value="last3Days">Ostatnie 3 dni</MenuItem>
            </Select>

            <TextField
              fullWidth
              label="Początkowa data"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setAutoSelect("");
              }}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Końcowa data"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setAutoSelect("");
              }}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />

            {error && <Typography color="error">{error}</Typography>}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Generuj mapę
            </Button>
          </Box>
        </Box>
      </Drawer>

      <div id="map" style={{ flexGrow: 1 }} />
    </div>
  );
};

export default Map;

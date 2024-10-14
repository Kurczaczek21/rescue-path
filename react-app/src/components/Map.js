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
  Checkbox,
  Slider,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { locations } = location.state || { locations: [] };

  const [filePath, setFilePath] = useState(location.state?.filePath || null);
  const [map, setMap] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCircles, setShowCircles] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [isCircleButtonDisabled, setIsCircleButtonDisabled] = useState(false);
  const [applied, setApplied] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(200);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoSelect, setAutoSelect] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
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

    if (times.length < 2) return "Brak danych";

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const startDate = new Date(minTime).toISOString().split("T")[0];
    const endDate = new Date(maxTime).toISOString().split("T")[0];
    return `${startDate} - ${endDate}`;
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
        start = new Date(today);
        start.setDate(start.getDate() - 14);
        end = today;
        break;
      case "last7Days":
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        end = today;
        break;
      case "last3Days":
        start = new Date(today);
        start.setDate(start.getDate() - 3);
        end = today;
        break;
      default:
        start = "";
        end = "";
    }

    return {
      start: start ? start.toISOString().split("T")[0] : "",
      end: end ? end.toISOString().split("T")[0] : "",
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

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      console.log("GET DEV");

      const response = await axios.get(`http://127.0.0.1:5050/devices`, {
        params: { file_path: filePath },
      });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error("Błąd podczas pobierania urządzeń:", error);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (filePath) {
      fetchDevices();
    }
  }, [filePath]);

  const handleDeviceToggle = (device) => {
    const currentIndex = selectedDevices.indexOf(device.deviceTag);
    const newSelectedDevices = [...selectedDevices];

    if (currentIndex === -1) {
      newSelectedDevices.push(device.deviceTag);
    } else {
      newSelectedDevices.splice(currentIndex, 1);
    }

    setSelectedDevices(newSelectedDevices);
  };

  const handleSubmit = async () => {
    if (selectedDevices.length === 0) {
      setError("Musisz wybrać co najmniej jedno urządzenie.");
      return;
    }

    if (!filePath) {
      alert("Brak ścieżki pliku!");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("Data końcowa nie może być wcześniejsza niż data początkowa.");
      return;
    }

    // setSubmitting(true);
    try {
      console.log("filering");

      const response = await axios.post("http://127.0.0.1:5050/filter-data", {
        startDate,
        endDate,
        file_path: filePath,
        selectedDevices, // Zaznaczone urządzenia
      });

      let filteredLocations = response.data;
      console.log(filteredLocations);

      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeSpanInMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        end.getMonth() -
        start.getMonth();

      if (timeSpanInMonths > 6) {
        filteredLocations = filteredLocations.filter(
          (_, index) => index % 2 !== 0
        );
      }

      console.log("AAAs");

      console.log(filePath);
      console.log(filteredLocations);

      navigate("/map", { state: { locations: filteredLocations, filePath } });
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    } finally {
      // setSubmitting(false);
    }
  };

  const handleApplyClick = () => {
    setApplied(!applied);
  };

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (!locations.length || !window.google) return;

      if (locations.length > 15000) {
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
          if (loc.weight > currentAccuracy) {
            return null;
          }
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
              fillOpacity: 0.05,
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
                    <p><strong>Device Tag:</strong> ${
                      loc.deviceTag || "N/A"
                    }</p>
                    <p><strong>Accuracy:</strong> ${loc.weight || "N/A"}</p>
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

      const points = locations
        .map((loc) => {
          const lat = parseFloat(loc.location?.lat);
          const lng = parseFloat(loc.location?.lng);

          if (!isNaN(lat) && !isNaN(lng)) {
            const position = new window.google.maps.LatLng(lat, lng);

            let circleColor;
            switch (loc.source.toUpperCase()) {
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

            const marker = new window.google.maps.Circle({
              map: showPoints ? newMap : null,
              strokeColor: circleColor,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: circleColor,
              fillOpacity: 0.35,
              map: showPoints ? newMap : null,

              center: position,
              radius: 20,
            });

            marker.addListener("click", () => {
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div>
                    <p><strong>Latitude:</strong> ${lat}</p>
                    <p><strong>Longitude:</strong> ${lng}</p>
                    <p><strong>Time:</strong> ${loc.time || "N/A"}</p>
                    <p><strong>Device Source:</strong> ${loc.source}</p>
                    <p><strong>Device Tag:</strong> ${
                      loc.deviceTag || "N/A"
                    }</p>
                    <p><strong>Accuracy:</strong> ${loc.weight || "N/A"}</p>
                  </div>
                `,
              });
              infoWindow.setPosition(position);
              infoWindow.open(newMap);
            });

            bounds.extend(position);
            return marker;
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
              weight: 1,
            };
          }
          return null;
        })
        .filter(Boolean);

      const newHeatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatMapData,
        map: showHeatmap ? newMap : null,
        dissipating: true,
        maxIntensity: 10,
        radius: 20,
        opacity: 0.7,
      });

      setHeatmap(newHeatmap);
    });
  }, [locations, showCircles, showPoints, applied]);

  const toggleHeatmap = () => {
    if (showHeatmap) {
      heatmap?.setMap(null);
    } else {
      heatmap?.setMap(map);
    }
    setShowHeatmap(!showHeatmap);
  };

  const togglePoints = () => {
    setShowPoints(!showPoints);
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

          {/* Number of points and date range */}
          <Typography variant="body1">
            Liczba punktów: {locations.length}
          </Typography>
          <Typography variant="body1">
            Zakres dat:{" "}
            {locations.length > 0 ? calculateDateRange() : "Brak danych"}
          </Typography>

          <Divider style={{ margin: "20px 0" }} />

          {/* Map buttons */}
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
              {/* Suwak do zmiany currentAccuracy */}
              <Typography variant="body1">
                Ustaw dokładność: {currentAccuracy}
              </Typography>
              <Slider
                value={currentAccuracy}
                min={50}
                max={1000}
                step={50}
                onChange={(e, value) => setCurrentAccuracy(value)}
                disabled={!showCircles}
                aria-labelledby="accuracy-slider"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyClick}
                disabled={!showCircles}
                sx={{ mt: 2 }}
              >
                Apply
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={togglePoints}
              >
                {showPoints ? "Ukryj markery" : "Pokaż markery"}
              </Button>
            </Grid>
          </Grid>

          <Divider style={{ margin: "20px 0" }} />

          {/* Date selection form */}
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
          <Divider style={{ margin: "20px 0" }} />

          <Box mt={2}>
            <Typography variant="h6">Wybierz urządzenia</Typography>
            {loadingDevices ? (
              <Typography>Ładowanie urządzeń...</Typography>
            ) : devices.length > 0 ? (
              <div>
                {devices.map((device) => (
                  <Box
                    key={device.deviceTag}
                    display="flex"
                    alignItems="center"
                  >
                    <Checkbox
                      checked={selectedDevices.includes(device.deviceTag)}
                      onChange={() => handleDeviceToggle(device)}
                    />
                    <Typography>{device.deviceTag}</Typography>
                  </Box>
                ))}
              </div>
            ) : (
              <Typography>Brak dostępnych urządzeń.</Typography>
            )}
          </Box>
        </Box>
      </Drawer>

      <div id="map" style={{ flexGrow: 1 }} />
    </div>
  );
};

export default Map;

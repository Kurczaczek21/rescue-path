import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListItemIcon,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

const DateRangeSelector = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoSelect, setAutoSelect] = useState("");
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const filePath = location.state?.filePath;
  const currentSite = location.state?.currentSite;

  const showSnackbar = (message, severity = "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
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
    if (selectedDevices.length === 0) {
      showSnackbar("Musisz wybrać co najmniej jedno urządzenie.");
      return;
    }

    if (!filePath) {
      showSnackbar("Brak ścieżki pliku!");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      showSnackbar(
        "Data końcowa nie może być wcześniejsza niż data początkowa."
      );
      return;
    }

    showSnackbar("Dane zostały przesłane pomyślnie!", "success");

    setSubmitting(true);
    console.log({
      startDate,
      endDate,
      file_path: filePath,
      selectedDevices,
    });

    try {
      const response = await axios.post("http://127.0.0.1:5050/filter-data", {
        startDate,
        endDate,
        file_path: filePath,
        selectedDevices,
      });

      let filteredLocations = response.data;
      console.log(response);

      navigate("/map", { state: { locations: filteredLocations, filePath } });
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
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
  }, [filePath, currentSite]);

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

  return (
    <Box sx={{ textAlign: "center", mt: 4, mx: "auto", maxWidth: 600 }}>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate("/file-upload")}
        sx={{
          position: "absolute",
          top: 10,
          right: 60,
          backgroundColor: "#d32f2f",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#c62828",
          },
        }}
      >
        Powrót
      </Button>

      <Typography variant="h4" gutterBottom color="#2E7D32">
        Wybierz zakres dat
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {/* Pierwsza linia: Auto-wybór dat */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Auto-wybór dat</InputLabel>
            <Select
              value={autoSelect}
              onChange={handleAutoSelectChange}
              sx={{
                borderRadius: 2,
                bgcolor: "#f4f6f8",
                "&:hover": { bgcolor: "#e8f5e9" },
              }}
            >
              <MenuItem value="">Wybierz opcję</MenuItem>
              <MenuItem value="lastYear">Ostatni rok</MenuItem>
              <MenuItem value="lastMonth">Ostatni miesiąc</MenuItem>
              <MenuItem value="last14Days">Ostatnie 14 dni</MenuItem>
              <MenuItem value="last7Days">Ostatnie 7 dni</MenuItem>
              <MenuItem value="last3Days">Ostatnie 3 dni</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Początkowa data i godzina"
            type="datetime-local"
            value={
              startDate ? new Date(startDate).toISOString().slice(0, 16) : ""
            }
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              const localOffset = selectedDate.getTimezoneOffset() * 60000;
              const adjustedDate = new Date(
                selectedDate.getTime() - localOffset
              );
              setStartDate(adjustedDate.getTime());
              setAutoSelect("");
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ borderRadius: 2, bgcolor: "#f4f6f8" }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Końcowa data i godzina"
            type="datetime-local"
            value={endDate ? new Date(endDate).toISOString().slice(0, 16) : ""}
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              const localOffset = selectedDate.getTimezoneOffset() * 60000;
              const adjustedDate = new Date(
                selectedDate.getTime() - localOffset
              );
              setEndDate(adjustedDate.getTime());
              setAutoSelect("");
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ borderRadius: 2, bgcolor: "#f4f6f8" }}
          />
        </Grid>

        {/* Komunikat o błędzie */}
        {error && (
          <Grid item xs={12}>
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          </Grid>
        )}

        {/* Lista urządzeń */}
        <Grid item xs={12}>
          <Typography variant="h6" color="#2E7D32">
            Urządzenia:
          </Typography>
          {loadingDevices ? (
            <CircularProgress color="secondary" />
          ) : (
            <List>
              {devices.map((device, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleDeviceToggle(device)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor:
                      selectedDevices.indexOf(device.deviceTag) !== -1
                        ? "#e8f5e9"
                        : "transparent",
                    "&:hover": {
                      backgroundColor:
                        selectedDevices.indexOf(device.deviceTag) !== -1
                          ? "#e0f2f1"
                          : "#f1f8e9",
                    },
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedDevices.indexOf(device.deviceTag) !== -1}
                      tabIndex={-1}
                      disableRipple
                      color="primary"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${device.devicePrettyName} (${device.platformType})`}
                    secondary={`Producent: ${device.manufacturer}, Model: ${
                      device.model
                    }, Timeline Enabled: ${
                      device.timelineEnabled ? "Tak" : "Nie"
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Grid>

        {/* Przyciski submit */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              paddingX: 5,
              borderRadius: 4,
              bgcolor: "#388E3C",
              color: "#ffffff",
              "&:hover": {
                bgcolor: "#2E7D32",
              },
            }}
          >
            {submitting ? <CircularProgress size={24} /> : "Wykonaj"}
          </Button>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DateRangeSelector;

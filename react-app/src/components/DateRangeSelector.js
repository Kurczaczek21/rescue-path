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
} from "@mui/material";

const DateRangeSelector = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState(null);
  const [autoSelect, setAutoSelect] = useState("");
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Przechwycenie filePath z poprzedniego komponentu (Map)
  const filePath = location.state?.filePath;

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
    if (!filePath) {
      alert("Brak ścieżki pliku!");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("Data końcowa nie może być wcześniejsza niż data początkowa.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5050/filter-data", {
        startDate,
        endDate,
        file_path: filePath, // Przekazanie filePath
      });

      const filteredLocations = response.data;

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

      setFilteredData(filteredLocations);
      navigate("/map", { state: { locations: filteredLocations, filePath } });
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    }
  };

  // Funkcja do pobierania urządzeń z pliku JSON
  const fetchDevices = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:5050/devices`, {
        params: { file_path: filePath },
      });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error("Błąd podczas pobierania urządzeń:", error);
    }
  };

  // Wywołaj fetchDevices po załadowaniu komponentu
  useEffect(() => {
    if (filePath) {
      fetchDevices();
    }
  }, [filePath]);

  return (
    <Box sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Wybierz zakres dat
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {/* Select for Auto-select date range */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Auto-wybór dat</InputLabel>
            <Select value={autoSelect} onChange={handleAutoSelectChange}>
              <MenuItem value="">Wybierz opcję</MenuItem>
              <MenuItem value="lastYear">Ostatni rok</MenuItem>
              <MenuItem value="lastMonth">Ostatni miesiąc</MenuItem>
              <MenuItem value="last14Days">Ostatnie 14 dni</MenuItem>
              <MenuItem value="last7Days">Ostatnie 7 dni</MenuItem>
              <MenuItem value="last3Days">Ostatnie 3 dni</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Start date input */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Początkowa data"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setAutoSelect(""); // Reset auto-select
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* End date input */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Końcowa data"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setAutoSelect(""); // Reset auto-select
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* Error message */}
        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}

        {/* Devices list */}
        <Grid item xs={12}>
          <Typography variant="h6">Urządzenia:</Typography>
          <List>
            {devices.map((device, index) => (
              <ListItem key={index}>
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
        </Grid>

        {/* Submit button */}
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Wykonaj
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DateRangeSelector;

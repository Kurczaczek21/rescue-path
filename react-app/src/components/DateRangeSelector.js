import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const DateRangeSelector = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState(null);
  const [autoSelect, setAutoSelect] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
        file_path: filePath,
      });

      let filteredLocations = response.data;

      console.log(response.data);

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

      console.log(filteredLocations);

      setFilteredData(filteredLocations);
      navigate("/map", { state: { locations: filteredLocations } });
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Wybierz zakres dat</h2>
      <div>
        <label>Auto-select:</label>
        <select value={autoSelect} onChange={handleAutoSelectChange}>
          <option value="">Wybierz opcję</option>
          <option value="lastYear">Ostatni rok</option>
          <option value="lastMonth">Ostatni miesiąc</option>
          <option value="last14Days">Ostatnie 14 dni</option>
          <option value="last7Days">Ostatnie 7 dni</option>
          <option value="last3Days">Ostatnie 3 dni</option>
        </select>
      </div>
      <div>
        <label>Początkowa data:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setAutoSelect("");
          }}
        />
      </div>
      <div>
        <label>Końcowa data:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setAutoSelect("");
          }}
        />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleSubmit}>WYKONAJ</button>
    </div>
  );
};

export default DateRangeSelector;

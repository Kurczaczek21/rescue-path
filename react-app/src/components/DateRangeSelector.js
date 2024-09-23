import React, { useState } from "react";
import axios from "axios"; // Import axios
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation

const DateRangeSelector = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Pobierz lokalizację

  const filePath = location.state?.filePath; // Odbierz ścieżkę pliku z poprzedniego komponentu

  const handleSubmit = async () => {
    if (!filePath) {
      alert("Brak ścieżki pliku!");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5050/filter-data", {
        startDate,
        endDate,
        file_path: filePath, // Przekazujemy ścieżkę pliku w zapytaniu
      });

      // Zapisz przefiltrowane dane i przekieruj do nowej strony z mapą
      setFilteredData(response.data);
      navigate("/map", { state: { locations: response.data } });
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Wybierz zakres dat</h2>

      <div>
        <label>Początkowa data:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label>Końcowa data:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <button onClick={handleSubmit}>WYKONAJ</button>
    </div>
  );
};

export default DateRangeSelector;

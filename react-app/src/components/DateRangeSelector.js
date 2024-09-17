// src/components/DateRangeSelector.js
import React, { useState } from "react";

const DateRangeSelector = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    console.log(`Zakres dat: od ${startDate} do ${endDate}`);
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

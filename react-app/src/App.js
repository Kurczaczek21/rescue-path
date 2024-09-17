import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import FileUpload from "./components/FileUpload";
import DateRangeSelector from "./components/DateRangeSelector";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/file-upload" element={<FileUpload />} />
        <Route path="/date-range" element={<DateRangeSelector />} />
      </Routes>
    </Router>
  );
}

export default App;

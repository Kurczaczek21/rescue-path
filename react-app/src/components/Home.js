// src/components/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Witamy w Polytesla</h1>
      <button onClick={() => navigate("/file-upload")}>Przejdź dalej</button>
    </div>
  );
};

export default Home;

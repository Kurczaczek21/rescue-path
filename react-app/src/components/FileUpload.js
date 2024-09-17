import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null); // Przechowuj wybrany plik
  const navigate = useNavigate();

  // Obsługuje przeciąganie i upuszczanie pliku
  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]); // Ustaw pierwszy wybrany plik
  }, []);

  // Konfiguracja dla react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false, // Obsługujemy tylko jeden plik na raz
    accept: "application/json", // Akceptujemy tylko pliki JSON
  });

  const handleUpload = async () => {
    if (!file) {
      alert("Proszę wybrać plik.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Wysyła plik do serwera Node.js
      const uploadResponse = await axios.post(
        "http://127.0.0.1:5050/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Odbierz ścieżkę pliku
      const filePath = uploadResponse.data.file_path;

      console.log("Recived new file:");
      console.log(filePath);

      // Wysyłanie ścieżki pliku do serwera Flask
      const parseResponse = await axios.post("http://127.0.0.1:5000/parse", {
        file_path: filePath,
      });

      if (parseResponse.status === 200) {
        setResult("OK");
      } else {
        setResult("FAIL");
      }
    } catch (error) {
      console.error("Error:", error);
      setResult("FAIL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Wczytaj plik</h2>

      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #007bff",
          padding: "20px",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Upuść plik tutaj...</p>
        ) : (
          <p>
            {file
              ? `Wybrano plik: ${file.name}`
              : "Przeciągnij i upuść plik tutaj lub kliknij, aby wybrać"}
          </p>
        )}
      </div>

      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Ładowanie..." : "Wyślij plik"}
      </button>
      {result && <p>Wynik: {result}</p>}

      <button onClick={() => navigate("/date-range")}>Przejdź dalej</button>
    </div>
  );
};

export default FileUpload;

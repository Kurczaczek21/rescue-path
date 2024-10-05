import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recordsFile, setRecordsFile] = useState(null);
  const [settingsFile, setSettingsFile] = useState(null);
  const navigate = useNavigate();

  // Obsługuje przeciąganie i upuszczanie plików dla obu rodzajów plików
  const onDropRecords = useCallback((acceptedFiles) => {
    setRecordsFile(acceptedFiles[0]); // Ustaw pierwszy wybrany plik dla records
  }, []);

  const onDropSettings = useCallback((acceptedFiles) => {
    setSettingsFile(acceptedFiles[0]); // Ustaw pierwszy wybrany plik dla settings
  }, []);

  const {
    getRootProps: getRootPropsRecords,
    getInputProps: getInputPropsRecords,
    isDragActive: isDragActiveRecords,
  } = useDropzone({
    onDrop: onDropRecords,
    multiple: false,
    accept: "application/json",
  });

  const {
    getRootProps: getRootPropsSettings,
    getInputProps: getInputPropsSettings,
    isDragActive: isDragActiveSettings,
  } = useDropzone({
    onDrop: onDropSettings,
    multiple: false,
    accept: "application/json",
  });

  const handleUpload = async () => {
    if (!recordsFile || !settingsFile) {
      alert("Proszę wybrać oba pliki: Records.json oraz Settings.json.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("records_file", recordsFile);
      formData.append("settings_file", settingsFile);

      console.log(formData);

      // Wysyłanie plików do serwera Node.js
      const uploadResponse = await axios.post(
        "http://127.0.0.1:5050/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { records_file_path, settings_file_path } = uploadResponse.data;

      console.log(records_file_path); // Ścieżka pliku records
      console.log(settings_file_path); // Ścieżka pliku settings (tylko logowanie)

      // Odpytanie serwera Flask do przetworzenia pliku records
      const parseResponse = await axios.post("http://127.0.0.1:5000/parse", {
        file_path: records_file_path, // Ścieżka pliku przesyłana do serwera Flask
      });

      const processedFilePath = parseResponse.data.file_path; // Przetworzona ścieżka pliku

      setResult("OK");

      // Przekazanie przetworzonej ścieżki pliku do DateRangeSelector
      navigate("/date-range", { state: { filePath: processedFilePath } });
    } catch (error) {
      console.error("Error:", error);
      setResult("FAIL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Wczytaj pliki</h2>

      <div {...getRootPropsRecords()} style={dropzoneStyle}>
        <input {...getInputPropsRecords()} />
        {isDragActiveRecords ? (
          <p>Upuść plik Records.json tutaj...</p>
        ) : (
          <p>
            {recordsFile
              ? `Wybrano: ${recordsFile.name}`
              : "Przeciągnij plik Records.json tutaj lub kliknij, aby wybrać"}
          </p>
        )}
      </div>

      <div {...getRootPropsSettings()} style={dropzoneStyle}>
        <input {...getInputPropsSettings()} />
        {isDragActiveSettings ? (
          <p>Upuść plik Settings.json tutaj...</p>
        ) : (
          <p>
            {settingsFile
              ? `Wybrano: ${settingsFile.name}`
              : "Przeciągnij plik Settings.json tutaj lub kliknij, aby wybrać"}
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || !recordsFile || !settingsFile}
      >
        {loading ? "Ładowanie..." : "Wyślij pliki"}
      </button>
      {result && <p>Wynik: {result}</p>}
    </div>
  );
};

const dropzoneStyle = {
  border: "2px dashed #007bff",
  padding: "20px",
  borderRadius: "5px",
  cursor: "pointer",
  marginBottom: "20px",
};

export default FileUpload;

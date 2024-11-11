import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Button,
  Typography,
  Container,
  CircularProgress,
  Grid,
  Paper,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";

const FileUpload = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recordsFile, setRecordsFile] = useState(null);
  const [settingsFile, setSettingsFile] = useState(null);
  const navigate = useNavigate();

  const onDropRecords = useCallback((acceptedFiles) => {
    setRecordsFile(acceptedFiles[0]);
  }, []);

  const onDropSettings = useCallback((acceptedFiles) => {
    setSettingsFile(acceptedFiles[0]);
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
      console.log("Uploading file");
      const formData = new FormData();
      formData.append("records_file", recordsFile);
      formData.append("settings_file", settingsFile);

      const uploadResponse = await axios.post(
        "http://127.0.0.1:5050/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("File uploaded");
      console.log(uploadResponse);

      const { records_file_path, settings_file_path } = uploadResponse.data;

      const parseResponse = await axios.post("http://127.0.0.1:5000/parse", {
        records_path: records_file_path,
        settings_path: settings_file_path,
      });

      const processedFilePath = parseResponse.data.file_path;
      console.log("File processed");
      console.log(parseResponse);

      setResult("OK");

      navigate("/date-range", { state: { filePath: processedFilePath } });
    } catch (error) {
      console.error("Error:", error);
      setResult("FAIL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ marginTop: "50px", textAlign: "center" }}>
      <Typography variant="h4" gutterBottom color="#2E7D32">
        Wczytaj pliki
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="#546E7A">
        Prześlij wymagane pliki do kontynuowania.
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Strefa dropowania pliku Records.json */}
        <Grid item xs={12} sm={6}>
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              border: "2px dashed #4CAF50",
              textAlign: "center",
              backgroundColor: "#E8F5E9", // Jasnozielone tło
            }}
            {...getRootPropsRecords()}
          >
            <input {...getInputPropsRecords()} />
            <CloudUpload sx={{ fontSize: 40, color: "#4CAF50" }} />
            <Typography variant="h6" color="#388E3C">
              {recordsFile
                ? `Wybrano: ${recordsFile.name}`
                : isDragActiveRecords
                ? "Upuść plik Records.json tutaj..."
                : "Przeciągnij plik Records.json tutaj lub kliknij, aby wybrać"}
            </Typography>
          </Paper>
        </Grid>

        {/* Strefa dropowania pliku Settings.json */}
        <Grid item xs={12} sm={6}>
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              border: "2px dashed #4CAF50",
              textAlign: "center",
              backgroundColor: "#E8F5E9", // Jasnozielone tło
            }}
            {...getRootPropsSettings()}
          >
            <input {...getInputPropsSettings()} />
            <CloudUpload sx={{ fontSize: 40, color: "#4CAF50" }} />
            <Typography variant="h6" color="#388E3C">
              {settingsFile
                ? `Wybrano: ${settingsFile.name}`
                : isDragActiveSettings
                ? "Upuść plik Settings.json tutaj..."
                : "Przeciągnij plik Settings.json tutaj lub kliknij, aby wybrać"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Button
          variant="contained"
          color="success"
          onClick={handleUpload}
          disabled={loading || !recordsFile || !settingsFile}
          startIcon={loading && <CircularProgress size={20} />}
          sx={{ paddingX: 5, borderRadius: 3 }}
        >
          {loading ? "Ładowanie..." : "Wyślij pliki"}
        </Button>
      </Box>

      {result && (
        <Typography
          variant="h6"
          color={result === "OK" ? "green" : "red"}
          mt={2}
        >
          Wynik: {result}
        </Typography>
      )}
    </Container>
  );
};

export default FileUpload;

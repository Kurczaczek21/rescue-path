const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 5050;
const MAX_POINTS = 60000;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  })
);

const FILE_UPLOAD_LOCATION = path.join(__dirname, "uploaded_files");

if (!fs.existsSync(FILE_UPLOAD_LOCATION)) {
  fs.mkdirSync(FILE_UPLOAD_LOCATION, { recursive: true });
}

app.use(fileUpload());
app.use(express.json());

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.records_file || !req.files.settings_file) {
    return res
      .status(400)
      .send("Both Records and Settings files must be uploaded.");
  }

  const { records_file, settings_file } = req.files;

  const recordsFileExt = path.extname(records_file.name).slice(1).toLowerCase();
  const settingsFileExt = path
    .extname(settings_file.name)
    .slice(1)
    .toLowerCase();

  const recordsUniqueFilename = uuidv4() + "." + recordsFileExt;
  const settingsUniqueFilename = uuidv4() + "." + settingsFileExt;

  const recordsFilePath = path.join(
    FILE_UPLOAD_LOCATION,
    recordsUniqueFilename
  );
  const settingsFilePath = path.join(
    FILE_UPLOAD_LOCATION,
    settingsUniqueFilename
  );

  try {
    await records_file.mv(recordsFilePath);
    await settings_file.mv(settingsFilePath);

    res.json({
      status: "OK",
      records_file_path: recordsFilePath,
      settings_file_path: settingsFilePath,
      message: "Files uploaded successfully!",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error occurred while uploading the files.");
  }
});

app.post("/filter-data", (req, res) => {
  const { startDate, endDate, file_path, selectedDevices } = req.body;

  if (!file_path) {
    return res.status(400).json({ error: "Brak ścieżki do pliku" });
  }

  const filePath = file_path;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Błąd podczas wczytywania pliku", path: filePath });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (parseError) {
      return res.status(500).json({ error: "Błąd podczas analizy pliku JSON" });
    }

    if (!Array.isArray(parsedData.locations)) {
      return res.status(400).json({ error: "Brak danych lokalizacji w pliku" });
    }

    let filteredData = parsedData.locations.filter((item) => {
      const timestamp = new Date(item.time);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const isInDateRange = timestamp >= start && timestamp <= end;
      const isInSelectedDevices =
        selectedDevices.length === 0 ||
        selectedDevices.includes(item.deviceTag);

      return isInDateRange && isInSelectedDevices;
    });

    if (filteredData.length > MAX_POINTS) {
      const excessRatio = filteredData.length / MAX_POINTS;
      let step = Math.floor(excessRatio);
      while (filteredData.length > MAX_POINTS) {
        filteredData = filteredData.filter((_, index) => index % step !== 0);
        if (filteredData.length > MAX_POINTS) {
          step++;
        }
      }
    }

    res.json(filteredData);
  });
});

app.get("/devices", (req, res) => {
  const { file_path } = req.query;

  if (!file_path) {
    return res.status(400).json({ error: "Brak ścieżki do pliku" });
  }

  fs.readFile(file_path, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Błąd podczas wczytywania pliku", path: file_path });
    }

    try {
      const parsedData = JSON.parse(data);

      res.json({ devices: parsedData.devices || [] });
    } catch (parseError) {
      return res.status(500).json({ error: "Błąd podczas analizy pliku JSON" });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

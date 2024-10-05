const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const cors = require("cors"); // Importujemy bibliotekę CORS
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 5050;

// Konfiguracja CORS - zezwalamy na połączenia z React app na porcie 3000
app.use(
  cors({
    origin: "http://localhost:3000", // Domena Reacta
    methods: ["GET", "POST"], // Metody, które chcemy obsługiwać
  })
);

// Konfiguracja lokalizacji do zapisywania plików
const FILE_UPLOAD_LOCATION = path.join(__dirname, "uploaded_files");

// Tworzymy katalog na pliki, jeśli nie istnieje
if (!fs.existsSync(FILE_UPLOAD_LOCATION)) {
  fs.mkdirSync(FILE_UPLOAD_LOCATION, { recursive: true });
}

// Middleware do obsługi przesyłania plików
app.use(fileUpload());
app.use(express.json());

// Endpoint do przesyłania plików
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

  const recordsUniqueFilename = uuidv4() + "." + recordsFileExt; // Unikalna nazwa dla records
  const settingsUniqueFilename = uuidv4() + "." + settingsFileExt; // Unikalna nazwa dla settings

  const recordsFilePath = path.join(
    FILE_UPLOAD_LOCATION,
    recordsUniqueFilename
  );
  const settingsFilePath = path.join(
    FILE_UPLOAD_LOCATION,
    settingsUniqueFilename
  );

  try {
    // Przeniesienie plików do folderu
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
  const { startDate, endDate, file_path } = req.body;

  // Sprawdzenie, czy podano ścieżkę do pliku
  if (!file_path) {
    return res.status(400).json({ error: "Brak ścieżki do pliku" });
  }

  // Wczytanie pliku JSON z danymi
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

    // Sprawdzenie, czy tablica locations istnieje
    if (!Array.isArray(parsedData.locations)) {
      return res.status(400).json({ error: "Brak danych lokalizacji w pliku" });
    }

    // Filtruj dane na podstawie zakresu dat
    const filteredData = parsedData.locations.filter((item) => {
      const timestamp = new Date(item.time);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return timestamp >= start && timestamp <= end;
    });

    // Obliczanie różnicy czasu między startDate a endDate w miesiącach
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeSpanInMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    let reducedData = filteredData;

    // Usuwanie punktów w zależności od zakresu dat
    if (timeSpanInMonths > 12) {
      // Jeśli zakres dat jest większy niż rok, usuń co drugi punkt
      reducedData = filteredData.filter((_, index) => index % 2 !== 0);
    } else if (timeSpanInMonths > 6) {
      // Jeśli zakres dat jest większy niż 6 miesięcy, usuń co trzeci punkt
      reducedData = filteredData.filter((_, index) => index % 3 !== 0);
    } else if (timeSpanInMonths > 1) {
      // Jeśli zakres dat jest większy niż miesiąc, usuń co czwarty punkt
      reducedData = filteredData.filter((_, index) => index % 4 !== 0);
    }

    // Zwrócenie przefiltrowanych i zredukowanych danych
    res.json(reducedData);
  });
});

// Endpoint do pobierania urządzeń z pliku JSON
app.get("/devices", (req, res) => {
  const { file_path } = req.query;

  // Sprawdzenie, czy podano ścieżkę do pliku
  if (!file_path) {
    return res.status(400).json({ error: "Brak ścieżki do pliku" });
  }

  // Wczytanie pliku JSON z danymi
  fs.readFile(file_path, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Błąd podczas wczytywania pliku", path: file_path });
    }

    try {
      const parsedData = JSON.parse(data);

      // Zwracamy dane o urządzeniach
      // Zakładam, że dane o urządzeniach są w formacie { devices: [...] }
      res.json({ devices: parsedData.devices || [] });
    } catch (parseError) {
      return res.status(500).json({ error: "Błąd podczas analizy pliku JSON" });
    }
  });
});

// Uruchamiamy serwer
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

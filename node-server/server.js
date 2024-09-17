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
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const { file } = req.files;
  const fileExt = path.extname(file.name).slice(1).toLowerCase();
  const uniqueFilename = uuidv4() + "." + fileExt; // Generujemy unikalną nazwę

  // Ścieżka do zapisu
  const filePath = path.join(FILE_UPLOAD_LOCATION, uniqueFilename);

  try {
    // Przeniesienie pliku do folderu
    await file.mv(filePath);

    res.json({
      status: "OK",
      file_path: filePath,
      message: `File uploaded successfully!`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error occurred while uploading the file.");
  }
});

// Uruchamiamy serwer
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

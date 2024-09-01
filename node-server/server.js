const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Serwowanie statycznych plików (CSS, skrypty klienta itp.)
app.use(express.static(path.join(__dirname, "public")));

// Endpoint do pobierania danych mapy termicznej
app.get("/heatmap-data", (req, res) => {
  fs.readFile(
    path.join(__dirname, "heatmap_data.json"),
    "utf8",
    (err, data) => {
      if (err) {
        res
          .status(500)
          .json({ error: "Nie udało się wczytać danych mapy termicznej" });
      } else {
        try {
          const heatmapData = JSON.parse(data);
          res.json(heatmapData);
        } catch (e) {
          res.status(500).json({
            error: "Nieprawidłowy format JSON w danych mapy termicznej",
          });
        }
      }
    }
  );
});

// Serwowanie głównego pliku HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Uruchomienie serwera
app.listen(PORT, () => {
  console.log(`Serwer działa pod adresem http://localhost:${PORT}`);
});

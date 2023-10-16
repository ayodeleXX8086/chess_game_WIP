const express = require("express");
const app = express();
const fs = require("fs").promises;
const path = require("path");

const port = process.env.PORT || 3000;
const rootDir = __dirname;

// Serve static files (HTML, CSS, JS)
app.use(express.static(rootDir));
app.use("/board", express.static(path.join(rootDir, "board")));
app.use("/pieces", express.static(path.join(rootDir, "pieces")));

// Serve HTML file
app.get("/", async (req, res) => {
  try {
    const htmlPath = path.join(rootDir, "index.html");
    const data = await fs.readFile(htmlPath, "utf8");
    res.send(data);
  } catch (err) {
    res.status(500).send("Error reading HTML file");
  }
});

// Serve JavaScript files
app.get("/:folder/:filename?", async (req, res) => {
  const folderName = req.params.folder;
  const filename = req.params?.filename || "index.js";
  const filePaths = [
    path.join(
      rootDir,
      folderName,
      filename.endsWith(".js") ? filename : filename + ".js"
    ),
    path.join(rootDir, folderName + ".js"),
  ];

  for (const filePath of filePaths) {
    try {
      const data = await fs.readFile(filePath, "utf8");
      // console.log("Found", filePath);
      res.type("text/javascript").send(data);
      return;
    } catch (err) {
      // console.log(err, filePath);
    }
  }

  res.status(404).send("File not found");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

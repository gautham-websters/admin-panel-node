import "dotenv/config";
import app from "./app.js";
import initializeDatabase from "./models/index.js";
import fs from "fs";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", {
    recursive: true,
  });
}

const PORT = process.env.PORT || 3300;

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});

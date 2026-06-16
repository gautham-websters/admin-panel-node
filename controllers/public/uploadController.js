import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const folder = req.body.folder || "misc";

    const uploadDir = path.join(process.cwd(), "uploads", folder);

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const filename = `${uuid()}.webp`;

    const outputPath = path.join(uploadDir, filename);

    await sharp(req.file.path)
      .webp({
        quality: 85,
      })
      .toFile(outputPath);

    setTimeout(async () => {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        res.status(500).json({
          success: false,
          message: err.message || "Error deleting temporary file",
        });
        console.error(err);
      }
    }, 1000);

    // await fs.unlink(req.file.path);

    const url = `/uploads/${folder}/${filename}`;

    res.status(200).json({
      success: true,
      url,
    });
  } catch (err) {
    next(err);
  }
};

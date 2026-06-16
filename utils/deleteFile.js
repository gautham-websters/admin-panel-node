import fs from "fs/promises";
import path from "path";

export async function deleteFileIfExists(fileUrl) {
  try {
    if (!fileUrl?.startsWith("/uploads/")) return;

    const filePath = path.join(process.cwd(), fileUrl.replace(/^\/+/, ""));

    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(err);
    }
  }
}

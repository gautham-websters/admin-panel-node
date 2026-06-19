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

export async function deleteFileIfExistsWeb(fileUrl) {
  try {
    if (!fileUrl) return;

    let pathname;
    try {
      pathname = new URL(fileUrl).pathname;
    } catch {
      pathname = fileUrl;
    }

    if (!pathname.includes("/uploads/web/")) {
      return; 
    }

    const uploadsIndex = pathname.indexOf("/uploads/");
    const cleanRelativePath = pathname.substring(uploadsIndex).replace(/^\/+/, "");

    const filePath = path.join(process.cwd(), cleanRelativePath);

    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Error deleting file:", err);
    }
  }
}
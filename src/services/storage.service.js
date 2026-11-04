import fs from "fs";
import path from "path";

export const deleteStoredFile = async (storageKey) => {
  try {
    if (!storageKey) return false;
    const absolutePath = path.resolve(storageKey);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Storage delete error:", error.message);
    return false;
  }
};


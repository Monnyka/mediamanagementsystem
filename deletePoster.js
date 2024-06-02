import fs from "fs";
import path from "path";

// Specify your target directory here
const targetDirectory = "./movie";

function deleteFilesInFolder() {
  try {
    if (!fs.existsSync(targetDirectory)) {
      console.error(`Directory not found: ${targetDirectory}`);
      return;
    }

    const files = fs.readdirSync(targetDirectory);

    for (let file of files) {
      let filePath = path.join(targetDirectory, file);

      // Check if the path is a file
      if (!fs.statSync(filePath).isFile()) continue;

      // Read the file content
      let content = fs.readFileSync(filePath, "utf8");

      // Check if the content includes "poster" or "banner"
      if (content.includes("poster") || content.includes("banner")) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting file: ${filePath}`, err);
        }
      }
    }
  } catch (err) {
    console.error("Error reading directory:", err);
  }
}

// Call the function to delete files
deleteFilesInFolder();

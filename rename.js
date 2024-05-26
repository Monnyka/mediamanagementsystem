import fs from "fs";
import path from "path";

// Define the path to the movie folder
const movieFolderPath = "./movie";

// Recursive function to process files in directories and subdirectories
const processDirectory = (directory) => {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      const fullPath = path.join(directory, file);

      // Check if the current path is a directory or a file
      fs.stat(fullPath, (err, stats) => {
        if (err) {
          console.error("Error getting file stats:", err);
          return;
        }

        if (stats.isDirectory()) {
          // If it's a directory, recurse into it
          processDirectory(fullPath);
        } else {
          // If it's a file, check if the file name contains "hhd800.com@"
          if (file.includes("hhd800.com@")) {
            // Define the new file name by replacing "hhd800.com@" with an empty string
            const newFileName = file.replace("hhd800.com@", "");
            const newFilePath = path.join(directory, newFileName);

            // Rename the file
            fs.rename(fullPath, newFilePath, (err) => {
              if (err) {
                console.error("Error renaming file:", err);
              } else {
                console.log(`Renamed: ${fullPath} to ${newFilePath}`);
              }
            });
          }
        }
      });
    });
  });
};

// Start processing from the root movie folder
processDirectory(movieFolderPath);

console.log("Renaming process initiated.");

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

// Folder containing images
const imageFolder = "./movie";

// Function to process images
const processImages = async () => {
  try {
    // Read the directory
    const files = await fs.readdir(imageFolder);

    for (const file of files) {
      const filePath = path.join(imageFolder, file);

      // Ensure it's a file
      const stats = await fs.stat(filePath);
      if (stats.isFile() && isImage(file)) {
        // Resize image (bigger but maintain dimensions)
        await sharp(filePath)
          .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: false,
          })
          .sharpen() // Apply sharpen to reduce blur
          .toFile(path.join(imageFolder, "processed_" + file));

        console.log(`Processed: ${file}`);
      }
    }
  } catch (error) {
    console.error("Error processing images:", error);
  }
};

// Helper function to check if a file is an image
const isImage = (fileName) => {
  const validExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".webp",
  ];
  const ext = path.extname(fileName).toLowerCase();
  return validExtensions.includes(ext);
};

// Run the script
processImages();

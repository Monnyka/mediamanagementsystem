const sharp = require("sharp");
const fs = require("fs");

async function cropImage(inputImagePath, outputImagePath, cropArea) {
  try {
    // Read the input image
    const image = sharp(inputImagePath);

    // Crop the image
    const croppedImage = image.extract({
      left: cropArea.left,
      top: cropArea.top,
      width: cropArea.width,
      height: cropArea.height,
    });

    // Save the cropped image
    await croppedImage.toFile(outputImagePath);

    console.log(`Cropped image saved as ${outputImagePath}`);
  } catch (error) {
    console.error(`Error cropping image: ${error.message}`);
  }
}

// Example usage
const inputImagePath = "input.jpg";
const outputImagePath = "cropped.jpg";

// Define the crop area
const cropArea = {
  left: 420, // Start from the midpoint of the width
  top: 0, // Start from the top
  width: 370, // Half of the width
  height: 538, // Full height of the image
};

cropImage(inputImagePath, outputImagePath, cropArea);

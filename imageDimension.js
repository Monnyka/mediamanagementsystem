import sharp from "sharp";

const getImageDimensions = async (imagePath) => {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    console.error("Error getting image dimensions:", error.message);
  }
};

// Example usage
const imagePath = "Banner.jpg";
getImageDimensions(imagePath).then((dimensions) => {
  console.log(`Width: ${dimensions.width}, Height: ${dimensions.height}`);
});

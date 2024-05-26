import fs from "fs";
import path from "path";
import axios from "axios";
import cheerio from "cheerio";
import sharp from "sharp";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const downloadPoster = async (javId, downloadDir) => {
  try {
    const url = `https://onejav.com/torrent/${javId}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Adjust the selector based on the site's structure
    const posterImg = $("img.image").attr("src");
    if (!posterImg) {
      console.log(`No poster found for ${javId}`);
      return;
    }

    const posterUrl = posterImg.startsWith("http")
      ? posterImg
      : `https://onejav.com${posterImg}`;
    const posterResponse = await axios({
      url: posterUrl,
      responseType: "arraybuffer",
    });

    const posterBuffer = Buffer.from(posterResponse.data);
    const bannerPath = path.resolve(downloadDir, "Banner.jpg");
    const posterPath = path.resolve(downloadDir, "Poster.jpg");

    // Save the original image as "Banner.jpg"
    fs.writeFileSync(bannerPath, posterBuffer);

    // Get the image dimensions after saving
    const image = sharp(bannerPath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Calculate new dimensions for cropping
    const cropWidth = Math.floor(width * 0.47);
    const cropHeight = height;
    // Calculate left based on the width (52.5% of the poster width)
    const left = Math.floor(width * 0.53);

    // Crop the image and save as "Poster.jpg"
    await sharp(posterBuffer)
      .extract({ width: cropWidth, height: cropHeight, left, top: 0 }) // Adjust the cropping parameters as needed
      .toFile(posterPath);

    console.log(`Downloaded and processed poster for ${javId}`);
  } catch (error) {
    console.error(`Error downloading poster for ${javId}:`, error.message);
  }
};

const main = async () => {
  const moviesPath = path.resolve(__dirname, "./movie");

  const getAllFiles = (dirPath, arrayOfFiles) => {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  };

  const movieFiles = getAllFiles(moviesPath);

  for (const movieFile of movieFiles) {
    if (path.extname(movieFile) === ".txt") {
      const originalJavId = path.basename(movieFile, path.extname(movieFile));
      const javId = originalJavId.toLowerCase().replace(/-/g, "");
      const downloadDir = path.dirname(movieFile);
      const bannerPath = path.resolve(downloadDir, "Banner.jpg");
      const posterPath = path.resolve(downloadDir, "Poster.jpg");

      if (fs.existsSync(bannerPath) && fs.existsSync(posterPath)) {
        console.log(
          `Banner and Poster already exist for ${originalJavId}, skipping download.`
        );
      } else {
        await downloadPoster(javId, downloadDir);
        console.log(
          `Downloaded and processed poster for ${originalJavId} (searched as ${javId})`
        );
      }
    }
  }
};

main();

import fs from "fs";
import path from "path";
import axios from "axios";
import cheerio from "cheerio";
import sharp from "sharp";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const downloadPoster = async (javId, downloadDir) => {
  try {
    const url = `${process.env.URL_POSTER}torrent/${javId}`;
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
      : `${process.env.URL_POSTER}${posterImg}`;
    const posterResponse = await axios({
      url: posterUrl,
      responseType: "arraybuffer",
    });

    const posterBuffer = Buffer.from(posterResponse.data);
    const bannerPath = path.resolve(downloadDir, "backdrop.jpg");
    const posterPath = path.resolve(downloadDir, "poster.jpg");

    // Save the original image as "backdrop.jpg"
    fs.writeFileSync(bannerPath, posterBuffer);

    // Get the image dimensions after saving
    const image = sharp(bannerPath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Calculate new dimensions for cropping
    const cropWidth = Math.floor(width * 0.47);
    const cropHeight = height;
    const left = Math.floor(width * 0.53);

    // Crop the image and save as "poster.jpg"
    await sharp(posterBuffer)
      .extract({ width: cropWidth, height: cropHeight, left, top: 0 })
      .toFile(posterPath);

    console.log(`Downloaded and processed poster for ${javId}`);
  } catch (error) {
    console.error(`Error downloading poster for ${javId}:`, error.message);
  }
};

const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
};

const main = async () => {
  const moviesPath = path.resolve(__dirname, process.env.MOVIE_DIR);
  const movieFiles = getAllFiles(moviesPath);

  for (const movieFile of movieFiles) {
    const originalJavId = path.basename(movieFile, path.extname(movieFile));
    const javId = originalJavId.toLowerCase().replace(/-/g, "");
    const downloadDir = path.dirname(movieFile);
    const bannerPath = path.resolve(downloadDir, "backdrop.jpg");
    const posterPath = path.resolve(downloadDir, "poster.jpg");

    if (fs.existsSync(bannerPath) && fs.existsSync(posterPath)) {
      console.log(
        `[Skipped] ${originalJavId} - Poster and banner already exist`
      );
    } else {
      await downloadPoster(javId, downloadDir);
      console.log(
        `[Processed] ${originalJavId} - Poster downloaded and processed`
      );
    }
  }
};

main();

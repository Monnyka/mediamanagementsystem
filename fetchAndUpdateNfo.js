import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs/promises"; // Use fs/promises for async operations
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const movieDir = path.join(__dirname, "movie"); // Path to the movie directory

// Function to fetch the title and actor from the website
async function fetchMovieDetails(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch the URL: ${response.status} ${response.statusText}`
      );
    }
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract movie title
    const titleElement = document.querySelector(
      "h1.text-base.lg\\:text-lg.text-nord6"
    );
    const movieTitle = titleElement ? titleElement.textContent.trim() : null;

    // Extract actor name
    const actorElement = document.querySelector("a.text-nord13.font-medium");
    const actorName = actorElement ? actorElement.textContent.trim() : null;

    if (!movieTitle || !actorName) {
      throw new Error("Required elements not found");
    }

    return { movieTitle, actorName };
  } catch (error) {
    console.error("Error fetching or parsing the HTML:", error);
    return null;
  }
}

// Function to read all folders in the movie directory
async function readFolders(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: false });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

// Function to create NFO file with movie title and actor
async function createNfoFile(folderPath, movieTitle, actorName) {
  const nfoContent = `
<movie>
    <title>${movieTitle}</title>
    <actor>${actorName}</actor>
</movie>
  `;
  const nfoFilePath = path.join(folderPath, "movie.nfo");
  await fs.writeFile(nfoFilePath, nfoContent, "utf8");
  console.log(`NFO file created at: ${nfoFilePath}`);
}

// Function to process all folders
async function processFolders() {
  try {
    const folders = await readFolders(movieDir);
    const results = [];

    for (const folder of folders) {
      const url = `https://missav.com/en/${folder}`;
      const movieDetails = await fetchMovieDetails(url);

      if (movieDetails) {
        const { movieTitle, actorName } = movieDetails;
        const folderPath = path.join(movieDir, folder);
        await createNfoFile(folderPath, movieTitle, actorName);
        results.push(`${folder}: ${movieTitle} - ${actorName}`);
      } else {
        results.push(`${folder}: Failed to get the movie details`);
      }
    }

    // Output the results
    results.forEach((result) => console.log(result));
  } catch (error) {
    console.error("Error processing folders:", error);
  }
}

processFolders();

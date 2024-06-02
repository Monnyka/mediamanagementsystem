import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const movieDir = path.join(__dirname, "movie"); // Path to the movie directory

// Function to fetch the title, release date, actor, director, studio, and genres from the website using XPath
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

    // Extract the title
    const titleXPathResult = document.evaluate(
      '//*[@id="main"]/header/h1',
      document,
      null,
      dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const titleElement = titleXPathResult.singleNodeValue;
    const title = titleElement ? titleElement.textContent.trim() : null;

    // Extract the release date
    const releasedateXPathResult = document.evaluate(
      '//*[@id="main"]/div/div/div[2]/div[2]/p[5]',
      document,
      null,
      dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const releasedateElement = releasedateXPathResult.singleNodeValue;
    let releasedate = releasedateElement
      ? releasedateElement.textContent.trim()
      : null;

    // Remove the first 14 characters from the release date
    if (releasedate) {
      releasedate = releasedate.substring(14);
    }

    // Extract the actor name
    const actorXPathResult = document.evaluate(
      '//*[@id="main"]/div/div/div[2]/div[2]/p[10]/span/a',
      document,
      null,
      dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const actorElement = actorXPathResult.singleNodeValue;
    const actor = actorElement ? actorElement.textContent.trim() : null;

    // Extract the director name
    const directorXPathResult = document.evaluate(
      '//*[@id="main"]/div/div/div[2]/div[2]/p[8]/span/a',
      document,
      null,
      dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const directorElement = directorXPathResult.singleNodeValue;
    const director = directorElement
      ? directorElement.textContent.trim()
      : null;

    // Extract the studio name
    const studioXPathResult = document.evaluate(
      '//*[@id="main"]/div/div/div[2]/div[2]/p[7]/span/a',
      document,
      null,
      dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const studioElement = studioXPathResult.singleNodeValue;
    const studio = studioElement ? studioElement.textContent.trim() : null;

    // Extract genres
    const genreElements = document.evaluate(
      '//*[@id="main"]/div/div/div[2]/div[2]/p[9]/span',
      document,
      null,
      dom.window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const genres = [];
    for (let i = 0; i < genreElements.snapshotLength; i++) {
      const genreElement = genreElements.snapshotItem(i);
      genres.push(genreElement.textContent.trim());
    }

    return { title, releasedate, actor, director, studio, genres };
  } catch (error) {
    console.error("Error fetching or parsing the HTML:", error);
    return {
      title: null,
      releasedate: null,
      actor: null,
      director: null,
      studio: null,
      genres: [],
    };
  }
}

// Function to read all folders and subfolders in the movie directory
async function readFolders(directory) {
  let folders = [];
  const entries = await fs.promises.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      folders.push(fullPath);
      folders = folders.concat(await readFolders(fullPath));
    }
  }
  return folders;
}

// Function to create NFO file with movie details
function createNfoFile(
  folderPath,
  movieTitle,
  movieReleaseDate,
  movieActor,
  movieDirector,
  movieStudio,
  movieGenres
) {
  const genresString = movieGenres
    .map((genre) => `<genre>${genre}</genre>`)
    .join("\n    ");
  const nfoContent = `
<movie>
    <title>${movieTitle}</title>
    <mpaa>XXX</mpaa>
    <premiered>${movieReleaseDate}</premiered>
    <director>${movieDirector}</director>
    <studio>${movieStudio}</studio>
    <actor><name>${movieActor}</name></actor>
    ${genresString}
</movie>
  `;
  const nfoFilePath = path.join(folderPath, "movie.nfo");
  fs.writeFileSync(nfoFilePath, nfoContent, "utf8");
  console.log(`NFO file created at: ${nfoFilePath}`);
}

// Function to process all folders
async function processFolders() {
  try {
    const folders = await readFolders(movieDir);
    const results = [];

    for (const folder of folders) {
      const folderName = path.basename(folder);
      //env for movie nfo
      const url = process.env.URL_NFO + folderName;
      const { title, releasedate, actor, director, studio, genres } =
        await fetchMovieDetails(url);

      if (title) {
        createNfoFile(
          folder,
          title,
          releasedate,
          actor,
          director,
          studio,
          genres
        );
        results.push(`${folder}: ${title}`);
      } else {
        results.push(`${folder}: Failed to get the movie title`);
      }
    }

    // Output the results
    results.forEach((results) => console.log(results));
  } catch (error) {
    console.error("Error processing folders:", error);
  }
}

processFolders();

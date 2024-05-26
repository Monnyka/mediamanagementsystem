import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

const movieDir = "movie"; // Path to the movie directory

async function getTextContentFromElement(url, selector) {
  try {
    // Fetch the HTML content of the webpage
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch the URL: ${response.status} ${response.statusText}`
      );
    }
    const html = await response.text();

    // Parse the HTML content using jsdom
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Select the element using the provided selector
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    } else {
      throw new Error("Element not found");
    }
  } catch (error) {
    console.error("Error fetching or parsing the HTML:", error);
    return null;
  }
}

async function getTextContentAndYearFromElement(url, selector) {
  try {
    // Fetch the HTML content of the webpage
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch the URL: ${response.status} ${response.statusText}`
      );
    }
    const html = await response.text();

    // Parse the HTML content using jsdom
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Select the element using the provided selector
    const element = document.querySelector(selector);
    if (element) {
      const textContent = element.textContent.trim();
      const href = element.getAttribute("href");
      const year = href ? href.split("/")[1] : null; // Extract the year from the href attribute
      return { textContent, year };
    } else {
      throw new Error("Element not found");
    }
  } catch (error) {
    console.error("Error fetching or parsing the HTML:", error);
    return null;
  }
}

function readFolders(directory) {
  return fs.promises
    .readdir(directory, { withFileTypes: true })
    .then((entries) =>
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    );
}

async function renameFolder(oldPath, newPath) {
  try {
    await fs.promises.rename(oldPath, newPath);
    console.log(`Renamed: ${oldPath} -> ${newPath}`);
  } catch (error) {
    console.error(`Error renaming folder ${oldPath} to ${newPath}:`, error);
  }
}

async function getYearFromDateString(dateString) {
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.getFullYear();
    } else {
      throw new Error("Invalid date string");
    }
  } catch (error) {
    console.error("Error parsing date string:", error);
    return null;
  }
}

async function processFolders() {
  try {
    const folders = await readFolders(movieDir);
    const results = [];

    for (const folder of folders) {
      const cleanedFolder = folder.toLowerCase().replace(/-/g, "");
      const url = `https://onejav.com/torrent/${cleanedFolder}`; // Construct the URL using the cleaned folder name
      const selector = "a.panel-block"; // Selector for the element
      const textContent = await getTextContentFromElement(url, selector);
      const selectors =
        "body > div > div.card.mb-3 > div > div > div.column.is-5 > div > p.subtitle.is-6";
      const year = await getTextContentFromElement(url, selectors);
      console.log(year);
      const formatYear = await getYearFromDateString(year);

      if (textContent) {
        const newFolderName = `${folder} - ${textContent} (${formatYear})`;
        const oldPath = path.join(movieDir, folder);
        const newPath = path.join(movieDir, newFolderName);

        await renameFolder(oldPath, newPath);
        results.push(`${folder}: ${textContent}`);
      } else {
        results.push(`${folder}: Failed to get the text content`);
      }
    }

    // Output the results
    results.forEach((result) => console.log(result));
  } catch (error) {
    console.error("Error processing folders:", error);
  }
}

processFolders();

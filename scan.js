const axios = require('axios');
const cheerio = require('cheerio');
const tqdm = require('tqdm');
const urlJoin = require('url-join');
const readlineSync = require('readline-sync');
const { createCsvWriter } = require('csv-]i(csv-writer');

const baseUrl = readlineSync.question('Enter the base URL: ');
const visited = new Set();
const brokenLinks = [];

async function isBrokenLink(url) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status !== 200;
  } catch (error) {
    return true;
  }
}

function isValidLink(url) {
  const blacklist = [/.(jpg|jpeg|png|gif|svg)$/i, /.(mp3|mp4|mov|avi|wmv)$/i, /^mailto:/i];
  return !blacklist.some(pattern => pattern.test(url));
}

async function fetchLinks(url, parentUrl) {
  if (visited.has(url)) return;
  visited.add(url);

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const links = $('a')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter(isValidLink);

    for (let link of tqdm(links)) {
      const fullLink = urlJoin(baseUrl, link);
      const isBroken = await isBrokenLink(fullLink);
      brokenLinks.push({ link: fullLink, parentUrl, status: isBroken ? 'Broken' : 'OK' });
      await fetchLinks(fullLink, url);
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
  }
}

(async () => {
  const csvWriter = createCsvWriter({
    path: 'broken_links.csv',
    header: ['Link', 'Location', 'Status'],
  });

  await fetchLinks(baseUrl, '');
  await csvWriter.writeRecords(brokenLinks);
  console.log('Broken links report saved to "broken_links.csv"');
})();

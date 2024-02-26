const request = require('request');
const cheerio = require('cheerio');
const { createCsvWriter } = require('csv-writer');
const ReadabilityFormulas = require('readability-formulas');
vc = new ReadabilityFormulas();
const tqdm = require('tqdm');
const fs = require('fs');

// Read single/multiple URLs from a text file
const urls = fs.readFileSync('urls.txt', 'utf8').split('\n').map(url => url.trim());

// Initialize CSV file for output
const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: ['URL', 'Flesch Kincaid Score']
});

urls.forEach(url => {
    tqdm.promise(
        new Promise(async (resolve, reject) => {
            try {
                request(url, async (error, response, html) => {
                    if (!error && response.statusCode == 200) {
                        const $ = cheerio.load(html);

                        // Extract and clean the text content
                        let text_content = "";
                        $('p, article, h1, h2, h3, h4, li').each((_, el) => {
                            text_content += $(el).text() + " ";
                        });
                        text_content = text_content.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();

                        // Calculate Flesch Kincaid readability score
                        const fk_score = vc.fleschReadingEase(text_content);
                        await csvWriter.writeRecords([{ URL: url, 'Flesch Kincaid Score': fk_score }]);

                        console.log(`Flesch Kincaid Score for ${url}: ${fk_score}`);
                    } else {
                        console.log(`Error fetching URL: ${url}, ${error}`);
                    }
                    resolve();
                });
            } catch (e) {
                console.log(`Error processing URL: ${url}, ${e}`);
                reject();
            }
        })
    );
});

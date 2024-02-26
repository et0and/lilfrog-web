const { createCsvWriter } = require('csv-writer');
const { chromium } = require('playwright');
const axe = require('axe-core');
const tqdm = require('tqdm');
const fs = require('fs');

// Create a CSV writer
const csvWriter = createCsvWriter({
    path: 'results.csv',
    header: ['URL', 'Violations']
});

// Read the URLs from the file
const urls = fs.readFileSync('urls.txt', 'utf8').split('\n').map(url => url.trim());

(async () => {
    const browser = await chromium.launch();

    for (let url of tqdm(urls)) {
        try {
            const page = await browser.newPage();
            await page.goto(url, { timeout: 60000 });

            const results = await axe.run(page.content());
            const violations = results.violations || [];

            await csvWriter.writeRecords([{ URL: url, Violations: violations.map(v => v.description).join(', ') }]);
            console.log(`${violations.length} violations found on ${url}`);
        } catch (e) {
            console.log(`Timeout or other error occurred while visiting ${url}: ${e}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();
})();

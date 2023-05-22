/**
 * PART 2 OF THE METADATA WEBSCRAPING SCRIPT FOR VIRGINIA TECH.
 * Retrieves how many meals are under per card.
 * 
 * @author Nam Tran
 * @version 6.26.22
 */
const puppeteer = require('puppeteer');

async function getCardMetadata(url, categories) {
    const data = await puppeteer.launch({headless:true}).then(async browser => {
        const page = await browser.newPage();
        await page.goto(url);

        let ctr = -1;
        let subcategories_lengths = []
        for (let i = 0; i < categories.length; i++) {
            let obj = { start: 0, end: 0 }
            if (i === 0) {
                obj.end = categories[i].subcategories.length;
            } else {
                obj.start = subcategories_lengths[i-1].end
                obj.end = obj.start + categories[i].subcategories.length;
            }
            subcategories_lengths.push(obj)
        }

        let d = [];

        for (let m = 0; m < subcategories_lengths.length; m++) {
            let metadata = { timeCategory: "", length: 0, data: [] }
            metadata.timeCategory = categories[m].timeCategory;

            for (let n = subcategories_lengths[m].start, o = 0; n < subcategories_lengths[m].end; n++, o++) {
                let obj = {};

                const cardLength = await page.evaluate((n) => {
                    return Array.from(document.querySelectorAll('div[class="card"]')[n].children[1].children[0].children).length;
                }, [n]);

                obj.cardLength = cardLength;
                obj.subcategory = categories[m].subcategories[o];
                metadata.length += cardLength;
                metadata.data.push(obj)
            }

            d.push(metadata)
        }
        await browser.close();
        return d;
    });
    return data;
}

module.exports.getCardMetadata = getCardMetadata;
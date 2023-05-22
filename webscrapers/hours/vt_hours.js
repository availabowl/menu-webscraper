/**
 * Webscraper script for Virginia Tech dining hall (version 2).
 * 
 * @author Nam Tran
 * @version 11.17.22
 */
require('events').EventEmitter.defaultMaxListeners = 20;
const router = require('express').Router({mergeParams: true});
const puppeteer = require('puppeteer');

const checkValidToken = require('../../utils/checkValidToken');
const dhLib = require('../../lib/dining_hall');
const hoursLib = require('../../lib/hours');

const selectors = {
    card: 'div[class="p-panel p-component p-panel-toggleable unitOpenOnDayContainer mt-2"]',
    cardTitle: 'span[class="p-panel-title"]',
    hourColumn: 'div[class="p-panel-content"] > div[class="unitsOpenOnDayBody row"] > div[class="col-12"]',
    hourListGroup: 'ul[class="list-group"] > li'
};

router.route('/dh/:dhId').post(checkValidToken, async (req, res) => {
    await puppeteer.launch({headless: true}).then(async browser => {
        const dhId = req.params.dhId;
        const dhInfo = await dhLib.retrieveDhRaw(dhId);
        const url = dhInfo.hoursUrl;
        const schoolId = dhInfo.schoolId;

        console.log('Invoked hours webscraper for Virginia Tech - ' + dhInfo.dhName + ' at ' + new Date());

        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector(selectors.card);

        const cards = await page.$$(selectors.card);
        const cardTitles = await page.$$(selectors.cardTitle);
        const cardColumns = await page.$$(selectors.hourColumn);

        let diningHallName = dhInfo.dhName;
        if (dhInfo.overrideWebscraper) {
            diningHallName = dhInfo.altNameWebscraper;
            console.log(dhInfo.dhName + ' is using its alternative name: ', diningHallName + '...');
        }

        for (let i = 0; i < cards.length; i++) {
            const dhName = await page.evaluate(e => e.textContent, cardTitles[i]);
            const existsInDb = (dhName === diningHallName);
            console.log('Comparing name ' + diningHallName + ' to ' + dhName + ':', existsInDb);

            if (existsInDb) {
                let obj = {
                    dhName: diningHallName,
                    schoolId,
                    dhId
                };

                console.log('\nMatch was found - dining hall ID ' + dhId);
                console.log('Evaluating ' + dhName + '...');

                let hours = [];

                const nodes = await cardColumns[i].$$eval(selectors.hourListGroup, e => e.map(ele => ele.textContent));
                for (let j = 0; j < nodes.length; j++) {
                    const separator = nodes[j].search(/[0-9]/);
                    const key = nodes[j].substring(0, separator).trim();
                    const value = nodes[j].substring(separator);
                    hours.push({[key]: value});
                }
                obj.hoursToday = hours;
                
                await hoursLib.updateHours(obj);

                break;
            }
        }
        await browser.close();
        console.log('Finished running webscraper at ' + new Date());
        return res.sendStatus(200);
    });
});

module.exports = router;

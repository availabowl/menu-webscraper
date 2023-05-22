/**
 * Menu endpoints.
 * 
 * @author Nam Tran
 * @version 6.24.22
 */
const router = require('express').Router({mergeParams: true});
const checkValidToken = require('../../utils/checkValidToken');
const d2Script = require('./d2_menu');

const dh = require('../../lib/dining_hall');
const school = require('../../lib/school');
const menuEndpoints = require('../../lib/menu_item');
const menu = require('./generic_menu');
const fcm = require('./retrieve_category_headers');
const rch = require('./retrieve_cards_per_header');

var startTime, endTime;

function start() {
    startTime = new Date();
    return startTime;
};

function end() {
    endTime = new Date();
    var timeDiff = endTime - startTime; //in ms
    timeDiff /= 100;
    
    // get seconds 
    var seconds = Math.round(timeDiff);
    return "Finished running in " + seconds + " ms.";
}

/**
 * Runs the webscraper for D2.
 */
router.route('/d2').post(checkValidToken, async (_, res) => {
    d2Script.d2();
    res.sendStatus(200);
});

/**
 * Runs the webscraper for all dining halls at Virginia Tech.
 */
router.route('/runAll').post(checkValidToken, async (_, res) => {
    const name = "Virginia Tech";
    const schoolObject = await school.retrieveSchool(name);
    const schoolId = schoolObject._id;

    let numDhsRun = 0;

    console.log('Running menu webscraper for Virginia Tech at ' + new Date());

    const dhs = await dh.retrieveDhsFromSchool(schoolId);
    console.log('There are ' + dhs.length + ' dining halls stored in our database...');
    dhs.map(async (dh) => {
        if (!dh.runMenuWebscraper) {
            console.log('Ignoring ' + dh.dhName + ' as part of the webscraping script for Virginia Tech...');
        } else {
            numDhsRun++;

            if (!dh.menuUrl) {
                console.log('Skipping the webscraper for this dining hall - NO URL');
            } else if (dh.overrideMenuWebscraper) {
                console.log('Running ' + dh.dhName + ', alternate name being utilized: ' + dh.altNameMenuWebscraper + '...at ' + start());
                // Part 1: find all categories and subcategories
                const result = await fcm.findCategoriesMetadata(dh.menuUrl, dh.altNameMenuWebscraper);

                // Part 2: find number of meals under a card
                const result2 = await rch.getCardMetadata(dh.menuUrl, result);

                // Part 3: run generic webscraper, passing result2 as a means of counting for the generic webscraper
                const result3 = await menu.genericMenuWebscraper(dh.menuUrl, dh.dhName, schoolId, dh._id, result2);
                console.log(end());
                console.log("Now, adding " + result3.length + " items to database at dining hall " + dh.dhName);
                await menuEndpoints.createItems(result3);
            } else {
                console.log('Running ' + dh.dhName + '...');
                 // Part 1: find all categories and subcategories
                 const result = await fcm.findCategoriesMetadata(dh.menuUrl, dh.dhName);

                 // Part 2: find number of meals under a card
                 const result2 = await rch.getCardMetadata(dh.menuUrl, result);
 
                 // Part 3: run generic webscraper, passing result2 as a means of counting for the generic webscraper
                 const result3 = await menu.genericMenuWebscraper(dh.menuUrl, dh.dhName, schoolId, dh._id, result2);
                 console.log(end());
                 console.log("Now, adding " + result3.length + " items to database at dining hall " + dh.dhName);
                 await menuEndpoints.createItems(result3);
            }
        }
    });
    res.send({
        ranScript: new Date(),
        schoolName: name,
        numDhsRun
    });
});

module.exports = router;
/**
 * Webscraper script for D2.
 * 
 * @author Nam Tran
 * @version 6.24.22
 */
const puppeteer = require('puppeteer');

const selectors = {
    foodItemName: 'div[class="recipe_title"] > a',
    recipeRow: 'div[class="row recipe_container"]',
    recipeDescription: 'div[class="recipe_description"]',
    vegetarianLabel: 'div[class="legend_icon vegetarian"]',
    veganLabel: 'div[class="legend_icon vegan"]',
    dhName: 'div[id="dining_center_name_container"]',
    noMenu: 'p[class="alert alert-info"]'
}

const url = "http://foodpro.dsa.vt.edu/menus/MenuAtLocation.aspx?locationNum=15&naFlag=1";

async function d2() {

    console.log('Invoked menu webscraper for Virginia Tech - D2 at ' + new Date());
    await puppeteer.launch({headless:true}).then(async browser => {
        const page = await browser.newPage();
        await page.goto(url);    
        await page.waitForSelector(selectors.foodItemName);
    
        const foodItems = await page.$$(selectors.recipeRow);
        const foodItemNames = await page.$$(selectors.foodItemName);
        const foodItemDescriptions = await page.$$(selectors.recipeDescription);
        const vegLabels = await page.$$(selectors.vegetarianLabel);
        const veganLabels = await page.$$(selectors.veganLabel);
    
        // rdi = Recipe description index.
        let rdi = 0; // This has to be kept separate because foodItems.length > foodItemDescriptions.length.
        let vli = 0; // Same deal as rdi-- vli = vegetarian label index.
        let vegan_li = 0;
    
        for (let j = 0; j < foodItems.length; j++) {
    
            let item = {name: "", info: "", vegan: false, vegetarian: false };
            let foodItemName = await page.evaluate(e => e.textContent, foodItemNames[j]); // Grab food name.
            let foodItemAllText = await page.evaluate(e => e.textContent, foodItems[j]); // Grab food all text.
            item.name = foodItemName;
            
            let foodDescription;
            let vegLabel;
            let veganLabel;
    
            if (rdi < foodItemDescriptions.length) {
                foodDescription = await page.evaluate(e => e.textContent, foodItemDescriptions[rdi]);
                console.log(foodDescription.trim())
            }
    
            if (vli < vegLabels.length) {
                vegLabel = await page.evaluate(e => e.textContent, vegLabels[vli]);
            }
    
            if (vegan_li < veganLabels.length) {
                veganLabel = await page.evaluate(e => e.textContent, veganLabels[vegan_li]);
            }
    
            // Not all food descriptions exist per food item. This will keep track of aligning
            // descriptions to the proper item.
            if (foodItemAllText.includes(foodDescription)) {
                item.itemDescription = foodDescription.trim();
                rdi++;
            }
    
            if (foodItemAllText.includes(vegLabel)) {
                item.vegetarian = true;
                vli++;
            }
    
            if (foodItemAllText.includes(veganLabel)) {
                item.vegan = true;
                vegan_li++;
            }
        }
       await browser.close();
       console.log('Finished running webscraper at ' + new Date());
    });
}

module.exports.d2 = d2;
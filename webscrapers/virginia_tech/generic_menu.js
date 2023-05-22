/**
 * Generic webscraper.
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
    noMenu: 'p[class="alert alert-info"]',
    categoryTab: 'li[class="nav-item"] > a',
    categoryPane: 'div[role="tabpanel"]',
    blackSubCategory: 'div[class="card"]'
}

const metadata = [{"timeCategory":"Breakfast","length":73,"data":[{"cardLength":10,"subcategory":"Breakfast Hot Items"},{"cardLength":3,"subcategory":"Breakfast Pastries & Baked Goods"},
{"cardLength":10,"subcategory":"Gaucho's Gluten Free Breakfast"},{"cardLength":16,"subcategory":"Yogurt Bar"},{"cardLength":9,"subcategory":"La Patisserie"},
{"cardLength":7,"subcategory":"Breads & Condiments"},{"cardLength":7,"subcategory":"Cereals"},{"cardLength":8,"subcategory":"Beverages"},{"cardLength":3,"subcategory":"Fruits"}]},
{"timeCategory":"Lunch","length":141,"data":[{"cardLength":2,"subcategory":"Soups"},{"cardLength":4,"subcategory":"Pan Asia (Mon-Fri)"},{"cardLength":2,"subcategory":"Gaucho's Entrees"},
{"cardLength":1,"subcategory":"Gaucho's Grill & Burgers (Mon-Fri)"},{"cardLength":1,"subcategory":"Gaucho's Sides"},{"cardLength":9,"subcategory":"Gaucho's Gluten Free"},
{"cardLength":1,"subcategory":"Mangia! Specials"},{"cardLength":7,"subcategory":"Mangia!"},{"cardLength":1,"subcategory":"Olive's Specials"},{"cardLength":22,"subcategory":"Olive's"},
{"cardLength":17,"subcategory":"Salsa's (Mon-Fri)"},{"cardLength":15,"subcategory":"Eden's"},{"cardLength":21,"subcategory":"Yogurt Bar"},{"cardLength":10,"subcategory":"La Patisserie"},
{"cardLength":2,"subcategory":"Soft Serve and Toppings (Varies Daily)"},{"cardLength":1,"subcategory":"East Side Deli & Grill"},{"cardLength":7,"subcategory":"Breads & Condiments"},
{"cardLength":7,"subcategory":"Cereals"},{"cardLength":8,"subcategory":"Beverages"},{"cardLength":3,"subcategory":"Fruits"}]},
{"timeCategory":"Dinner","length":145,"data":[{"cardLength":2,"subcategory":"Soups"},{"cardLength":4,"subcategory":"Pan Asia (Mon-Fri)"},{"cardLength":2,"subcategory":"Gaucho's Entrees"},
{"cardLength":1,"subcategory":"Gaucho's Grill & Burgers (Mon-Fri)"},{"cardLength":1,"subcategory":"Gaucho's Sides"},{"cardLength":13,"subcategory":"Gaucho's Gluten Free"},{"cardLength":2,"subcategory":"Mangia! Specials"},{"cardLength":6,"subcategory":"Mangia!"},{"cardLength":1,"subcategory":"Olive's Specials"},{"cardLength":20,"subcategory":"Olive's"},{"cardLength":16,"subcategory":"Salsa's (Mon-Fri)"},{"cardLength":15,"subcategory":"Eden's"},{"cardLength":21,"subcategory":"Yogurt Bar"},{"cardLength":13,"subcategory":"La Patisserie"},{"cardLength":2,"subcategory":"Soft Serve and Toppings (Varies Daily)"},{"cardLength":1,"subcategory":"East Side Deli & Grill"},{"cardLength":7,"subcategory":"Breads & Condiments"},{"cardLength":7,"subcategory":"Cereals"},{"cardLength":8,"subcategory":"Beverages"},{"cardLength":3,"subcategory":"Fruits"}]}]

async function genericMenuWebscraper(url, dhName, schoolId, dhId, metadata) {
    const data = await puppeteer.launch({headless:true}).then(async browser => {
        console.log(`Invoked menu webscraper for Virginia Tech - ${dhName} on ${new Date()}`);
        const page = await browser.newPage();
        await page.goto(url);
        
        const noMenuElement = await page.$(selectors.noMenu);
        
        if (noMenuElement) {
            await browser.close();
            console.log(`No menu items available for ${dhName}`);
            return;
        }

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

        /**
         * Structure of the metadata:
         * metadata = array of JSON objects
         * metadata[n] = JSON object
         *  - metadata[n].timeCategory = time category (Breakfast)
         *  - metadata[n].length = how many cards there are, total, per time category
         *  - metadata[n].data = array of JSON objects
         *      - metadata[n].data[m] = JSON object
         *      - metadata[n].data[m].cardLength = card length
         *      - metadata[n].data[m].subcategory = sub-category name
         */

        let mdCategoryIndex = 0;
        let mdObjectIndex = 0;

        let o = 0;
        let arr = []

        for (let i = 0; i < foodItems.length; i++) {
            let item = {
                itemName: "", 
                itemDescription: "", 
                vegan: false, vegetarian: false,
                schoolId,
                dhId
            };

            let foodItemName = await page.evaluate(e => e.textContent, foodItemNames[i]); // Grab food name.
            let foodItemAllText = await page.evaluate(e => e.textContent, foodItems[i]); // Grab food all text.
            item.itemName = foodItemName;
            
            let foodDescription;
            let vegLabel;
            let veganLabel;
    
            if (rdi < foodItemDescriptions.length) {
                foodDescription = await page.evaluate(e => e.textContent, foodItemDescriptions[rdi]);
                // item.itemDescription = foodDescription.trim();
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

            let metadataObject = metadata[mdCategoryIndex];
            let mdCategory = metadata[mdCategoryIndex].data[mdObjectIndex];
            let cardLength = metadataObject.data[mdObjectIndex].cardLength;

            item.timeCategory = metadataObject.timeCategory;
            item.category = mdCategory.subcategory;

            if (o === cardLength - 1) {
                mdObjectIndex++;
                o = 0;
            } else {
                o++;
            }

            if (mdObjectIndex === metadataObject.data.length) {
                mdCategoryIndex++;
                mdObjectIndex = 0;
            }
            arr.push(item)
        }

        await browser.close();
        return arr;
    });
    // console.dir(data, {'maxArrayLength': null});
    return data;
}

// genericMenuWebscraper("http://foodpro.dsa.vt.edu/menus/MenuAtLocation.aspx?locationNum=15&naFlag=1", "D2 at Dietrick Hall", "test", "test", metadata);
module.exports.genericMenuWebscraper = genericMenuWebscraper;
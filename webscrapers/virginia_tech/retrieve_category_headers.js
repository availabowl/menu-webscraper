/**
 * PART 1 OF WEBSCRAPER TO INVOKE ON A DINING HALL WITH MORE THAN ONE VENDOR.
 * This finds all time categories (e.g.; breakfast, lunch, and dinner).
 * It then finds all sub-categories (e.g.; vendor names).
 * 
 * @author Nam Tran
 * @version 6.26.22
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
    visibleMenu: 'div[class="tab-pane fade active show"]',
    timeCategoryTab: 'li[class="nav-item"] > a',
    categoryPane: 'div[role="tabpanel"]',
    blackSubCategory: 'div[class="card"]',
    visibleMenuCards: 'div[class="tab-pane fade active show"] > div[class="card"]',
    menu: 'div[id="full_menu_content"]'
}

async function findCategoriesMetadata(url, dhName) {
    const data = await puppeteer.launch({headless:true}).then(async browser => {
        console.log(`Invoked multiple vendor webscraper for ${dhName} on ${new Date()}`);
        console.log('Retrieving all categories...\n');
        const page = await browser.newPage();
        await page.goto(url);

        // Handle case where if there is no menu available for the day.
        const noMenuElement = await page.$(selectors.noMenu);

        if (noMenuElement) { 
            await browser.close();
            console.log(`No menu items available for ${dhName}`);
            return;
        }
        
        const tabs = await page.$$(selectors.timeCategoryTab);

        const promises = tabs.map(async (tab, m) => {
            let timeCategoryObject = {};
            await tab.click();

            // Inside the menu
            const timeCategories = await page.$$(selectors.timeCategoryTab);
            let timeCategoryName = await page.evaluate(e => e.textContent, timeCategories[m]);

            // Black cards category tab
            const cards = await page.evaluate((m) => {
                let elements = Array.from(document.querySelectorAll('div[role="tabpanel"]')[m].children);
                let headers = elements.map(e => {
                    let end = e.innerText.trim().indexOf('\n', 1);
                    if (end === -1) {
                        return e.innerText.trim();
                    }
                    return e.innerText.trim().substring(0, end);
                });
                return headers;
            }, [m]);

            timeCategoryObject.subcategories = cards;
            timeCategoryObject.timeCategory = timeCategoryName.trim();
            return timeCategoryObject;
        });

        const items = await Promise.all(promises);
        await browser.close();
        return items;
    });
    return data;
}

module.exports.findCategoriesMetadata = findCategoriesMetadata;

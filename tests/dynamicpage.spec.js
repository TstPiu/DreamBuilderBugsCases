const {test, expect} = require("@playwright/test");

const pageGroupType = ["Buses", "Services", "Service-area"];

//function to iterate all urls and categorize them from baseURL taken from playwright.config.js
// Function to iterate all URLs from the navigation and categorize them
async function categorizeAllUrls(page) {
  const baseURL = "/";

  // Locators for parent categories in the navigation
  const categories = {
    buses: '//a[normalize-space()="Buses"]',
    services: '//a[normalize-space()="Services"]',
    serviceArea: '//a[normalize-space()="Service Area"]',
  };

  await page.goto(baseURL);

  for (const categoryName of Object.keys(categories)) {
    const locator = page.locator(categories[categoryName]);
    try {
      await locator.hover({timeout: 5000}); // Wait for hover to be effective
    } catch (error) {
      console.error(`Could not hover over ${categoryName}: ${error.message}`);
      continue;
    }

    // Assumption: Links are within the parent of the category link (e.g., in a dropdown menu)
    const linksLocator = locator.locator("xpath=..").locator("a");
    const links = await linksLocator.all();
    const urls = [];

    for (const link of links) {
      const href = await link.getAttribute("href");
      if (href && href.trim() !== "" && href !== "#") {
        const absoluteUrl = new URL(href, baseURL).toString();
        if (!urls.includes(absoluteUrl)) {
          urls.push(absoluteUrl);
        }
      }
    }
    categorizedUrls[categoryName] = urls;
  }
}

// Before all tests, navigate and categorize the URLs
// test.only(async ({browser}) => {
//   const page = await browser.newPage();
//   await categorizeAllUrls(page);
//   console.log("Categorized URLs:", categorizedUrls);
//   await page.close();
// });

// Categorized URLs for dynamic pages
const categorizedUrls = {
  buses: [],
  services: [],
  serviceArea: [],
};

test.describe("Dynamic Page Tests", () => {
  // Test for Bus Pages
  test.describe("Buses Pages", () => {
    for (const url of categorizedUrls.buses) {
      test(`should load page ${url}`, async ({page}) => {
        await page.goto(url);
        // Add a basic assertion, like checking the title
        console.log(`Successfully navigated to ${url}`);
      });
    }
  });

  // Test for Services Pages
  test.describe("Services Pages", () => {
    for (const url of categorizedUrls.services) {
      test(`should load page ${url}`, async ({page}) => {
        await page.goto(url);

        console.log(`Successfully navigated to ${url}`);
      });
    }
  });

  // Test for Service-area (City) Pages
  test.describe("Service-area (City) Pages", () => {
    for (const url of categorizedUrls.serviceArea) {
      test(`should load page ${url}`, async ({page}) => {
        await page.goto(url);

        console.log(`Successfully navigated to ${url}`);
      });
    }
  });
});

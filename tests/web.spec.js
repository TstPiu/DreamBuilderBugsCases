const {test, expect} = require("@playwright/test");
const {error} = require("console");

test("Check City, State text on multiple pages", async ({page}) => {
  const urls = [
    "http://127.0.0.1:5501/",
    "http://127.0.0.1:5501/miramar-minibus-rental/",
    "http://127.0.0.1:5501/miramar-charter-bus-rental/",
    "http://127.0.0.1:5501/margate-party-bus-rental/",
    "http://127.0.0.1:5501/lauderhill-party-bus-rental/",
    "http://127.0.0.1:5501/tamarac-party-bus-rental/",
    "http://127.0.0.1:5501/fort-lauderdale-party-bus-rental/",
    "http://127.0.0.1:5501/north-lauderdale-party-bus-rental/",
    "http://127.0.0.1:5501/plantation-party-bus-rental/",
    "http://127.0.0.1:5501/weston-party-bus-rental/",
    "http://127.0.0.1:5501/davie-party-bus-rental/",
    "http://127.0.0.1:5501/hollywood-party-bus-rental/",
    "http://127.0.0.1:5501/pembroke-pines-party-bus-rental/",
  ];

  const selector =
    "(//p[@class='mdx:dw-text-[16px] xl1:dw-w-[61%] dw-w-full dw-text-[14px] dw-text-center leading-tight dw-mx-auto'])[1]";

  for (const url of urls) {
    await page.goto(url);

    const text = await page.locator(selector).innerText();
    const parts = text.split(",");

    const {city, state} = getCityStateFromUrl(url);

    // Take last word before the comma → city
    const city_Locator = parts[1].trim().split(" ").pop();

    // State is clean in parts[2]
    const state_Locator = parts[2].trim().split(" ")[0];

    console.log(`City, State: ${city}, ${state}`);
    console.log(`City_L, State_L: ${city_Locator}, ${state_Locator}`);

    expect(city_Locator).toBe(city);
    expect(state_Locator).toBe(state);
  }
});

function getCityStateFromUrl(url) {
  // Homepage → always return Miramar
  if (
    url.endsWith("/") &&
    !url.includes("party-bus") &&
    !url.includes("minibus") &&
    !url.includes("charter-bus")
  ) {
    return {city: "Miramar", state: "Florida"};
  }

  // Extract last part of URL path
  const slug = url.split("/").filter(Boolean).pop();
  // Example:
  // "miramar-party-bus-rental"
  // "miramar-minibus-rental"
  // "miramar-charter-bus-rental"
  // "margate-party-bus-rental"

  // Remove service suffix
  const citySlug = slug
    .replace("-party-bus-rental", "")
    .replace("-minibus-rental", "")
    .replace("-charter-bus-rental", "");

  // Convert to proper Title Case (handles multi-word cities)
  const city = citySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {city, state: "Florida"};
}

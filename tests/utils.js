import * as fs from "fs";
import * as path from "path";

/**
 * Reusable function to save test reports as JSON files
 * Enhanced version with better logging and timestamp-based filenames
 * @param {Object} report - The report object to save
 * @param {string} [dirName="My Report"] - Directory name where report will be saved
 * @param {string} [fileName] - Optional custom filename (without extension). If not provided, uses timestamp
 * @returns {string} - Path to the saved report file
 */
export function saveReportToJson(
  report,
  dirName = "My Report",
  fileName = null
) {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    // Generate filename with timestamp if not provided
    if (!fileName) {
      const timestamp = new Date().getTime();
      fileName = `summary_${timestamp}`;
    }

    // Ensure .json extension
    if (!fileName.endsWith(".json")) {
      fileName += ".json";
    }

    // Build full path
    const filePath = path.join(dirName, fileName);

    // Write report to file
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

    // Enhanced logging - show where the report was saved
    console.log(`\n📄 Report saved to: ${filePath}`);

    return filePath;
  } catch (error) {
    console.error(`✗ Failed to save report: ${error.message}`);
    throw error;
  }
}

/**
 * Discover all internal links on a website
 * Crawls the site starting from baseUrl and returns all unique internal URLs
 * @param {Object} page - Playwright page object
 * @param {string} baseUrl - Base URL to start crawling from
 * @returns {Promise<Array<string>>} - Array of unique internal page URLs
 */
export async function discoverAllPages(page, baseUrl) {
  const visited = new Set();
  const toVisit = [baseUrl];
  const allPages = new Set();

  // Parse base URL to get origin and pathname
  const baseUrlObj = new URL(baseUrl);
  const baseOrigin = baseUrlObj.origin;

  console.log(`\n🔍 Starting to discover pages from: ${baseUrl}`);

  while (toVisit.length > 0) {
    const currentUrl = toVisit.shift();

    // Skip if already visited
    if (visited.has(currentUrl)) {
      continue;
    }

    visited.add(currentUrl);
    allPages.add(currentUrl);

    console.log(`📄 Discovering links on: ${currentUrl}`);

    try {
      // Navigate to the page
      await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Extract all links from the page
      const links = await page.$$eval('a[href]', (anchors, origin) => {
        return anchors.map(anchor => {
          try {
            const href = anchor.getAttribute('href');
            if (!href) return null;

            // Create absolute URL
            const absoluteUrl = new URL(href, window.location.href);

            // Only return if same origin
            if (absoluteUrl.origin === origin) {
              // Remove hash fragments
              absoluteUrl.hash = '';
              return absoluteUrl.href;
            }
            return null;
          } catch (e) {
            return null;
          }
        }).filter(url => url !== null);
      }, baseOrigin);

      // Add new links to the queue
      links.forEach(link => {
        if (!visited.has(link) && !toVisit.includes(link)) {
          toVisit.push(link);
        }
      });

    } catch (error) {
      console.log(`⚠️  Error discovering links on ${currentUrl}: ${error.message}`);
    }
  }

  const pagesArray = Array.from(allPages).sort();
  console.log(`\n✅ Discovery complete! Found ${pagesArray.length} unique pages\n`);

  return pagesArray;
}

export const globalVariables = {
  default_city: "Portland",
  default_state: "Oregon",
  default_city_small: "portland",
  default_address_region: "OR",
  default_country: "US",
  mobile_num_text: "971-360-9450",
  website_url: "https://portlandpartybuscompany.com/",
  ratingValue: "9.9",
  bestRating: "10",
  reviewCount: "29",
};

export const expectedSchemas = {
  LocalBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${globalVariables.website_url}#localbusiness`,
    name: `${globalVariables.default_city} Party Bus Company`,
    url: globalVariables.website_url,
    logo: "https://portlandpartybuscompany.com/assets/portland-party-bus-company-logo.png",
    telephone: `+1-${globalVariables.mobile_num_text}`,
    description: `${globalVariables.default_city} Party Bus Company is a highly rated provider of limousine buses, sprinter vans, charter buses, minibuses & party buses in ${globalVariables.default_city}, ${globalVariables.default_state} open 24/7/365. Experienced reservation agents are available at ${globalVariables.mobile_num_text}`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Downtown",
      addressLocality: globalVariables.default_city,
      addressRegion: globalVariables.default_address_region,
      addressCountry: globalVariables.default_country,
      areaServed: `${globalVariables.default_city}, ${globalVariables.default_address_region}`,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
  },
  Product: {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${globalVariables.default_city} Party Bus Company`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: globalVariables.ratingValue,
      bestRating: globalVariables.bestRating,
      reviewCount: globalVariables.reviewCount,
    },
  },
  WebSite: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${globalVariables.default_city} Party Bus Company`,
    url: globalVariables.website_url,
  },
  // BreadcrumbList: {
  //   "@context": "https://schema.org/",
  //   "@type": "BreadcrumbList",
  //   itemListElement: [
  //     {
  //       "@type": "ListItem",
  //       position: 1,
  //       name: "Home",
  //       item: globalVariables.website_url,
  //     },
  //     {
  //       "@type": "ListItem",
  //       position: 2,
  //       name: /.*/,
  //       item: /.*/,
  //     },
  //   ],
  // },
};

export function compareObjects(expected, actual, schemaType, path, diffs) {
  // If the expected schema is not defined, we cannot compare it.
  if (expected === undefined) {
    return;
  }
  // Skip logo differences
  if (typeof expected !== "object" || expected === null) {
    // primitive or null
    if (!comparePrimitives(expected, actual)) {
      diffs.push({
        field: path || "(root)",
        expected: expected,
        found: actual,
        message: `Value mismatch at ${path || "(root)"}`,
      });
    }
    return;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      diffs.push({
        field: path || "(root)",
        expected: expected,
        found: actual,
        message: `Expected array at ${path || "(root)"}`,
      });
      return;
    }
    if (expected.length !== actual.length) {
      diffs.push({
        field: path || "(root)",
        expected: `array length ${expected.length}`,
        found: `array length ${actual.length}`,
        message: `Array length mismatch at ${path || "(root)"}`,
      });
    }
    const len = Math.min(expected.length, actual.length);
    for (let i = 0; i < len; i++) {
      compareObjects(
        expected[i],
        actual[i],
        schemaType,
        `${path}[${i}]`,
        diffs
      );
    }
    return;
  }

  // Both are objects
  const expKeys = Object.keys(expected);
  for (const key of expKeys) {
    if (key === "logo") continue; // accept any logo URL
    const newPath = path ? `${path}.${key}` : key;
    if (!(key in actual)) {
      diffs.push({
        field: newPath,
        expected: expected[key],
        found: undefined,
        message: `Missing key '${key}' in actual ${schemaType} at ${newPath}`,
      });
      continue;
    }
    const ev = expected[key];
    const av = actual[key];
    if (typeof ev === "object" && ev !== null) {
      compareObjects(ev, av, schemaType, newPath, diffs);
    } else {
      if (!comparePrimitives(ev, av)) {
        diffs.push({
          field: newPath,
          expected: ev,
          found: av,
          message: `Field '${newPath}' expected '${ev}' but found '${av}'`,
        });
      }
    }
  }

  // Check for unexpected extra keys in actual
  const actualKeys = Object.keys(actual || {});
  for (const key of actualKeys) {
    if (key === "logo") continue;
    if (!expKeys.includes(key)) {
      const newPath = path ? `${path}.${key}` : key;
      diffs.push({
        field: newPath,
        expected: undefined,
        found: actual[key],
        message: `Unexpected key '${key}' present in actual ${schemaType} at ${newPath}`,
      });
    }
  }
}

function comparePrimitives(a, b) {
  if (a === b) return true;
  // allow numeric/string tolerant comparison
  if (a == null && b == null) return true;
  if (typeof a === "number" || typeof b === "number")
    return String(a) === String(b);
  return String(a) === String(b);
}

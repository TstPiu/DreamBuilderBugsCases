const {test, expect} = require("@playwright/test");
const fs = require("fs");
const path = require("path");

/**
 * Reusable function to save test reports as JSON files
 * @param {Object} report - The report object to save
 * @param {string} [dirName="My Report"] - Directory name where report will be saved
 * @param {string} [fileName] - Optional custom filename (without extension). If not provided, uses timestamp
 * @returns {string} - Path to the saved report file
 */
function saveReportToJson(report, dirName = "My Report", fileName = null) {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, {recursive: true});
      console.log(`✓ Created directory: ${dirName}`);
    }

    // Generate filename with timestamp if not provided
    if (!fileName) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      fileName = `test-report-${timestamp}`;
    }

    // Ensure .json extension
    if (!fileName.endsWith(".json")) {
      fileName += ".json";
    }

    // Build full path
    const filePath = path.join(dirName, fileName);

    // Write report to file
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`✓ Report saved to: ${filePath}`);

    return filePath;
  } catch (error) {
    console.error(`✗ Failed to save report: ${error.message}`);
    throw error;
  }
}

const globalVariables = {
  default_city: "Portland",
  default_state: "Oregon",
  default_city_small: "portland",
  default_address_region: "OR",
  default_country: "US",
  mobile_num_text: "971-360-9450",
  website_url: "https://portlandpartybuscompany.com/",
  ratingValue: "9.9",
  bestRating: "10",
  reviewCount: "30",
};

const expectedSchemas = {
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
};

test.only("Home page schema validation", async ({page}) => {
  await page.goto("https://portlandpartybuscompany.com/");
  const scriptTags = page.locator('script[type="application/ld+json"]');
  const extractedSchemas = [];
  for (const tag of await scriptTags.all()) {
    const textContent = await tag.textContent();
    try {
      if (textContent) {
        extractedSchemas.push(JSON.parse(textContent));
      }
    } catch (e) {
      console.error("Error parsing JSON:", e);
    }
  }

  const detectedSchemas = extractedSchemas.map((s) => s["@type"]);
  const requiredSchemas = ["LocalBusiness", "Product", "WebSite"];
  const missingSchemas = requiredSchemas.filter(
    (s) => !detectedSchemas.includes(s)
  );

  const report = {
    result: "PASSED",
    errors: [],
    extracted_schema: extractedSchemas,
  };

  if (missingSchemas.length > 0) {
    report.result = "FAILED";
    report.errors.push({
      type: "missing_schemas",
      message: `Missing Schema Types: ${missingSchemas.join(", ")}`,
      missing: missingSchemas,
    });
  }

  // Compare each extracted schema with expectedSchemas
  for (const expectedType of requiredSchemas) {
    const expected = expectedSchemas[expectedType];
    const actual = extractedSchemas.find((s) => s["@type"] === expectedType);
    if (!actual) continue; // already recorded as missing

    const diffs = [];
    compareObjects(expected, actual, expectedType, "", diffs);
    if (diffs.length > 0) {
      report.result = "FAILED";
      for (const d of diffs) {
        report.errors.push({
          type: "mismatch",
          schema: expectedType,
          field: d.field,
          expected: d.expected,
          found: d.found,
          message: d.message,
        });
      }
    }
  }

  // Save report using the reusable function to "My Report" directory
  try {
    saveReportToJson(
      report,
      "My Report",
      "HomePage-schema-validation-report.json"
    );

    // Clean up any accidental root-level report.json left from previous runs
    const rootReport = "report.json";
    if (fs.existsSync(rootReport)) {
      try {
        fs.unlinkSync(rootReport);
        console.log(`Removed ${rootReport}`);
      } catch (e) {}
    }

    // Optionally remove Playwright test-results last-run file to reduce noise
    const lastRun = "test-results/.last-run.json";
    if (fs.existsSync(lastRun)) {
      try {
        fs.unlinkSync(lastRun);
        console.log(`Removed ${lastRun}`);
      } catch (e) {}
    }
  } catch (e) {
    console.error("Failed to write report.json:", e);
  }

  // Console output similar to task.md
  console.log(`\nTEST RESULT: ${report.result}`);
  if (report.errors.length > 0) {
    console.log("Errors:");
    report.errors.forEach((err) => console.log(JSON.stringify(err)));
  }

  console.log("\nDetected Schemas:");
  detectedSchemas.forEach((s) => console.log(`- ${s}`));

  console.log("\nExtracted Schema Output:");
  extractedSchemas.forEach((schema, i) => {
    console.log(`SCHEMA ${i + 1} — ${schema["@type"]}`);
    console.log(JSON.stringify(schema, null, 2));
  });

  expect(report.result).toBe("PASSED");
});

function compareObjects(expected, actual, schemaType, path, diffs) {
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

import {test, expect} from "@playwright/test";
import {globalVariables, saveReportToJson, compareObjects} from "./utils.js";

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

test("Home page schema validation", async ({page}) => {
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
  } catch (e) {
    console.error("Failed to write report.json:", e);
  }

  // Report is saved to file; avoid redundant console output here.
  expect(report.result).toBe("PASSED");
});

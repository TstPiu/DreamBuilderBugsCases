import {test, expect} from "@playwright/test";
import {globalVariables, compareObjects, saveReportToJson} from "./utils.js";

const staticPagesUrlsWOBreadcrumbs = [
  "portland-party-bus-prices/",
  "about-us/",
  "contact-us/",
  //"sitemap/",
  "privacy-policy/",
];

const staticPagesUrlsWithBreadcrumbs = [
  "our-fleet/",
  "group-transportation-services/",
  "service-area/",
  "portland-party-bus-prices/",
];

const expectedProductSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: `${globalVariables.default_city} Party Bus Company`,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: globalVariables.ratingValue,
    bestRating: globalVariables.bestRating,
    reviewCount: globalVariables.reviewCount,
  },
};

test("Static Extra pages schema validation", async ({page}) => {
  // Iterate over static pages without breadcrumbs
  for (const url of staticPagesUrlsWOBreadcrumbs) {
    await page.goto(`/${url}`);
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
    const detectedStaticpagesSchemas = extractedSchemas.map((s) => s["@type"]);
    const requiredSchemas = ["Product"];
    const missingSchemas = requiredSchemas.filter(
      (s) => !detectedStaticpagesSchemas.includes(s)
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
      const expected = expectedProductSchema;
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
        "StaticExtraPages-schema-validation-report.json"
      );
    } catch (e) {
      console.error("Failed to write report.json:", e);
    }

    // Report is saved to file; avoid redundant console output here.
    expect(report.result).toBe("PASSED");
  }
});

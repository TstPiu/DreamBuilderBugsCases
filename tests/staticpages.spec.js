import {test, expect} from "@playwright/test";
import {expectedSchemas, compareObjects, saveReportToJson} from "./utils.js";

const staticPagesUrlsWOBreadcrumbs = [
  "portland-party-bus-prices/",
  "about-us/",
  "contact-us/",
  "sitemap/",
  "privacy-policy/",
];

const staticPagesUrlsWithBreadcrumbs = [
  "our-fleet/",
  "group-transportation-services/",
  "service-area/",
];

async function validatePageSchema(page, url, context) {
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
  const requiredSchemas = getRequiredSchemas(url);
  const missingSchemas = requiredSchemas.filter(
    (s) => !detectedStaticpagesSchemas.includes(s)
  );

  const report = {
    page_slug: url,
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
    const slug = url.replace(/\/$/, "").replace(/\//g, "-");
    const fileName = `static-page-${context}-${slug}-schema-${report.result}.json`;
    saveReportToJson(report, "My Report", fileName);
  } catch (e) {
    console.error("Failed to write report.json:", e);
  }

  // Report is saved to file; avoid redundant console output here.
  expect(report.result).toBe("PASSED");
}

// required schemas as per rules
function getRequiredSchemas(url) {
  // For static pages with breadcrumbs, where service-area only have "BreadcrumbList" schema
  if (url.includes("service-area")) {
    return ["BreadcrumbList"];
  }

  // For static pages with breadcrumbs, we expect "Product" and "BreadcrumbList" schemas
  if (
    url.includes("our-fleet") ||
    url.includes("group-transportation-services")
  ) {
    return ["Product", "BreadcrumbList"];
  }

  // For static pages, we expect only "Product" schema except for sitemap page
  if (url.includes("sitemap")) {
    return [];
  }

  return ["Product"];
}

test("Static pages without breadcrumbs schema validation", async ({page}) => {
  for (const url of staticPagesUrlsWOBreadcrumbs) {
    await validatePageSchema(page, url, "wobreadcrumbs");
  }
});

test("Static pages with breadcrumbs schema validation", async ({page}) => {
  for (const url of staticPagesUrlsWithBreadcrumbs) {
    await validatePageSchema(page, url, "withbreadcrumbs");
  }
});

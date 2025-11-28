import * as fs from "fs";
import * as path from "path";

/**
 * Reusable function to save test reports as JSON files
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
      fs.mkdirSync(dirName, {recursive: true});
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

    return filePath;
  } catch (error) {
    console.error(`✗ Failed to save report: ${error.message}`);
    throw error;
  }
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

export function compareObjects(expected, actual, schemaType, path, diffs) {
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

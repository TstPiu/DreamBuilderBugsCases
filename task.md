# Schema Testing Guidelines for Website

## 1. Global Variables (Dynamic Values)

These variables are injected into the schema and will change periodically:

```javascript
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
  reviewCount: "29",
};
```

---

## 2. Purpose of This Document

This `.md` file explains:

- How to fetch schema from any provided website URL.
- How to extract all `<script type="application/ld+json">` blocks.
- How to validate the presence of 3 required schema types:
  - **LocalBusiness**
  - **Product**
  - **WebSite**
- How to perform a **Web schema comparison** with a given example schema structure.
- How to generate an **accurate report in a JSON file** with a proper format and exact error text.
- How to return **pass/fail** results.
- How to output the extracted schema even when the test passes.
- How schema fetching works internally.

---

## 3. Required Schema Types

Every target URL must contain **exactly three** schema types:

| Schema Type     | Required | Description |
|-----------------|----------|-------------|
| LocalBusiness   | Yes      | Core business identity & contact details |
| Product         | Yes      | Rating and review metadata |
| WebSite         | Yes      | Website-level identity |

If any type is missing → **Test Failed**  
If all exist → **Test Passed**

---

## 4. Example Schema Structure

(Example LocalBusiness, Product, WebSite schemas — unchanged)

### LocalBusiness Schema

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "${website_url}#localbusiness",
  "name": "${default_city} Party Bus Company",
  "url": "${website_url}",
  "logo": "${_img-${default_city_small}-party-bus-company-logo}",
  "telephone": "+1-${mobile_num_text}",
  "description": "${default_city} Party Bus Company is a highly rated provider of limousine buses, sprinter vans, charter buses, minibuses & party buses in ${default_city}, ${default_state} open 24/7/365. Experienced reservation agents are available at ${mobile_num_text}",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Downtown",
    "addressLocality": "${default_city}",
    "addressRegion": "${default_address_region}",
    "addressCountry": "${default_country}",
    "areaServed": "${default_city}, ${default_address_region}"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday", "Sunday"
    ],
    "opens": "00:00",
    "closes": "23:59"
  }]
}
```

### Product Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Produ- With the full JSON payload  
ct",
  "name": "${default_city} Party Bus Company",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "${ratingValue}",
    "bestRating": "${bestRating}",
    "reviewCount": "${reviewCount}"
  }
}
```

### WebSite Schema

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${default_city} Party Bus Company",
  "url": "${website_url}"
}
```
---


## 5. Test Logic (Automation Workflow)

### **Step 1 — Fetch Page HTML**
Using **Playwright with javascript** , load the page and extract its HTML.

### **Step 2 — Extract All Schema Tags**
Extract all matching elements:

```html
<script type="application/ld+json">
```

Then parse them into JSON objects.

### **Step 3 — Identify Schema Types**
From each schema JSON object, read:

```json
"@type": "LocalBusiness"
```

Collected types look like:

```
["LocalBusiness", "Product", "WebSite"]
```

### **Step 4 — Validate and Compare Schemas**

The script validates the extracted schemas in two stages:
1.  **Presence Check**: It ensures all `requiredSchemas` (`LocalBusiness`, `Product`, `WebSite`) are present.
2.  **Structural Comparison**: It performs a deep comparison of each extracted schema against the example structures provided in this document.

**Fail/Pass Logic:**
- **If any required schema is missing → Fail**
- **If a mismatch is found during comparison → Fail**
- **If all schemas are present and match the structure → Pass**

### **Step 5 — Generate JSON Report**
The script generates a detailed `report.json` file. This file provides:
- A clear `pass` or `fail` status.
- Exact error text for mismatches. For example:
  > `"bestRating" is not matched - It supposed to be "${bestRating}" instead of Its 'wrongvalue'."`
- The complete extracted schema for debugging purposes.

---

## 6. Expected Output Format

### ✔ PASS Example

```
TEST RESULT: PASSED

Detected Schemas:
- LocalBusiness
- Product
- WebSite

Extracted Schema Output:
[ ...full schema array... ]
```

### ❌ FAIL Example (Missing Schema)

```
TEST RESULT: FAILED
Missing Schema Types: Product

Extracted Schema Output:
[ ...schema JSON... ]
```

### ❌ FAIL Example (Mismatch Error in JSON Report)

If a value does not match the expected structure, the JSON report will pinpoint the error:

```json
{
  "result": "FAILED",
  "error": "Schema mismatch found in 'Product' schema.",
  "details": {
    "field": "bestRating",
    "expected": "${bestRating}",
    "found": "wrongvalue",
    "message": "\"bestRating\" is not matched - It supposed to be \"${bestRating}\" instead of Its 'wrongvalue'."
  },
  "extracted_schema": "[...full schema array...]"
}
```

---

## 7. Notes

- Variables in `${...}` must be replaced using `globalVariables`.  
- Minified schema should still be parsed correctly.  
- Multiple schema blocks may appear — all must be collected.  

---

## 8. How to Use

Whenever you provide a website URL, the test script will:

1.  Fetch the webpage.
2.  Extract all JSON-LD schema.
3.  Validate required types and compare against the example structure.
4.  Generate a `report.json` with a `pass`/`fail` result and detailed error messages.
5.  Output the full extracted schema for verification.

---

# 9. How Schema Is Fetched & How All Schemas Are Displayed

### **9.1 — How schema is fetched**

Internally, the process follows:

1. Open URL  
2. Collect HTML  
3. Find all:

```html
<script type="application/ld+json">
```

4. Extract `.textContent` from each  
5. Parse with `JSON.parse()`  
6. Store them into an array:

```json
[
  {...LocalBusiness...},
  {...Product...},
  {...WebSite...}
]
```

---

### **9.2 — How all schemas are shown in output**

Regardless of pass/fail:

- Each schema is printed  
- With its index  
- With its detected `@type`  
- With the full JSON payload  

Example:

```
SCHEMA 1 — LocalBusiness
{ ...full json... }

SCHEMA 2 — Product
{ ...full json... }

SCHEMA 3 — WebSite
{ ...full json... }
```

This guarantees full transparency.

---

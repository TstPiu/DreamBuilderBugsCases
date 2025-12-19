# H2 & P Tag Uniqueness Validation Guidelines

## Objective

Ensure that **all `<h2>` and `<p>` tags on each webpage are unique** within the same page.  
Additionally, generate a **JSON validation report for each page**, clearly indicating **PASS or FAIL status** with detailed failure reasons.

---

## Scope

- Validation is performed **page by page** across the entire website.
- Uniqueness is enforced **within the same page only**.
- JSON report must include results for both `<h2>` and `<p>` tags.

---

## Validation Rules

1. Visit a webpage.
2. Extract all `<h2>` and `<p>` elements from the DOM.
3. Normalize text values for accurate comparison:
   - Trim leading and trailing spaces
   - Convert text to lowercase
   - Collapse multiple spaces into one
4. Compare all normalized values within their respective tag types.
5. Detect any **duplicate `<h2>` or `<p>` text** within the page.

---

## Result Evaluation

### PASS Criteria
- All `<h2>` tags are unique.
- All `<p>` tags are unique.

### FAIL Criteria
- One or more `<h2>` or `<p>` tags repeat **the same text** within the page.

---

## JSON Report Structure (Per Page)

A JSON report **must be generated for every page**, regardless of pass or fail.

### Common Fields

| Field | Description |
|-------|-------------|
| `pageUrl` | URL of the validated page |
| `checkName` | Name of the validation |
| `status` | `PASS` or `FAIL` |
| `h2` | Object containing `<h2>` validation results |
| `p` | Object containing `<p>` validation results |
| `timestamp` | Validation execution time |

---

## Example JSON Report (PASS)

```json
{
  "pageUrl": "https://example.com/about-us",
  "checkName": "H2 & P Tag Uniqueness Validation",
  "status": "PASS",
  "h2": {
    "totalCount": 4
  },
  "p": {
    "totalCount": 6
  },
  "timestamp": "2025-12-18T10:30:00Z"
}

---

## Example JSON Report (FAIL)

```json
{
  "pageUrl": "https://example.com/services",
  "checkName": "H2 & P Tag Uniqueness Validation",
  "status": "FAIL",
  "h2": {
    "totalCount": 5,
    "uniqueCount": 3,
    "duplicates": [
      {
        "text": "our services",
        "occurrences": 2
      },
      {
        "text": "pricing",
        "occurrences": 2
      }
    ]
  },
  "p": {
    "totalCount": 8,
    "uniqueCount": 7,
    "duplicates": [
      {
        "text": "contact us for a quote",
        "occurrences": 2
      }
    ]
  },
  "timestamp": "2025-12-18T10:32:15Z"
}



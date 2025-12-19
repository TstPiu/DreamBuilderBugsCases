const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * WHITELIST: Strings that are allowed to repeat without being flagged as duplicates
 * These strings will not be counted as failures even if they appear multiple times
 */
const ALLOWED_DUPLICATES = [
    "book your bus today!",
    "see pictures & prices in seconds",
    "live agents available 24/7/365!"
];

/**
 * Normalize text for accurate comparison
 * - Trim leading and trailing spaces
 * - Convert to lowercase
 * - Collapse multiple spaces into one
 */
function normalizeText(text) {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Find duplicates in an array of text values
 * Returns an object with duplicate detection results
 * Excludes whitelisted strings from being flagged as duplicates
 */
function findDuplicates(texts) {
    const normalizedTexts = texts.map(normalizeText);
    const countMap = {};

    // Normalize whitelist for comparison
    const normalizedWhitelist = ALLOWED_DUPLICATES.map(normalizeText);

    // Count occurrences of each normalized text
    normalizedTexts.forEach(text => {
        if (text) { // Skip empty strings
            countMap[text] = (countMap[text] || 0) + 1;
        }
    });

    // Find duplicates (excluding whitelisted items)
    const duplicates = [];
    const whitelistedDuplicates = [];

    Object.entries(countMap).forEach(([text, count]) => {
        if (count > 1) {
            // Check if this text is in the whitelist
            if (normalizedWhitelist.includes(text)) {
                // Track whitelisted duplicates separately for reporting
                whitelistedDuplicates.push({
                    text: text,
                    occurrences: count
                });
            } else {
                // Only flag non-whitelisted duplicates
                duplicates.push({
                    text: text,
                    occurrences: count
                });
            }
        }
    });

    return {
        totalCount: texts.length,
        uniqueCount: Object.keys(countMap).length,
        duplicates: duplicates,
        whitelistedDuplicates: whitelistedDuplicates
    };
}

/**
 * Generate JSON report for tag uniqueness validation
 */
function generateReport(pageUrl, h2Results, pResults) {
    const hasDuplicates = h2Results.duplicates.length > 0 || pResults.duplicates.length > 0;

    const report = {
        pageUrl: pageUrl,
        checkName: "H2 & P Tag Uniqueness Validation",
        status: hasDuplicates ? "FAIL" : "PASS",
        timestamp: new Date().toISOString()
    };

    // Add h2 results
    if (hasDuplicates && h2Results.duplicates.length > 0) {
        report.h2 = {
            totalCount: h2Results.totalCount,
            uniqueCount: h2Results.uniqueCount,
            duplicates: h2Results.duplicates
        };
    } else {
        report.h2 = {
            totalCount: h2Results.totalCount
        };
    }

    // Add p results
    if (hasDuplicates && pResults.duplicates.length > 0) {
        report.p = {
            totalCount: pResults.totalCount,
            uniqueCount: pResults.uniqueCount,
            duplicates: pResults.duplicates
        };
    } else {
        report.p = {
            totalCount: pResults.totalCount
        };
    }

    return report;
}

/**
 * Save JSON report to file
 * Note: This function is no longer used for individual page reports
 * Only the summary report is generated
 */
function saveSummaryReport(summaryReport, directory = 'My Report') {
    // Create directory if it doesn't exist
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const timestamp = new Date().getTime();
    const filename = `summary_${timestamp}.json`;
    const filepath = path.join(directory, filename);

    // Write report to file
    fs.writeFileSync(filepath, JSON.stringify(summaryReport, null, 2));
    console.log(`\n📄 Summary report saved to: ${filepath}`);

    return filepath;
}

/**
 * Discover all internal links on a website
 * Crawls the site starting from baseUrl and returns all unique internal URLs
 */
async function discoverAllPages(page, baseUrl) {
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

/**
 * Validate a single page for tag uniqueness
 */
async function validatePage(page, url) {

    try {
        // Navigate to the page
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Extract all h2 tags text content
        const h2Texts = await page.$$eval('h2', elements =>
            elements.map(el => el.textContent)
        );

        // Extract all p tags text content
        const pTexts = await page.$$eval('p', elements =>
            elements.map(el => el.textContent)
        );

        // Analyze h2 tags for duplicates
        const h2Results = findDuplicates(h2Texts);

        // Analyze p tags for duplicates
        const pResults = findDuplicates(pTexts);

        // Generate report
        const report = generateReport(url, h2Results, pResults);

        // Note: Individual page reports are no longer saved
        // Only summary report will be generated at the end

        return report;

    } catch (error) {
        console.log(`❌ Error validating ${url}: ${error.message}`);
        return null;
    }
}

/**
 * Main validation test - Crawls entire website and validates each page
 */
test.describe('H2 & P Tag Uniqueness Validation - Full Website', () => {

    test('Validate tag uniqueness across all pages', async ({ page }) => {
        // Configure the base URL - the script will discover all pages from here
        const baseUrl = 'https://onepagewebsite.online/';

        // Discover all pages on the website
        const allPages = await discoverAllPages(page, baseUrl);

        console.log('\n' + '='.repeat(80));
        console.log('📋 Pages to validate:');
        allPages.forEach((url, index) => {
            console.log(`   ${index + 1}. ${url}`);
        });
        console.log('='.repeat(80));

        // Validate each page
        const allReports = [];
        for (const url of allPages) {
            const report = await validatePage(page, url);
            if (report) {
                allReports.push(report);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total pages validated: ${allReports.length}`);
        console.log(`Pages passed: ${allReports.filter(r => r.status === 'PASS').length}`);
        console.log(`Pages failed: ${allReports.filter(r => r.status === 'FAIL').length}`);
        console.log('='.repeat(80));

        // Save comprehensive summary report
        const summaryReport = {
            checkName: "H2 & P Tag Uniqueness Validation - Full Website",
            baseUrl: baseUrl,
            allowedDuplicates: ALLOWED_DUPLICATES,
            summary: {
                totalPages: allReports.length,
                passed: allReports.filter(r => r.status === 'PASS').length,
                failed: allReports.filter(r => r.status === 'FAIL').length
            },
            timestamp: new Date().toISOString(),
            pageResults: allReports
        };

        saveSummaryReport(summaryReport);

        // Optional: Assert that all pages pass
        // Uncomment the line below if you want the test to fail when any page has non-whitelisted duplicates
        // expect(allReports.filter(r => r.status === 'FAIL').length).toBe(0);
    });

});

/**
 * USAGE:
 * 
 * 1. Run validation on entire website:
 *    npx playwright test tests/tagsCompare.spec.js
 * 
 * 2. The script will:
 *    - Discover all internal pages from the base URL
 *    - Validate each page for h2 and p tag uniqueness
 *    - Generate a single comprehensive summary report
 *    - Create a summary report with all results
 * 
 * 3. To make the test fail when duplicates are found:
 *    - Uncomment the expect() assertion at the end
 */

const { test, expect } = require('@playwright/test');
const { saveReportToJson, discoverAllPages } = require('./utils.js');

/**
 * Validate all anchor tags on a single page for href attribute
 * Returns detailed report of validation results
 */
async function validateAnchorTags(page, url) {
    try {
        // Navigate to the page
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Extract all anchor tags and check for href attribute
        const anchorResults = await page.$$eval('a', (anchors) => {
            return anchors.map((anchor, index) => {
                const href = anchor.getAttribute('href');
                const text = anchor.textContent.trim();
                const hasHref = href !== null && href !== undefined && href !== '';

                return {
                    index: index + 1,
                    text: text || '(no text)',
                    href: href || null,
                    hasHref: hasHref,
                    status: hasHref ? 'PASS' : 'FAIL'
                };
            });
        });

        // Count PASS and FAIL
        const totalAnchors = anchorResults.length;
        const passCount = anchorResults.filter(a => a.status === 'PASS').length;
        const failCount = anchorResults.filter(a => a.status === 'FAIL').length;
        const failedAnchors = anchorResults.filter(a => a.status === 'FAIL');

        // Overall page status
        const pageStatus = failCount === 0 ? 'PASS' : 'FAIL';

        const report = {
            pageUrl: url,
            status: pageStatus,
            summary: {
                totalAnchors: totalAnchors,
                passed: passCount,
                failed: failCount
            },
            failedAnchors: failedAnchors.length > 0 ? failedAnchors : undefined
        };

        // Log results for this page
        console.log(`\n📄 Page: ${url}`);
        console.log(`   Total anchor tags: ${totalAnchors}`);
        console.log(`   ✅ PASS: ${passCount}`);
        console.log(`   ❌ FAIL: ${failCount}`);
        if (failCount > 0) {
            console.log(`   Failed anchors:`);
            failedAnchors.forEach(anchor => {
                console.log(`      - Index ${anchor.index}: "${anchor.text}"`);
            });
        }

        return report;

    } catch (error) {
        console.log(`❌ Error validating ${url}: ${error.message}`);
        return {
            pageUrl: url,
            status: 'ERROR',
            error: error.message
        };
    }
}

/**
 * Main validation test - Crawls entire website and validates anchor tags on each page
 */
test.describe('Anchor Tag Href Validation - Full Website', () => {

    test('Validate all anchor tags have href attribute on all pages', async ({ page }) => {
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
            const report = await validateAnchorTags(page, url);
            if (report) {
                allReports.push(report);
            }
        }

        // Calculate overall summary
        const totalPassed = allReports.filter(r => r.status === 'PASS').length;
        const totalFailed = allReports.filter(r => r.status === 'FAIL').length;
        const totalErrors = allReports.filter(r => r.status === 'ERROR').length;

        // Summary console output
        console.log('\n' + '='.repeat(80));
        console.log('📊 ANCHOR TAG VALIDATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total pages validated: ${allReports.length}`);
        console.log(`✅ Pages passed: ${totalPassed}`);
        console.log(`❌ Pages failed: ${totalFailed}`);
        console.log(`⚠️  Pages with errors: ${totalErrors}`);
        console.log('='.repeat(80));

        // Create comprehensive report for all pages
        const comprehensiveReport = {
            checkName: "Anchor Tag Href Validation - Full Website",
            baseUrl: baseUrl,
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: allReports.length,
                passed: totalPassed,
                failed: totalFailed,
                errors: totalErrors
            },
            pageResults: allReports
        };

        // Save report using the reusable function from utils.js
        const reportPath = saveReportToJson(
            comprehensiveReport,
            'My Report',
            'anchor-tag-validation-report'
        );

        console.log(`\n📄 Report saved to: ${reportPath}`);

        // Optional: Assert that all pages pass
        // Uncomment the line below if you want the test to fail when any anchor tag is missing href
        // expect(totalFailed).toBe(0);
    });

});

/**
 * USAGE:
 * 
 * 1. Run validation on entire website:
 *    npx playwright test tests/anchorTagValidation.spec.js
 * 
 * 2. The script will:
 *    - Discover all internal pages from the base URL
 *    - Validate each anchor tag on every page for href attribute
 *    - Generate a single comprehensive JSON report in "My Report" folder
 *    - Display summary in console
 * 
 * 3. To make the test fail when anchor tags without href are found:
 *    - Uncomment the expect() assertion at the end
 * 
 * 4. Report structure:
 *    - Overall summary with total pages, passed, failed counts
 *    - Individual page results with details of failed anchor tags
 *    - Failed anchor tags include: index, text content, and href value (null)
 */

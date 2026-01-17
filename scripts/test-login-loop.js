/**
 * Test Login Loop Script
 * This script simulates the login flow to detect redirect loops
 */

const puppeteer = require('puppeteer');

async function testLoginLoop() {
    console.log('🧪 Testing Login Loop...\n');

    let browser;
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Track redirects
        const redirects = [];
        page.on('response', response => {
            if (response.status() >= 300 && response.status() < 400) {
                console.log(`Redirect: ${response.url()} -> ${response.headers().location}`);
                redirects.push({
                    from: response.url(),
                    to: response.headers().location,
                    status: response.status()
                });
            }
        });

        // Track navigation
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) {
                console.log(`Navigated to: ${frame.url()}`);
            }
        });

        console.log('1️⃣ Loading login page...');
        await page.goto('http://localhost:2311/aperture/login', { waitUntil: 'networkidle2' });

        // Check if we get stuck in loading
        const loadingElement = await page.$('text=Cargando...');
        if (loadingElement) {
            console.log('⚠️  Page stuck in loading state');

            // Wait a bit more to see if it resolves
            await page.waitForTimeout(5000);

            const stillLoading = await page.$('text=Cargando...');
            if (stillLoading) {
                console.log('❌ Page still stuck in loading after 5 seconds');
                return;
            }
        }

        console.log('2️⃣ Attempting login...');

        // Fill login form
        await page.type('input[name="email"]', 'marco.gallegos@anchor23.mx');
        await page.type('input[name="password"]', 'Marco123456!');

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for navigation or error
        try {
            await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle2' });
            console.log('✅ Navigation completed');
            console.log(`Final URL: ${page.url()}`);
        } catch (error) {
            console.log('❌ Navigation timeout or error');
            console.log(`Current URL: ${page.url()}`);

            // Check for error messages
            const errorElement = await page.$('[class*="text-red-600"]');
            if (errorElement) {
                const errorText = await page.evaluate(el => el.textContent, errorElement);
                console.log(`Error message: ${errorText}`);
            }
        }

        console.log('\n📊 Redirect Summary:');
        redirects.forEach((redirect, index) => {
            console.log(`${index + 1}. ${redirect.from} -> ${redirect.to} (${redirect.status})`);
        });

        if (redirects.length > 3) {
            console.log('⚠️  Multiple redirects detected - possible loop!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testLoginLoop();
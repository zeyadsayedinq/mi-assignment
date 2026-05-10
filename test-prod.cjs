const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));

const server = app.listen(5000, async () => {
    console.log('Server started on port 5000');
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log('PAGE LOG (' + msg.type() + '):', msg.text());
        });
        page.on('pageerror', err => {
            console.log('PAGE ERROR:', err.message);
            console.log('PAGE ERROR STACK:', err.stack);
        });
        await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
        const html = await page.evaluate(() => document.body.innerHTML);
        console.log('COMPLETE HTML:', html);
        
        await browser.close();
    } catch(e) {
        console.error(e);
    } finally {
        server.close();
    }
});

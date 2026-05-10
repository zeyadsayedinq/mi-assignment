const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG (' + msg.type() + '):', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
        page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
        
        await page.goto('https://69f6115b0a6be20008f618d0--mi-assignment.netlify.app/', { waitUntil: 'networkidle0' });
        
        const divHtml = await page.evaluate(() => document.querySelector('#root').innerHTML);
        console.log('DIV HTML:', divHtml);
        const childLength = await page.evaluate(() => document.querySelector('#root > div')?.children.length);
        console.log('CHILD LENGTH:', childLength);
        const childAttrs = await page.evaluate(() => {
           const div = document.querySelector('#root > div');
           if (!div) return null;
           return Array.from(div.attributes).map(a => `${a.name}="${a.value}"`);
        });
        console.log('CHILD ATTRS:', childAttrs);
        const scripts = await page.evaluate(() => Array.from(document.scripts).map(s => s.src ? s.src : s.innerHTML));
        console.log('SCRIPTS:', scripts);
        
        await page.screenshot({ path: 'test.png' });
        
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();

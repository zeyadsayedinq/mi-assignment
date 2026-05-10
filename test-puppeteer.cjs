const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text(), msg.location()?.url, msg.location()?.lineNumber);
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR STR:', err.toString());
    console.log('PAGE ERROR STACK:', err.stack);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();

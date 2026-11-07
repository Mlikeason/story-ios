/* Run from the repository root with Playwright and Chrome. No active SVG fragment: poster frames only. */
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({channel: 'chrome'});
  try {
    const page = await b.newPage({viewport: {width: 1024, height: 1024}, reducedMotion: 'reduce'});
    fs.mkdirSync('Resources/Covers', {recursive: true});
    for (const {id} of JSON.parse(fs.readFileSync('Resources/recordings.json','utf8'))) {
      const svg = fs.readFileSync(path.join('Resources/Artwork', id+'.svg')).toString('base64');
      await page.setContent('<style>*{margin:0}img{display:block;width:100vw;height:100vh}</style><img src="data:image/svg+xml;base64,'+svg+'">');
      await page.locator('img').evaluate(img=>img.decode());
      await page.screenshot({type:'jpeg',quality:94,path:path.join('Resources/Covers',id+'.jpg')});
    }
  } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

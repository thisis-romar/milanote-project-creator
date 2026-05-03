import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];
const cookies = (await ctx.cookies()).filter(c => c.domain.includes('milanote.com'));
const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
await browser.close();

const ids = ['1Wd9Kk1YamXgYd', 'IvsEEJkd8ZJmRX', 'XYx4R7DkNNLKBt', 'wleCaJZxMTHHMV', 'rxfkC4C9MFSZks'];

for (const id of ids) {
  const resp = await fetch(`https://app.milanote.com/api/elements?ids=${id}&includeChildren=true`, {
    headers: { cookie: cookieHeader, accept: 'application/json' }
  });
  const elems = (await resp.json()).elements ?? {};
  const count = Object.keys(elems).length;
  const types = [...new Set(Object.values(elems).map(e => e.elementType))];
  console.log(`\n${id}: ${count} elements, types=${JSON.stringify(types)}`);
  for (const [eid, el] of Object.entries(elems).slice(0, 8)) {
    console.log(`  ${eid}  ${el.elementType}  "${el.content?.title ?? ''}"  parent=${el.location?.parentId ?? ''}`);
  }
}

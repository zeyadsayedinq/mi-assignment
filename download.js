import fs from 'fs';
import { pipeline } from 'stream/promises';

async function run() {
  const fileId = '1LQxLp_gYSMgid9-69Y1RXOhYWL335YV2';
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  
  const dest = fs.createWriteStream('app.zip');
  if (res.body) {
    const reader = res.body.getReader();
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      dest.write(value);
    }
    dest.end();
    console.log('Downloaded');
  }
}
run().catch(console.error);

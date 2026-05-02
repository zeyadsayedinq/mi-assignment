import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

async function test() {
  let pres = new pptxgen();
  pres.addSlide().addText("Hello");
  try {
    const blob = await pres.write({ outputType: 'blob' });
    console.log("Blob created:", typeof blob);
  } catch(e) {
    console.log("Write failed:", e);
  }
}
test();

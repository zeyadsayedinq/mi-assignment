async function test() {
  try {
    const res = await fetch("http://127.0.0.1:3000/src/lib/gemini.ts");
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();

import { fetchAndParseSubscription } from './src/server/parser/index.js';

async function test() {
  try {
    const res = await fetchAndParseSubscription('https://raw.githubusercontent.com/Dreamacro/clash/master/docs/config.yaml');
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();

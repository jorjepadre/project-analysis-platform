import { Browser, chromium } from 'playwright';

class DeBankAdapter {
  private static adapter: DeBankAdapter | null = null;

  constructor(private browser: Browser) {}

  static async init() {
    if (this.adapter !== null) {
      return this.adapter;
    }

    const browser = await chromium.launch();
    const adapter = new DeBankAdapter(browser);
    DeBankAdapter.adapter = adapter;
    return adapter;
  }

  async fetchPools() {
    const page = await this.browser.newPage();
    const res = await page.goto('https://api.debank.com/protocol/pools?start=0&limit=20&id=curve&name=');
    console.log(await res?.json());
  }
}

async function main() {
  const adapter = await DeBankAdapter.init();
  await adapter.fetchPools();
}

main();

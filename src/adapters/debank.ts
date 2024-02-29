import { Browser, Page, chromium } from 'playwright';

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

  async fetchByBrowser(...params: Parameters<Page['goto']>) {
    console.info(`fetchByBrowser params=${params.toString()}`);
    const page = await this.browser.newPage();
    const res = await page.goto(...params);
    if (res === null) {
      throw new PlaywrightGotoError(params[0]);
    }

    return res.json();
  }

  async getProtocols() {
    const baseUrl = 'https://api.debank.com/protocol/list';
    const params = {
      start: '0',
      limit: '10000',
      chain_id: '',
      pool_name: '',
      q: '',
      order_by: '-deposit_usd_value',
    };

    const rawProtocols = await this.fetchByBrowser(baseUrl + '?' + new URLSearchParams(params).toString());
    console.log(rawProtocols);
  }

  clearCache() {}
}

async function main() {
  const adapter = await DeBankAdapter.init();
  await adapter.getProtocols();
}

main();

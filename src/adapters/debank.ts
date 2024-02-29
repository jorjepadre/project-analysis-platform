import { Browser, Page, chromium } from 'playwright';
import { writeFile } from 'fs/promises';

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

  async destroy() {
    await this.browser.close();
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

  async getProtocols(name: string = '') {
    const baseUrl = 'https://api.debank.com/protocol/list';
    const params = {
      start: '0',
      limit: '10000',
      chain_id: '',
      pool_name: '',
      q: name,
      order_by: '-deposit_usd_value',
    };

    const rawData = await this.fetchByBrowser(baseUrl + '?' + new URLSearchParams(params).toString());
    return rawData;
  }

  async getPools(id: string, start = 0) {
    const baseUrl = 'https://api.debank.com/protocol/pools';
    const params = {
      start: start.toString(),
      limit: '20',
      name: '',
      id,
    };

    const rawData = await this.fetchByBrowser(baseUrl + '?' + new URLSearchParams(params).toString());
    return rawData;
  }

  clearCache() {}
}

async function main() {
  const adapter = await DeBankAdapter.init();
  const data = await adapter.getPools('bsc_wault');
  await writeFile('.out/debank.json', JSON.stringify(data, null, 4));
  await adapter.destroy();
}

main();

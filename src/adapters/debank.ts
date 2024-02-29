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

  async getUserProfile(address: string) {
    const responses: string[] = [];
    const page = await this.browser.newPage();
    page.on('response', async (response) => {
      const monitorList = ['https://api.debank.com/portfolio/project_list'];
      const isRelevant = monitorList.some((str) => response.url().startsWith(str));
      if (!isRelevant) return;

      try {
        responses.push(await response.text());
      } catch (e) {
        console.warn(e);
      }
    });
    const promise = page.waitForResponse('https://festats.debank.com/mainsite/portfolioLoadTime*');
    await page.goto(`https://debank.com/profile/${address}`);
    await promise;
    await writeFile('.out/responses.json', JSON.stringify(JSON.parse(responses.toString()), null, 4));
  }

  clearCache() {}
}

async function main() {
  const adapter = await DeBankAdapter.init();
  const data = await adapter.getUserProfile('0xd77dbe428f22cf47f019ef826a1e365df3cb5494');
  await adapter.destroy();
}

main();

import { sql } from 'drizzle-orm';
import { snakeCase } from 'lodash';
import { Browser, Page, chromium } from 'playwright';
import { db, debankPools, debankProtocols } from '@/db';
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
    const data = await db
      .insert(debankProtocols)
      .values(
        rawData.data.protocols.map((p: any) => ({
          id: p.id,
          name: p.name,
          chain: p.chain,
          logoUrl: p.logo_url,
          siteUrl: p.site_url,
          tvl: p.tvl,
          userCount: p.stats?.deposit_user_count ?? null,
          valuableUserCount: p.stats?.deposit_valuable_user_count ?? null,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          tvl: sql`values(tvl)`,
          userCount: sql`values(user_count)`,
          valuableUserCount: sql`values(valuable_user_count)`,
        },
      });

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
    const data = await db
      .insert(debankPools)
      .values(
        rawData.data.pools.map((p: any) => ({
          chain: p.chain,
          id: p.id,
          controller: p.controller,
          index: p.index,
          investmentType: snakeCase(p.name),
          projectId: p.project_id,
          adapterId: p.adapter_id,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          chain: sql`chain`,
          id: sql`id`,
        },
      });

    console.log({ data });

    return rawData;
  }

  async getUserProfile(address: string, refresh = false) {
    const responses: any[] = [];
    const page = await this.browser.newPage();
    page.on('response', async (response) => {
      const isRelevant = response.url().startsWith('https://api.debank.com/portfolio/');
      if (!isRelevant) return;

      try {
        const url = response.url();
        if (url.includes('apeswap')) {
          console.log(url, await response.text());
        }
        responses.push(JSON.parse(await response.text()));
      } catch (e) {
        console.warn(response.url(), await response.text());
      }
    });
    const portfolioLoadPromise = page.waitForResponse('https://festats.debank.com/mainsite/portfolioLoadTime*');
    await page.goto(`https://debank.com/profile/${address}`);
    await portfolioLoadPromise;
    await writeFile('.out/responses.json', JSON.stringify(responses, null, 4));

    if (!refresh) return;

    const realtimeLoadPromise = page.waitForResponse('https://festats.debank.com/mainsite/realtimePortfoliosLoadTime*');
    const refreshButton = page.locator('span[class^=UpdateButton_refresh] > svg');
    await refreshButton.click();
    await realtimeLoadPromise;
    // await writeFile('.out/all_responses.txt', responses.toString());
  }

  clearCache() {}
}

async function main() {
  const adapter = await DeBankAdapter.init();
  await adapter.getUserProfile('0x91238f5962b16d61c9d10f233496eb15c3746fd8', true);
  // const data = await adapter.getPools('arb_sushiswap');
  // await writeFile('.out/pools.json', JSON.stringify(data, null, 4));
  await adapter.destroy();
}

main();

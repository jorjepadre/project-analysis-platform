import { int, text, mysqlTable, varchar, decimal, primaryKey, index } from 'drizzle-orm/mysql-core';

export const debankProtocols = mysqlTable('debank_protocols', {
  id: varchar('id', { length: 255 }).primaryKey(),
  chain: varchar('chain', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  siteUrl: text('site_url'),
  tvl: decimal('tvl', { precision: 24, scale: 8 }),
  userCount: int('user_count'),
  valuableUserCount: int('valuable_user_count'),
});

export const debankPools = mysqlTable(
  'debank_pools',
  {
    chain: varchar('chain', { length: 100 }).notNull(),
    id: varchar('id', { length: 255 }).notNull(),
    controller: varchar('controller', { length: 255 }).notNull(),
    index: int('index'),
    projectId: varchar('project_id', { length: 255 }).notNull(),
    adapterId: varchar('adapter_id', { length: 255 }).notNull(),
    // .references(() => debankProtocols.id),
    investmentType: varchar('investment_type', { length: 255 }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chain, table.id] }),
    adapterIndex: index('adapter_id_idx').on(table.adapterId),
  }),
);

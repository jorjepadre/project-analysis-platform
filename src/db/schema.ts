import { int, text, mysqlTable, varchar, decimal } from 'drizzle-orm/mysql-core';

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

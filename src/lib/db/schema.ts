import { mysqlTable, int, varchar, timestamp, boolean } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  roleId: int('role_id'),
  planId: int('plan_id'),
  isActive: boolean('is_active'),
  phone: varchar('phone', { length: 255 }),
});

export const plans = mysqlTable('plans', {
  id: int('id').primaryKey(),
  whatsAppIntegration: boolean('whatsapp_integration'),
});

export const roles = mysqlTable('roles', {
    id: int('id').primaryKey(),
    name: varchar('name', { length: 255 }),
});

export const permissions = mysqlTable('permissions', {
    id: int('id').primaryKey(),
    name: varchar('name', { length: 255 }),
}); 
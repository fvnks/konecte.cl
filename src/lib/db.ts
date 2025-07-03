// src/lib/db.ts
import 'server-only';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './db/schema';

const poolConnection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,
  multipleStatements: true,
});

export const db = drizzle(poolConnection, { 
  schema, 
  mode: 'default',
  logger: {
    logQuery: (query, params) => {
      console.log('SQL Query:', query);
      console.log('Params:', params);
    }
  }
});

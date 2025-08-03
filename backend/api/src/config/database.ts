import pkg, { Pool, PoolClient } from 'pg';
import { config } from './index.js';
import { logger } from './logger.js';

const { Pool: PgPool } = pkg;

let pool: Pool | null = null;

interface QueryResultInterface {
  rows: any[];
  rowCount: number | null;
}

export async function connectDatabase() {
  try {
    const databaseUrl = config.env === 'test' 
      ? config.database.testUrl 
      : config.database.url;

    pool = new PgPool({
      connectionString: databaseUrl,
      min: config.database.pool.min,
      max: config.database.pool.max,
      idleTimeoutMillis: config.database.pool.idle,
      connectionTimeoutMillis: 5000,
      query_timeout: 10000,
      statement_timeout: 10000,
    });

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connected successfully', {
      timestamp: result.rows[0].now,
      poolSize: pool.totalCount,
    });

    // Handle pool errors
    pool.on('error', (err: Error) => {
      logger.error('Unexpected database pool error', { error: err.message });
    });

    return pool;
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to connect to database', { 
      error: err.message,
      stack: err.stack, 
    });
    throw error;
  }
}

export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
    pool = null;
  }
}

// Transaction helper
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!pool) {
    throw new Error('Database not connected');
  }
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Query helper with logging
export async function query(text: string, params: any[] = []): Promise<QueryResultInterface> {
  if (!pool) {
    throw new Error('Database not connected');
  }
  
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Database query executed', {
      query: text,
      duration,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    const err = error as Error;
    const duration = Date.now() - start;
    
    logger.error('Database query failed', {
      query: text,
      params,
      duration,
      error: err.message,
    });
    
    throw error;
  }
}
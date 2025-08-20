import { connectDatabase, getDatabase, closeDatabase, withTransaction, query } from '../../src/config/database.js';
import { config } from '../../src/config/index.js';
import { logger } from '../../src/config/logger.js';
import pkg from 'pg';

// Mock dependencies
jest.mock('../../src/config/index.js');
jest.mock('../../src/config/logger.js');
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

const mockConfig = config as jest.Mocked<typeof config>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockPg = pkg as jest.Mocked<typeof pkg>;

describe('Database Configuration', () => {
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock config
    mockConfig.env = 'test';
    mockConfig.database = {
      url: 'postgresql://test:test@localhost:5432/test',
      testUrl: 'postgresql://test:test@localhost:5432/test_test',
      pool: {
        min: 1,
        max: 10,
        idle: 30000,
      },
    };

    // Mock pool
    mockPool = {
      connect: jest.fn(),
      end: jest.fn(),
      query: jest.fn(),
      on: jest.fn(),
      totalCount: 5,
    };

    // Mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Mock the Pool constructor
    mockPg.Pool.mockImplementation(() => mockPool);
  });

  afterEach(async () => {
    // Clean up any existing pool
    try {
      await closeDatabase();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('connectDatabase', () => {
    test('should connect to database successfully', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      const result = await connectDatabase();

      expect(mockPg.Pool).toHaveBeenCalledWith({
        connectionString: mockConfig.database.testUrl,
        min: mockConfig.database.pool.min,
        max: mockConfig.database.pool.max,
        idleTimeoutMillis: mockConfig.database.pool.idle,
        connectionTimeoutMillis: 5000,
        query_timeout: 10000,
        statement_timeout: 10000,
      });

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Database connected successfully',
        expect.objectContaining({
          timestamp: '2024-01-01T00:00:00Z',
          poolSize: 5,
        })
      );
      expect(result).toBe(mockPool);
    });

    test('should use production URL when not in test environment', async () => {
      mockConfig.env = 'production';
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      expect(mockPg.Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: mockConfig.database.url,
        })
      );
    });

    test('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockPool.connect.mockRejectedValue(connectionError);

      await expect(connectDatabase()).rejects.toThrow('Connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to database',
        expect.objectContaining({
          error: 'Connection failed',
          stack: connectionError.stack,
        })
      );
    });

    test('should handle query errors during connection test', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      const queryError = new Error('Query failed');
      mockClient.query.mockRejectedValue(queryError);

      await expect(connectDatabase()).rejects.toThrow('Query failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to database',
        expect.objectContaining({
          error: 'Query failed',
        })
      );
    });

    test('should set up pool error handler', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));

      // Test the error handler
      const errorHandler = mockPool.on.mock.calls[0][1];
      const poolError = new Error('Pool error');
      errorHandler(poolError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected database pool error',
        { error: 'Pool error' }
      );
    });
  });

  describe('getDatabase', () => {
    test('should return pool when connected', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();
      const result = getDatabase();

      expect(result).toBe(mockPool);
    });

    test('should throw error when not connected', () => {
      expect(() => getDatabase()).toThrow('Database not connected. Call connectDatabase() first.');
    });
  });

  describe('closeDatabase', () => {
    test('should close database connection successfully', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();
      await closeDatabase();

      expect(mockPool.end).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Database connection closed');
    });

    test('should handle close when not connected', async () => {
      await closeDatabase();

      expect(mockPool.end).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    test('should handle close errors gracefully', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });
      mockPool.end.mockRejectedValue(new Error('Close failed'));

      await connectDatabase();
      
      // Should throw error when pool.end() fails
      await expect(closeDatabase()).rejects.toThrow('Close failed');
    });
  });

  describe('withTransaction', () => {
    test('should execute transaction successfully', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      const callback = jest.fn().mockResolvedValue('transaction result');
      const result = await withTransaction(callback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe('transaction result');
    });

    test('should rollback transaction on error', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      const callback = jest.fn().mockRejectedValue(new Error('Transaction failed'));

      await expect(withTransaction(callback)).rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should throw error when not connected', async () => {
      const callback = jest.fn();
      await expect(withTransaction(callback)).rejects.toThrow('Database not connected');
    });

    test('should handle client connection errors', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();
      mockPool.connect.mockRejectedValue(new Error('Client connection failed'));

      const callback = jest.fn();
      await expect(withTransaction(callback)).rejects.toThrow('Client connection failed');
    });
  });

  describe('query', () => {
    test('should execute query successfully', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      const queryText = 'SELECT * FROM users WHERE id = $1';
      const params = [123];
      const queryResult = { rows: [{ id: 123, name: 'Test' }], rowCount: 1 };
      mockPool.query.mockResolvedValue(queryResult);

      const result = await query(queryText, params);

      expect(mockPool.query).toHaveBeenCalledWith(queryText, params);
      expect(result).toEqual(queryResult);
    });

    test('should log query execution details', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      const queryText = 'SELECT * FROM users';
      const queryResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockPool.query.mockResolvedValue(queryResult);

      // Mock Date.now() to return predictable values
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1050); // end time

      await query(queryText);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Database query executed',
        expect.objectContaining({
          query: queryText,
          duration: 50,
          rows: 1,
        })
      );

      // Restore Date.now
      Date.now = originalDateNow;
    });

    test('should handle query errors', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      const queryText = 'SELECT * FROM invalid_table';
      const queryError = new Error('Table does not exist');
      mockPool.query.mockRejectedValue(queryError);

      // Mock Date.now() to return predictable values
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1050); // end time

      await expect(query(queryText)).rejects.toThrow('Table does not exist');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database query failed',
        expect.objectContaining({
          query: queryText,
          duration: 50,
          error: 'Table does not exist',
        })
      );

      // Restore Date.now
      Date.now = originalDateNow;
    });

    test('should throw error when not connected', async () => {
      const queryText = 'SELECT * FROM users';
      await expect(query(queryText)).rejects.toThrow('Database not connected');
    });

    test('should handle query with default parameters', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();

      const queryText = 'SELECT * FROM users';
      const queryResult = { rows: [], rowCount: 0 };
      mockPool.query.mockResolvedValue(queryResult);

      await query(queryText);

      expect(mockPool.query).toHaveBeenCalledWith(queryText, []);
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple connection attempts', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      // First connection
      await connectDatabase();
      const pool1 = getDatabase();

      // Second connection should return same pool
      const pool2 = getDatabase();

      expect(pool1).toBe(pool2);
      expect(mockPg.Pool).toHaveBeenCalledTimes(1);
    });

    test('should handle connection after close', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();
      await closeDatabase();

      // Should be able to connect again
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ now: '2024-01-01T00:00:00Z' }] });

      await connectDatabase();
      expect(getDatabase()).toBe(mockPool);
    });
  });
});

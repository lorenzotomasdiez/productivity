import { jest } from '@jest/globals';

// Mock winston before any imports
const mockCreateLogger = jest.fn();
const mockConsoleTransport = jest.fn();
const mockFileTransport = jest.fn();
const mockCombine = jest.fn();
const mockTimestamp = jest.fn();
const mockErrors = jest.fn();
const mockJson = jest.fn();
const mockPrintf = jest.fn();
const mockColorize = jest.fn();
const mockSimple = jest.fn();

jest.mock('winston', () => ({
  format: {
    combine: mockCombine,
    timestamp: mockTimestamp,
    errors: mockErrors,
    json: mockJson,
    printf: mockPrintf,
    colorize: mockColorize,
    simple: mockSimple,
  },
  transports: {
    Console: mockConsoleTransport,
    File: mockFileTransport,
  },
  createLogger: mockCreateLogger,
}));

describe('Logger Configuration', () => {
  let mockLogger: any;
  let mockAdd: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FILE_PATH;

    mockAdd = jest.fn();
    mockLogger = {
      add: mockAdd,
    };

    mockCreateLogger.mockReturnValue(mockLogger);
    mockConsoleTransport.mockReturnValue({});
    mockFileTransport.mockReturnValue({});
    
    // Set up format mocks to return mock objects
    mockCombine.mockReturnValue({});
    mockTimestamp.mockReturnValue({});
    mockErrors.mockReturnValue({});
    mockJson.mockReturnValue({});
    mockPrintf.mockReturnValue({});
    mockColorize.mockReturnValue({});
    mockSimple.mockReturnValue({});
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should create logger with default configuration', () => {
    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockCreateLogger).toHaveBeenCalledWith({
      level: 'info',
      format: expect.any(Object),
      defaultMeta: { service: 'jarvis-api' },
      transports: [{}],
    });
  });

  it('should create logger with custom log level from environment', () => {
    // Given
    process.env.LOG_LEVEL = 'debug';

    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockCreateLogger).toHaveBeenCalledWith({
      level: 'debug',
      format: expect.any(Object),
      defaultMeta: { service: 'jarvis-api' },
      transports: [{}],
    });
  });

  it('should add file transport in production environment', () => {
    // Given
    process.env.NODE_ENV = 'production';
    process.env.LOG_FILE_PATH = '/var/log/app.log';

    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockFileTransport).toHaveBeenCalledWith({
      filename: '/var/log/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    });
    expect(mockAdd).toHaveBeenCalledWith({});
  });

  it('should add error file transport in production environment', () => {
    // Given
    process.env.NODE_ENV = 'production';

    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockFileTransport).toHaveBeenCalledWith({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    });
    expect(mockAdd).toHaveBeenCalledWith({});
  });

  it('should not add file transports in development environment', () => {
    // Given
    process.env.NODE_ENV = 'development';

    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockFileTransport).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('should not add file transport when LOG_FILE_PATH is not set in production', () => {
    // Given
    process.env.NODE_ENV = 'production';
    // LOG_FILE_PATH not set

    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockFileTransport).toHaveBeenCalledTimes(1); // Only error transport
    expect(mockFileTransport).toHaveBeenCalledWith({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    });
    expect(mockAdd).toHaveBeenCalledWith({});
  });

  it('should create console transport with colorization', () => {
    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockConsoleTransport).toHaveBeenCalledWith({
      format: expect.any(Object),
    });
  });

  it('should create format with timestamp, errors, json, and printf', () => {
    // When
    require('../../src/config/logger.js');

    // Then
    expect(mockCombine).toHaveBeenCalled();
    expect(mockTimestamp).toHaveBeenCalledWith({ format: 'YYYY-MM-DD HH:mm:ss' });
    expect(mockErrors).toHaveBeenCalledWith({ stack: true });
    expect(mockJson).toHaveBeenCalled();
    expect(mockPrintf).toHaveBeenCalled();
  });
});

describe('Request Logger Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;
  let loggerModule: any;
  let mockInfo: jest.Mock;
  let mockWarn: jest.Mock;

  beforeEach(() => {
    // Reset modules to get fresh logger
    jest.resetModules();
    
    mockNext = jest.fn();
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn(),
    };
    mockResponse = {
      statusCode: 200,
      on: jest.fn(),
    };
    
    // Create mock logger functions
    mockInfo = jest.fn();
    mockWarn = jest.fn();
    
    // Import the logger module fresh
    loggerModule = require('../../src/config/logger.js');
    
    // Mock the logger methods after import
    if (loggerModule.logger) {
      loggerModule.logger.info = mockInfo;
      loggerModule.logger.warn = mockWarn;
    }
  });

  it('should call next() immediately', () => {
    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set up response finish event listener', () => {
    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);

    // Then
    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log successful request with info level', () => {
    // Given
    const startTime = 1000;
    const endTime = 1150;
    const mockDateNow = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    mockRequest.get.mockReturnValue('Mozilla/5.0 Test Browser');

    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);
    
    // Get the finish event handler
    const finishHandler = mockResponse.on.mock.calls[0][1];
    finishHandler();

    // Then
    expect(mockInfo).toHaveBeenCalledWith('HTTP request completed', {
      method: 'GET',
      url: '/api/test',
      status: 200,
      duration: 150,
      userAgent: 'Mozilla/5.0 Test Browser',
      ip: '127.0.0.1',
    });
    expect(mockWarn).not.toHaveBeenCalled();
    
    // Clean up
    mockDateNow.mockRestore();
  });

  it('should log error request with warn level', () => {
    // Given
    const startTime = 1000;
    const endTime = 1500;
    const mockDateNow = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    mockResponse.statusCode = 404;
    mockRequest.get.mockReturnValue('Mozilla/5.0 Test Browser');

    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);
    
    // Get the finish event handler
    const finishHandler = mockResponse.on.mock.calls[0][1];
    finishHandler();

    // Then
    expect(mockWarn).toHaveBeenCalledWith('HTTP request completed with error', {
      method: 'GET',
      url: '/api/test',
      status: 404,
      duration: 500,
      userAgent: 'Mozilla/5.0 Test Browser',
      ip: '127.0.0.1',
    });
    expect(mockInfo).not.toHaveBeenCalled();
    
    // Clean up
    mockDateNow.mockRestore();
  });

  it('should handle missing user agent gracefully', () => {
    // Given
    const startTime = 1000;
    const endTime = 1100;
    const mockDateNow = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    mockRequest.get.mockReturnValue(undefined);

    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);
    
    // Get the finish event handler
    const finishHandler = mockResponse.on.mock.calls[0][1];
    finishHandler();

    // Then
    expect(mockInfo).toHaveBeenCalledWith('HTTP request completed', {
      method: 'GET',
      url: '/api/test',
      status: 200,
      duration: 100,
      userAgent: undefined,
      ip: '127.0.0.1',
    });
    
    // Clean up
    mockDateNow.mockRestore();
  });

  it('should handle missing IP address gracefully', () => {
    // Given
    const startTime = 1000;
    const endTime = 1200;
    const mockDateNow = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    mockRequest.ip = undefined;

    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);
    
    // Get the finish event handler
    const finishHandler = mockResponse.on.mock.calls[0][1];
    finishHandler();

    // Then
    expect(mockInfo).toHaveBeenCalledWith('HTTP request completed', {
      method: 'GET',
      url: '/api/test',
      status: 200,
      duration: 200,
      userAgent: undefined,
      ip: undefined,
    });
    
    // Clean up
    mockDateNow.mockRestore();
  });

  it('should calculate duration correctly', () => {
    // Given
    const startTime = 1000;
    const endTime = 1300;
    const mockDateNow = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);
    
    // Get the finish event handler
    const finishHandler = mockResponse.on.mock.calls[0][1];
    finishHandler();

    // Then
    expect(mockInfo).toHaveBeenCalledWith('HTTP request completed', {
      method: 'GET',
      url: '/api/test',
      status: 200,
      duration: 300,
      userAgent: undefined,
      ip: '127.0.0.1',
    });
    
    // Clean up
    mockDateNow.mockRestore();
  });

  it('should handle 5xx status codes as errors', () => {
    // Given
    const startTime = 1000;
    const endTime = 1400;
    const mockDateNow = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    mockResponse.statusCode = 500;
    mockRequest.get.mockReturnValue('Mozilla/5.0 Test Browser');

    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);
    
    // Get the finish event handler
    const finishHandler = mockResponse.on.mock.calls[0][1];
    finishHandler();

    // Then
    expect(mockWarn).toHaveBeenCalledWith('HTTP request completed with error', {
      method: 'GET',
      url: '/api/test',
      status: 500,
      duration: 400,
      userAgent: 'Mozilla/5.0 Test Browser',
      ip: '127.0.0.1',
    });
    expect(mockInfo).not.toHaveBeenCalled();
    
    // Clean up
    mockDateNow.mockRestore();
  });

  it('should handle 4xx status codes as errors', () => {
    // Given
    const startTime = 1000;
    const endTime = 1250;
    const mockDateNow = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    mockResponse.statusCode = 400;
    mockRequest.get.mockReturnValue('Mozilla/5.0 Test Browser');

    // When
    loggerModule.requestLogger(mockRequest, mockResponse, mockNext);
    
    // Get the finish event handler
    const finishHandler = mockResponse.on.mock.calls[0][1];
    finishHandler();

    // Then
    expect(mockWarn).toHaveBeenCalledWith('HTTP request completed with error', {
      method: 'GET',
      url: '/api/test',
      status: 400,
      duration: 250,
      userAgent: 'Mozilla/5.0 Test Browser',
      ip: '127.0.0.1',
    });
    expect(mockInfo).not.toHaveBeenCalled();
    
    // Clean up
    mockDateNow.mockRestore();
  });
});

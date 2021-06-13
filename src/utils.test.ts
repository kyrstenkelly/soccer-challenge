import fs, { ReadStream } from 'fs';
import { logger, safeReadStream } from './utils';

const mockSuccessWriteStream = {
  on: jest.fn().mockImplementation(function(this: any, event, handler) {
    if (event === 'finish' || event === 'open') {
      handler();
    }
    return this;
  }),
};

const mockFailedWriteStream = {
  on: jest.fn().mockImplementation(function(this: any, event, handler) {
    if (event === 'error') {
      handler('error');
    }
    return this;
  }),
};

describe('logger', () => {
  describe('#info', () => {
    test('it passes a message along to the console and colors it yellow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      const message = 'Test Message'
      logger.info(message);

      expect(consoleSpy).toHaveBeenCalled();
      const consoleArgs = consoleSpy.mock.calls[0] ? consoleSpy.mock.calls[0][0] : null;
      expect(consoleArgs).toContain(message);
    })
  });

  describe('#warn', () => {
    test('it passes a message along to the console and colors it yellow', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const message = 'Test Message'
      logger.warn(message);

      expect(consoleSpy).toHaveBeenCalled();
      const consoleArgs = consoleSpy.mock.calls[0] ? consoleSpy.mock.calls[0][0] : null;
      expect(consoleArgs).toContain(message);
    })
  });

  describe('#error', () => {
    test('it passes a message along to the console and colors it yellow', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const message = 'Test Message'
      logger.error(message);

      expect(consoleSpy).toHaveBeenCalled();
      const consoleArgs = consoleSpy.mock.calls[0] ? consoleSpy.mock.calls[0][0] : null;
      expect(consoleArgs).toContain(message);
    })
  });
});

describe('safeReadStream', () => {
  const file = 'filename';
  let createStreamSpy: jest.SpyInstance;

  beforeEach(() => {
    createStreamSpy = jest.spyOn(fs, 'createReadStream');
  });

  test('it resolves if the read is successful', async () => {
    createStreamSpy.mockReturnValueOnce((mockSuccessWriteStream as unknown) as ReadStream);
    await safeReadStream(file);
    expect(createStreamSpy).toHaveBeenCalledWith(file);
  });

  test('it rejects if the read fails', async () => {
    createStreamSpy.mockReturnValueOnce((mockFailedWriteStream as unknown) as ReadStream);
    try {
      await safeReadStream(file);
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests for @roolipeli/logger gating behavior.
 *
 * Each test uses vi.resetModules() + dynamic import so the module-level
 * `isDev` is re-evaluated with the current import.meta.env.DEV value.
 */
describe('logger', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  /** Saved original value for cleanup. */
  const originalDev = import.meta.env.DEV;

  beforeEach(() => {
    vi.resetModules();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Restore env after each test
    return () => {
      import.meta.env.DEV = originalDev;
      vi.restoreAllMocks();
    };
  });

  async function importLogger() {
    return import('../src/logger.js');
  }

  describe('production mode (DEV = false)', () => {
    beforeEach(() => {
      import.meta.env.DEV = false;
    });

    it('logError always outputs', async () => {
      const { logError } = await importLogger();
      logError('Something failed', { code: 500 });
      expect(errorSpy).toHaveBeenCalledWith('Something failed', { code: 500 });
    });

    it('logWarn always outputs', async () => {
      const { logWarn } = await importLogger();
      logWarn('Deprecation notice');
      expect(warnSpy).toHaveBeenCalledWith('Deprecation notice');
    });

    it('logInfo is suppressed', async () => {
      const { logInfo } = await importLogger();
      logInfo('Processing started');
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('logDebug is suppressed', async () => {
      const { logDebug } = await importLogger();
      logDebug('Variable state:', { x: 1 });
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  describe('development mode (DEV = true)', () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
    });

    it('logInfo outputs', async () => {
      const { logInfo } = await importLogger();
      logInfo('Processing started');
      expect(infoSpy).toHaveBeenCalledWith('Processing started');
    });

    it('logDebug outputs', async () => {
      const { logDebug } = await importLogger();
      logDebug('Variable state:', { x: 1 });
      expect(debugSpy).toHaveBeenCalledWith('Variable state:', { x: 1 });
    });

    it('logError outputs', async () => {
      const { logError } = await importLogger();
      logError('Error in dev');
      expect(errorSpy).toHaveBeenCalledWith('Error in dev');
    });

    it('logWarn outputs', async () => {
      const { logWarn } = await importLogger();
      logWarn('Warning in dev');
      expect(warnSpy).toHaveBeenCalledWith('Warning in dev');
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addSnack, clearSnacks, dismissSnack, snackbarStore } from './snackbar-store.ts';

// The store is a singleton — reset before every test.
beforeEach(() => {
  clearSnacks();
});

// ---------------------------------------------------------------------------
// addSnack
// ---------------------------------------------------------------------------

describe('addSnack', () => {
  it('adds a snack to an empty queue', () => {
    addSnack({ type: 'info', message: 'Hello' });

    expect(snackbarStore.queue).toHaveLength(1);
    expect(snackbarStore.queue[0].type).toBe('info');
    expect(snackbarStore.queue[0].message).toBe('Hello');
  });

  it('defaults duration to "short" when not specified', () => {
    addSnack({ type: 'info', message: 'Default duration' });

    expect(snackbarStore.queue[0].duration).toBe('short');
  });

  it('uses explicit duration "long"', () => {
    addSnack({ type: 'success', message: 'Long snack', duration: 'long' });

    expect(snackbarStore.queue[0].duration).toBe('long');
  });

  it('uses explicit duration "indefinite"', () => {
    addSnack({ type: 'warning', message: 'Indefinite snack', duration: 'indefinite' });

    expect(snackbarStore.queue[0].duration).toBe('indefinite');
  });

  it('generates unique IDs for each snack', () => {
    addSnack({ type: 'info', message: 'First' });
    const firstId = snackbarStore.queue[0].id;
    addSnack({ type: 'info', message: 'Second' });

    expect(snackbarStore.queue[0].id).not.toBe(firstId);
  });

  it('replaces the active snack when a new one is added (MD3 one-at-a-time)', () => {
    addSnack({ type: 'info', message: 'First' });
    addSnack({ type: 'info', message: 'Second' });

    expect(snackbarStore.queue).toHaveLength(1);
    expect(snackbarStore.queue[0].message).toBe('Second');
  });

  it('replaces even after multiple rapid additions', () => {
    addSnack({ type: 'info', message: 'One' });
    addSnack({ type: 'info', message: 'Two' });
    addSnack({ type: 'info', message: 'Three' });

    expect(snackbarStore.queue).toHaveLength(1);
    expect(snackbarStore.queue[0].message).toBe('Three');
  });

  it('preserves the action on the snack message', () => {
    const action = { label: 'Undo', onclick: vi.fn() };
    addSnack({ type: 'success', message: 'File deleted', action });

    const snack = snackbarStore.queue[0];
    expect(snack.action?.label).toBe('Undo');
    expect(snack.action?.onclick).toBe(action.onclick);
  });
});

// ---------------------------------------------------------------------------
// dismissSnack
// ---------------------------------------------------------------------------

describe('dismissSnack', () => {
  it('removes the active snack from the queue', () => {
    addSnack({ type: 'info', message: 'Active' });

    const id = snackbarStore.queue[0].id;
    dismissSnack(id);

    expect(snackbarStore.queue).toHaveLength(0);
  });

  it('does nothing when given an unknown ID', () => {
    addSnack({ type: 'info', message: 'Only snack' });

    dismissSnack('non-existent-id');

    expect(snackbarStore.queue).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// clearSnacks
// ---------------------------------------------------------------------------

describe('clearSnacks', () => {
  it('empties the queue', () => {
    addSnack({ type: 'info', message: 'One' });
    addSnack({ type: 'info', message: 'Two' });
    addSnack({ type: 'info', message: 'Three' });

    clearSnacks();

    expect(snackbarStore.queue).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// subscribe / unsubscribe
// ---------------------------------------------------------------------------

describe('subscribe', () => {
  it('calls the listener when addSnack mutates the queue', () => {
    const listener = vi.fn();
    snackbarStore.subscribe(listener);

    addSnack({ type: 'info', message: 'Test' });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls the listener when dismissSnack mutates the queue', () => {
    addSnack({ type: 'info', message: 'Dismiss me' });
    const id = snackbarStore.queue[0].id;

    const listener = vi.fn();
    snackbarStore.subscribe(listener);

    dismissSnack(id);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls the listener when clearSnacks mutates the queue', () => {
    addSnack({ type: 'info', message: 'Clear me' });

    const listener = vi.fn();
    snackbarStore.subscribe(listener);

    clearSnacks();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls the listener once per mutation across add, dismiss, and clear', () => {
    const listener = vi.fn();
    snackbarStore.subscribe(listener);

    addSnack({ type: 'info', message: 'A' });
    const id = snackbarStore.queue[0].id;
    dismissSnack(id);
    clearSnacks();

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = snackbarStore.subscribe(listener);

    unsubscribe();

    addSnack({ type: 'info', message: 'After unsub' });

    expect(listener).not.toHaveBeenCalled();
  });
});

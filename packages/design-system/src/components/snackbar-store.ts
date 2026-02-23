/**
 * Snackbar store — lightweight pub/sub singleton for managing snack message queue.
 *
 * Compatible with Svelte 5 components via manual subscription or reactive declarations.
 * One snack is displayed at a time (FIFO queue); the first item in the queue is active.
 *
 * @module snackbar-store
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Visual intent of the snack message. */
export type SnackType = 'info' | 'success' | 'warning' | 'error';

/**
 * How long the snack remains visible before auto-dismissing.
 * - `'short'`      — 4 seconds (default)
 * - `'long'`       — 8 seconds
 * - `'indefinite'` — stays until dismissed programmatically or by user action
 */
export type SnackDuration = 'short' | 'long' | 'indefinite';

/** An optional call-to-action rendered inside the snack. */
export interface SnackAction {
  /** Button label text. */
  label: string;
  /** Callback invoked when the user clicks the action button. */
  onclick: () => void;
}

/** A single snack message held in the queue. */
export interface SnackMessage {
  /** Unique identifier generated via `crypto.randomUUID()`. */
  id: string;
  /** Visual intent of the message. */
  type: SnackType;
  /** Human-readable message text. */
  message: string;
  /** Auto-dismiss duration. Defaults to `'short'` (4 s). */
  duration: SnackDuration;
  /** Optional call-to-action. */
  action?: SnackAction;
}

/** Options accepted by `addSnack`. */
export interface AddSnackOptions {
  /** Visual intent of the message. */
  type: SnackType;
  /** Human-readable message text. */
  message: string;
  /** Auto-dismiss duration. Defaults to `'short'`. */
  duration?: SnackDuration;
  /** Optional call-to-action. */
  action?: SnackAction;
}

// ---------------------------------------------------------------------------
// Store class
// ---------------------------------------------------------------------------

/**
 * Internal singleton class that owns the snack queue and notifies subscribers
 * on every mutation.
 */
class SnackbarStore {
  private _queue: SnackMessage[] = [];
  private _listeners: Set<() => void> = new Set();

  // -------------------------------------------------------------------------
  // Public accessors
  // -------------------------------------------------------------------------

  /**
   * Read-only snapshot of the current snack queue.
   * The first element is the currently visible snack.
   */
  get queue(): readonly SnackMessage[] {
    return this._queue;
  }

  // -------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------

  /**
   * Registers a listener that is called whenever the queue changes.
   *
   * @param listener - Zero-argument callback invoked on every mutation.
   * @returns An unsubscribe function that removes the listener.
   */
  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  /**
   * Adds a new snack, replacing any currently active snack (MD3 one-at-a-time rule).
   * The new snack becomes immediately visible; previous snacks are discarded.
   *
   * @param opts - Snack configuration options.
   */
  addSnack(opts: AddSnackOptions): void {
    const message: SnackMessage = {
      id: crypto.randomUUID(),
      type: opts.type,
      message: opts.message,
      duration: opts.duration ?? 'short',
      action: opts.action,
    };
    this._queue = [message];
    this._notify();
  }

  /**
   * Removes the snack with the given `id` from the queue.
   * If the active (first) snack is dismissed the next one becomes visible.
   *
   * @param id - The `id` of the snack to remove.
   */
  dismissSnack(id: string): void {
    this._queue = this._queue.filter((snack) => snack.id !== id);
    this._notify();
  }

  /**
   * Removes all snacks from the queue.
   */
  clearSnacks(): void {
    this._queue = [];
    this._notify();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _notify(): void {
    for (const listener of this._listeners) {
      listener();
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Singleton snackbar store instance. */
export const snackbarStore = new SnackbarStore();

// ---------------------------------------------------------------------------
// Convenience function exports
// ---------------------------------------------------------------------------

/**
 * Adds a new snack message to the queue.
 * Delegates to `snackbarStore.addSnack`.
 *
 * @param opts - Snack configuration options.
 *
 * @example
 * ```ts
 * addSnack({ type: 'success', message: 'Saved successfully.' });
 * addSnack({ type: 'error', message: 'Upload failed.', duration: 'long' });
 * ```
 */
export function addSnack(opts: AddSnackOptions): void {
  snackbarStore.addSnack(opts);
}

/**
 * Dismisses the snack identified by `id`.
 * Delegates to `snackbarStore.dismissSnack`.
 *
 * @param id - The unique ID of the snack to remove.
 *
 * @example
 * ```ts
 * dismissSnack(snack.id);
 * ```
 */
export function dismissSnack(id: string): void {
  snackbarStore.dismissSnack(id);
}

/**
 * Clears all snacks from the queue.
 * Delegates to `snackbarStore.clearSnacks`.
 *
 * @example
 * ```ts
 * clearSnacks();
 * ```
 */
export function clearSnacks(): void {
  snackbarStore.clearSnacks();
}

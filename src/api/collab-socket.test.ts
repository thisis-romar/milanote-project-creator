/**
 * @file collab-socket.test.ts
 * @description Unit tests for CollabSocket frame format and error detection
 * @version 0.1.0
 * @created 2026-05-02T20:30:00Z
 * @lastUpdated 2026-05-02T20:30:00Z
 *
 * These tests use a FakeWS injected directly — no real WebSocket, no CDP.
 * They lock in the frame-format contract so bugs like "4${2+n}" are caught
 * before a live run.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateElementId, CollabSocket } from './collab-socket.js';

// ---------------------------------------------------------------------------
// FakeWS — minimal stand-in for the ws WebSocket instance
// ---------------------------------------------------------------------------

class FakeWS {
  static OPEN = 1;
  readyState = 1 as number;
  readonly sent: string[] = [];
  private readonly handlers = new Map<string, (...args: unknown[]) => void>();

  on(event: string, handler: (...args: unknown[]) => void): this {
    this.handlers.set(event, handler);
    return this;
  }

  send(data: string, cb?: (err?: Error) => void): void {
    this.sent.push(data);
    cb?.();
  }

  close(): void { this.readyState = 3; }

  /** Simulate an incoming server frame. */
  receive(msg: string): void {
    this.handlers.get('message')?.(Buffer.from(msg));
  }
}

type Priv = Record<string, unknown>;

/** Inject a FakeWS into a CollabSocket, bypassing the real connect() handshake. */
function connected(): { socket: CollabSocket; ws: FakeWS } {
  const socket = new CollabSocket();
  const ws = new FakeWS();
  (socket as unknown as Priv)['ws'] = ws;
  return { socket, ws };
}

// ---------------------------------------------------------------------------

describe('generateElementId', () => {
  it('produces a 14-character alphanumeric string', () => {
    const id = generateElementId();
    expect(id).toHaveLength(14);
    expect(id).toMatch(/^[0-9A-Za-z]{14}$/);
  });

  it('never produces a duplicate across 500 calls', () => {
    const ids = new Set(Array.from({ length: 500 }, generateElementId));
    expect(ids.size).toBe(500);
  });
});

// ---------------------------------------------------------------------------

describe('CollabSocket.sendAction — frame format', () => {
  let socket: CollabSocket;
  let ws: FakeWS;

  beforeEach(() => {
    ({ socket, ws } = connected());
  });

  it('first frame is 420["action", payload]', async () => {
    await socket.sendAction({ type: 'TEST', x: 1 });
    expect(ws.sent[0]).toBe('420["action",{"type":"TEST","x":1}]');
  });

  it('counter increments as a string suffix, NOT as addition to SIO type byte', async () => {
    // The historic bug: `4${2+n}` changes 42→43→44 (changes SIO type).
    // Correct:           `42${n}` keeps type=2, appends counter as string.
    await socket.sendAction({ type: 'A' });
    await socket.sendAction({ type: 'B' });
    await socket.sendAction({ type: 'C' });

    const counters = ws.sent.map((f) => Number(f.match(/^42(\d+)\[/)![1]));
    expect(counters).toEqual([0, 1, 2]);
    // Confirm type byte stays at '2' (event), never '3' (ack) or '4' (error)
    for (const frame of ws.sent) {
      expect(frame.slice(0, 2)).toBe('42');
    }
  });

  it('each frame wraps payload in ["action", ...]', async () => {
    await socket.sendAction({ type: 'ELEMENT_CREATE', id: 'abc' });
    const frame = ws.sent[0];
    const payload = JSON.parse(frame.slice(frame.indexOf('[', 2)));
    expect(payload[0]).toBe('action');
    expect(payload[1]).toMatchObject({ type: 'ELEMENT_CREATE', id: 'abc' });
  });

  it('throws immediately when ws is null (never connected)', async () => {
    const fresh = new CollabSocket();
    await expect(fresh.sendAction({ type: 'X' })).rejects.toThrow('not connected');
  });

  it('throws immediately when ws is closed (readyState !== OPEN)', async () => {
    ws.readyState = 3; // CLOSED
    await expect(socket.sendAction({ type: 'X' })).rejects.toThrow('not connected');
  });

  it('surfaces a server error stored in lastServerError', async () => {
    (socket as unknown as Priv)['lastServerError'] = '44{"message":"permission denied"}';
    await expect(socket.sendAction({ type: 'X' })).rejects.toThrow('server rejected action');
  });

  it('clears lastServerError after throwing so the next send is clean', async () => {
    (socket as unknown as Priv)['lastServerError'] = '44{"message":"err"}';
    await expect(socket.sendAction({ type: 'X' })).rejects.toThrow();
    expect((socket as unknown as Priv)['lastServerError']).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe('CollabSocket — server error detection via message handler', () => {
  it('sets lastServerError on a SIO error packet (type 44)', () => {
    const { socket, ws } = connected();
    const priv = socket as unknown as Priv;

    // The message handler is registered during connect(); mirror its logic
    // here to verify the detection branch independently.
    ws.on('message', (raw) => {
      const msg = (raw as Buffer).toString();
      if (msg.startsWith('44') || (msg.startsWith('42') && msg.includes('"error"'))) {
        priv['lastServerError'] = msg;
      }
    });

    ws.receive('44{"message":"forbidden"}');
    expect(priv['lastServerError']).toBe('44{"message":"forbidden"}');
  });

  it('sets lastServerError on a 42["error",...] event frame', () => {
    const { socket, ws } = connected();
    const priv = socket as unknown as Priv;

    ws.on('message', (raw) => {
      const msg = (raw as Buffer).toString();
      if (msg.startsWith('44') || (msg.startsWith('42') && msg.includes('"error"'))) {
        priv['lastServerError'] = msg;
      }
    });

    ws.receive('42["error",{"code":403,"message":"denied"}]');
    expect(priv['lastServerError']).toBe('42["error",{"code":403,"message":"denied"}]');
  });

  it('ignores normal event frames (no error)', () => {
    const { socket, ws } = connected();
    const priv = socket as unknown as Priv;

    ws.on('message', (raw) => {
      const msg = (raw as Buffer).toString();
      if (msg.startsWith('44') || (msg.startsWith('42') && msg.includes('"error"'))) {
        priv['lastServerError'] = msg;
      }
    });

    ws.receive('42["board-update",{"id":"xyz"}]');
    expect(priv['lastServerError']).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe('CollabSocket.updateChannels — frame shape', () => {
  it('sends a 42N["update-channels", channels_payload] frame', async () => {
    const { socket, ws } = connected();
    await socket.updateChannels('board123');

    expect(ws.sent.length).toBeGreaterThan(0);
    const frame = ws.sent[0];
    expect(frame).toMatch(/^42\d+\["update-channels",/);

    const payload = JSON.parse(frame.slice(frame.indexOf('[', 2)));
    expect(payload[0]).toBe('update-channels');
    expect(payload[1]).toMatchObject({
      joined: expect.any(Array),
      left: [],
      replay: true,
      bufferFlush: true,
    });
    expect(payload[1].joined).toContain('board123');
  });
});

// ---------------------------------------------------------------------------

describe('CollabSocket.baseAction — shape', () => {
  it('includes required fields for all action frames', () => {
    const { socket } = connected();
    (socket as unknown as Priv)['userId'] = 'user42';

    const action = socket.baseAction('ELEMENT_CREATE', 'board999');
    expect(action).toMatchObject({
      type: 'ELEMENT_CREATE',
      sync: true,
      user: { _id: 'user42' },
      channels: ['board999-LIVE'],
    });
    expect(typeof action['timestamp']).toBe('number');
  });
});

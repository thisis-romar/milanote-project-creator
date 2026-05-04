/**
 * @file collab-socket.ts
 * @description Minimal Socket.IO v4 client for Milanote's collab server
 * @version 1.0.0
 * @created 2026-05-02T16:25:20Z
 * @lastUpdated 2026-05-02T17:30:00Z
 *
 * Milanote routes all element create/update/delete through Socket.IO v4 on
 * wss://app.milanote.com/socket.io/ — not REST.
 *
 * REST POST /api/elements works for leaf elements (CARD, LINK, etc.) when the
 * permissions token is non-null, but BOARD creation inside the workspace root
 * always returns null token via cookie auth. CollabSocket bypasses this.
 *
 * Protocol:
 *   Engine.IO 4 handshake: server sends 0{...}, client sends 40
 *   Socket.IO event frame: 42N["action", payload]  (N = sequential counter)
 *   Heartbeat: server sends 2, client replies 3
 */

import WebSocket from 'ws';
import type { Page } from 'playwright';
import { getMilanoteCookies, buildCookieHeader } from './client.js';

const COLLAB_HOST = 'app.milanote.com';
const SOCKET_PATH = '/socket.io/';

/** Client-side ID matching Milanote's observed pattern (~14 alphanumeric chars) */
export function generateElementId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export class CollabSocket {
  private ws: WebSocket | null = null;
  private counter = 0;
  private userId = '';
  private clientId = generateElementId().slice(0, 6);
  private sessionId = `msid-${generateElementId().slice(0, 10)}`;
  private deviceId = `mdid-${generateElementId().slice(0, 10)}`;
  private cookieHeader = '';
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private currentBoardId: string | null = null;
  private lastServerError: string | null = null;

  async connect(page: Page): Promise<void> {
    const cookies = await getMilanoteCookies(page.context());
    this.cookieHeader = buildCookieHeader(cookies);

    // Extract userId — stored in mn-ot-data-subject-params as URL-encoded JSON {"id":"..."}
    const otParams = cookies.find((c) => c.name === 'mn-ot-data-subject-params');
    if (otParams) {
      try {
        const decoded = decodeURIComponent(otParams.value);
        const parsed = JSON.parse(decoded) as { id?: string };
        if (parsed.id) this.userId = parsed.id;
      } catch { /* ignore */ }
    }

    // Fallback: try existing socket.io URL in performance entries
    if (!this.userId) {
      const uid = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const entry = entries.find((e) => e.name.includes('socket.io') && e.name.includes('userId='));
        if (!entry) return null;
        try { return new URL(entry.name).searchParams.get('userId'); } catch { return null; }
      });
      if (uid) this.userId = uid;
    }

    if (!this.userId) throw new Error('CollabSocket: could not extract userId from session');

    await this.openWebSocket();
  }

  /** Connect using pre-extracted credentials — bypasses Playwright page dependency. */
  async connectRaw(cookieHeader: string, userId: string): Promise<void> {
    this.cookieHeader = cookieHeader;
    this.userId = userId;
    await this.openWebSocket();
  }

  private async openWebSocket(): Promise<void> {
    const url = `wss://${COLLAB_HOST}${SOCKET_PATH}?userId=${this.userId}&EIO=4&transport=websocket`;

    await new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(url, {
        headers: { cookie: this.cookieHeader },
        handshakeTimeout: 10_000,
      });

      const timeout = setTimeout(() => reject(new Error('CollabSocket: connect timeout')), 15_000);

      this.ws.on('error', (err) => { clearTimeout(timeout); reject(err); });

      this.ws.on('message', (raw) => {
        const msg = raw.toString();
        // EIO open packet
        if (msg.startsWith('0')) {
          this.ws!.send('40'); // SIO connect
          return;
        }
        // SIO connected
        if (msg === '40' || msg.startsWith('40{')) {
          clearTimeout(timeout);
          // Start heartbeat
          this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) this.ws.send('3');
          }, 20_000);
          resolve();
          return;
        }
        // Ping from server
        if (msg === '2') { this.ws!.send('3'); return; }
        // SIO error packet (type 44) or server-side error event frame
        if (msg.startsWith('44') || (msg.startsWith('42') && msg.includes('"error"'))) {
          this.lastServerError = msg;
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    // Wait for server to process queued actions before closing
    await new Promise((r) => setTimeout(r, 1500));
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
    this.ws?.close();
    this.ws = null;
  }

  async sendAction(action: Record<string, unknown>): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('CollabSocket: not connected');
    }
    // Protocol: 4 (EIO message) + 2 (SIO event) + N (sequential counter) + payload
    // e.g. 420["action",...], 421["action",...] — NOT 42, 43 (which changes the SIO type byte)
    const n = this.counter++;
    const frame = `42${n}["action",${JSON.stringify(action)}]`;
    await new Promise<void>((resolve, reject) => {
      this.ws!.send(frame, (err) => (err ? reject(err) : resolve()));
    });
    // Brief yield so the server has time to process before the next send
    await new Promise((r) => setTimeout(r, 50));
    // Surface any server-side error that arrived in the yield window
    const serverErr = this.lastServerError;
    if (serverErr) {
      this.lastServerError = null;
      throw new Error(`CollabSocket: server rejected action — ${serverErr.slice(0, 200)}`);
    }
  }

  /** Send update-channels — required before ELEMENT_CREATE to register board subscriptions */
  async updateChannels(boardId: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const n = this.counter++;
    const payload = {
      joined: [this.userId, `${boardId}-LIVE`, `${this.userId}-PERSONAL`, boardId],
      left: [],
      bufferFlush: true,
      replay: true,
      monitoring: { requestMode: 'bufferFlush' },
    };
    const frame = `42${n}["update-channels",${JSON.stringify(payload)}]`;
    await new Promise<void>((resolve, reject) => {
      this.ws!.send(frame, (err) => (err ? reject(err) : resolve()));
    });
    await new Promise((r) => setTimeout(r, 100));
  }

  buildMeta(_boardId: string): Record<string, unknown> {
    const now = Date.now();
    return {
      creator: this.userId,
      modifiedBy: this.userId,
      createdTime: now,
      modifiedTime: now,
      platform: 'Desktop web',
      locationSectionModifiedTime: now,
      versionId: `${this.sessionId}-1`,
    };
  }

  baseAction(type: string, boardId: string): Record<string, unknown> {
    return {
      type,
      timestamp: Date.now(),
      sync: true,
      user: { _id: this.userId, clientId: this.clientId, clientTick: this.counter },
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      channels: [`${boardId}-LIVE`],
    };
  }

  /** Navigate to a board and subscribe to its channels. No-ops if already on that board. */
  async navigate(boardId: string): Promise<void> {
    if (this.currentBoardId === boardId) return;
    this.currentBoardId = boardId;
    await this.sendAction({
      ...this.baseAction('USER_NAVIGATE', boardId),
      newBoardId: boardId,
      permissionId: null,
      permission: 31,
      persist: true,
      navigationSource: 'web',
      monitoring: { operation: 'GENERAL', requestMode: 'bufferFlush' },
      activity: { track: true, isPreviousBoardShared: false, isNewBoardShared: false },
    });
    await this.updateChannels(boardId);
  }

  /**
   * Delete an element from a board.
   * Confirmed payload shape from probe-ws2.json ELEMENT_DELETE frames:
   *   { type, id, location: { parentId }, elementType, sync, user, tokens:[],
   *     activity: { track:false, boardId, elementTypes:{id:type} }, channels, ... }
   */
  async deleteElement(boardId: string, elementId: string, elementType = 'BOARD'): Promise<void> {
    await this.navigate(boardId);
    await this.sendAction({
      ...this.baseAction('ELEMENT_DELETE', boardId),
      id: elementId,
      location: { parentId: boardId },
      elementType,
      tokens: [],
      activity: {
        track: false,
        boardId,
        elementTypes: { [elementId]: elementType },
      },
    });
    await new Promise((r) => setTimeout(r, 300));
  }

  /**
   * Send ELEMENT_UPDATE — updates is an array of { id, data: {...fields} }.
   * Confirmed from bundle: updates:[{id:e,data:t}] pattern.
   */
  async updateElement(
    boardId: string,
    elementId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.navigate(boardId);
    await this.sendAction({
      ...this.baseAction('ELEMENT_UPDATE', boardId),
      updates: [{ id: elementId, data }],
    });
  }

  /**
   * Create any element inside a board, column, or other container.
   *
   * @param inList - true when creating inside a COLUMN or TASK_LIST (uses INBOX section
   *   with index-based position). TASK elements always use INBOX regardless of this flag.
   */
  async createElement(
    parentId: string,
    elementId: string,
    elementType: string,
    content: Record<string, unknown>,
    position?: { x: number; y: number; score: number },
    inList = false,
  ): Promise<string> {
    const isListItem = elementType === 'TASK' || inList;
    const section = isListItem ? 'INBOX' : 'CANVAS';
    const pos = isListItem
      ? { index: position?.score ?? 0, score: position?.score ?? 0 }
      : { x: position?.x ?? 100, y: position?.y ?? 100, score: position?.score ?? 196608 };

    await this.sendAction({
      ...this.baseAction('ELEMENT_CREATE', parentId),
      id: elementId,
      elementType,
      location: { parentId, section, position: pos },
      content,
      meta: this.buildMeta(parentId),
    });
    return elementId;
  }
}

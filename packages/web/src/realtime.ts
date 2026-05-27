import { UUID, CalendarEntry, Group, RecurringRule, Holiday, ConflictRule, generateUUID } from '@vereinskalender/shared';

export type RealtimeEventType = 'change' | 'presence' | 'comment' | 'conflict' | 'resolve' | 'ack';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  userId: string;
  timestamp: number;
  data: any;
}

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  currentView?: string;
}

export interface ChangeMessage {
  operation: 'create' | 'update' | 'delete';
  entity: 'entry' | 'group' | 'rule' | 'holiday' | 'conflict';
  entityId: UUID;
  payload: any;
}

export interface ConflictInfo {
  conflictId: string;
  conflicts: Array<{
    userId: string;
    operation: string;
    entity: string;
    resolution: string;
  }>;
}

export type RealtimeCallback = (event: RealtimeEvent) => void;
export type PresenceCallback = (users: UserPresence[]) => void;
export type ConflictCallback = (conflict: ConflictInfo) => void;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private userId: string;
  private userName: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelayMs = 1000;
  private messageCallbacks: Set<RealtimeCallback> = new Set();
  private presenceCallbacks: Set<PresenceCallback> = new Set();
  private conflictCallbacks: Set<ConflictCallback> = new Set();
  private pendingAcks: Map<string, { resolve: () => void; reject: () => void }> = new Map();
  private presenceInterval: number | null = null;
  private activeUsers: Map<string, UserPresence> = new Map();
  private messageVersion = 0;

  constructor(serverUrl: string, userId?: string, userName?: string) {
    this.url = serverUrl;
    this.userId = userId || generateUUID();
    this.userName = userName || 'Anonymous';
  }

  /**
   * Connect to the realtime server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.url.replace(/^http/, 'ws');
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to realtime server');
          this.reconnectAttempts = 0;
          this.startPresenceTracking();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from realtime server');
          this.stopPresenceTracking();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.stopPresenceTracking();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to realtime events
   */
  onMessage(callback: RealtimeCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * Subscribe to presence updates
   */
  onPresence(callback: PresenceCallback): () => void {
    this.presenceCallbacks.add(callback);
    return () => this.presenceCallbacks.delete(callback);
  }

  /**
   * Subscribe to conflict detection
   */
  onConflict(callback: ConflictCallback): () => void {
    this.conflictCallbacks.add(callback);
    return () => this.conflictCallbacks.delete(callback);
  }

  /**
   * Send a change event
   */
  async sendChange(change: ChangeMessage): Promise<string> {
    const changeId = generateUUID();

    const message: RealtimeEvent = {
      id: changeId,
      type: 'change',
      userId: this.userId,
      timestamp: Date.now(),
      data: {
        ...change,
        version: ++this.messageVersion,
      },
    };

    return new Promise((resolve, reject) => {
      // Set up acknowledgment listener
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(changeId);
        reject(new Error('Change acknowledgment timeout'));
      }, 30000);

      this.pendingAcks.set(changeId, {
        resolve: () => {
          clearTimeout(timeout);
          resolve(changeId);
        },
        reject: () => {
          clearTimeout(timeout);
          this.pendingAcks.delete(changeId);
          reject(new Error('Change rejected'));
        },
      });

      this.send(message);
    });
  }

  /**
   * Post a comment on an entity
   */
  sendComment(entityId: UUID, entityType: string, content: string): void {
    const message: RealtimeEvent = {
      id: generateUUID(),
      type: 'comment',
      userId: this.userId,
      timestamp: Date.now(),
      data: {
        entityId,
        entityType,
        content,
        authorId: this.userId,
        authorName: this.userName,
      },
    };

    this.send(message);
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(
    conflictId: string,
    resolution: 'accept' | 'reject' | 'merge',
    payload?: any
  ): void {
    const message: RealtimeEvent = {
      id: generateUUID(),
      type: 'resolve',
      userId: this.userId,
      timestamp: Date.now(),
      data: {
        conflictId,
        resolution,
        payload,
      },
    };

    this.send(message);
  }

  /**
   * Request a sync with the server
   */
  requestSync(): Promise<any> {
    return new Promise((resolve, reject) => {
      const syncId = generateUUID();
      const timeout = setTimeout(() => {
        reject(new Error('Sync request timeout'));
      }, 30000);

      const message: RealtimeEvent = {
        id: syncId,
        type: 'change',
        userId: this.userId,
        timestamp: Date.now(),
        data: {
          operation: 'sync',
        },
      };

      this.pendingAcks.set(syncId, {
        resolve: () => {
          clearTimeout(timeout);
          resolve(true);
        },
        reject: () => {
          clearTimeout(timeout);
          reject(new Error('Sync rejected'));
        },
      });

      this.send(message);
    });
  }

  /**
   * Get active users
   */
  getActiveUsers(): UserPresence[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the server
   */
  private send(message: RealtimeEvent): void {
    if (!this.isConnected()) {
      console.warn('Not connected to realtime server');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: RealtimeEvent): void {
    switch (message.type) {
      case 'ack':
        this.handleAck(message);
        break;
      case 'presence':
        this.handlePresence(message);
        break;
      case 'change':
        this.handleChange(message);
        break;
      case 'conflict':
        this.handleConflict(message);
        break;
      case 'comment':
        this.handleComment(message);
        break;
    }

    // Call all registered callbacks
    this.messageCallbacks.forEach((callback) => callback(message));
  }

  private handleAck(message: RealtimeEvent): void {
    const { changeId } = message.data;
    const ackHandler = this.pendingAcks.get(changeId);
    if (ackHandler) {
      ackHandler.resolve();
      this.pendingAcks.delete(changeId);
    }
  }

  private handlePresence(message: RealtimeEvent): void {
    const { userId, userName, status, currentView } = message.data;

    if (status === 'offline') {
      this.activeUsers.delete(userId);
    } else {
      this.activeUsers.set(userId, {
        userId,
        userName,
        status,
        currentView,
      });
    }

    this.presenceCallbacks.forEach((callback) =>
      callback(Array.from(this.activeUsers.values()))
    );
  }

  private handleChange(message: RealtimeEvent): void {
    // Application layer handles change application
  }

  private handleConflict(message: RealtimeEvent): void {
    this.conflictCallbacks.forEach((callback) => callback(message.data));
  }

  private handleComment(message: RealtimeEvent): void {
    // Application layer handles comment display
  }

  /**
   * Start tracking user presence
   */
  private startPresenceTracking(): void {
    // Send initial presence
    this.updatePresence('online');

    // Update presence every 30 seconds
    this.presenceInterval = window.setInterval(() => {
      this.updatePresence('online');
    }, 30000);

    // Track user activity
    document.addEventListener('mousemove', () => {
      this.updatePresence('online');
    });

    document.addEventListener('keydown', () => {
      this.updatePresence('online');
    });
  }

  /**
   * Stop tracking user presence
   */
  private stopPresenceTracking(): void {
    if (this.presenceInterval !== null) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }

    // Send offline message
    const message: RealtimeEvent = {
      id: generateUUID(),
      type: 'presence',
      userId: this.userId,
      timestamp: Date.now(),
      data: {
        userId: this.userId,
        userName: this.userName,
        status: 'offline',
      },
    };

    if (this.isConnected()) {
      this.send(message);
    }
  }

  /**
   * Update user presence
   */
  private updatePresence(status: 'online' | 'away' = 'online', currentView?: string): void {
    const message: RealtimeEvent = {
      id: generateUUID(),
      type: 'presence',
      userId: this.userId,
      timestamp: Date.now(),
      data: {
        userId: this.userId,
        userName: this.userName,
        status,
        currentView,
      },
    };

    this.send(message);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
}

/**
 * Create a singleton instance for the app
 */
let realtimeInstance: RealtimeClient | null = null;

export function initRealtimeClient(
  serverUrl: string,
  userId?: string,
  userName?: string
): RealtimeClient {
  if (!realtimeInstance) {
    realtimeInstance = new RealtimeClient(serverUrl, userId, userName);
  }
  return realtimeInstance;
}

export function getRealtimeClient(): RealtimeClient | null {
  return realtimeInstance;
}

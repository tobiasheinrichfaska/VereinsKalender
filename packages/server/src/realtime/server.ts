import { Express } from 'express';
import { WebSocket } from 'ws';
import {
  UserSession,
  RealtimeMessage,
  ChangeMessage,
  PresenceMessage,
  PendingChange,
  ConflictDetection,
} from './types';
import { ConflictResolver } from './conflict-resolver';
import { generateUUID } from '@vereinskalender/shared';

export class RealtimeServer {
  private sessions: Map<string, UserSession> = new Map();
  private pendingChanges: Map<string, PendingChange> = new Map();
  private conflictDetections: Map<string, ConflictDetection> = new Map();
  private conflictResolver: ConflictResolver;
  private messageVersion: number = 0;
  private broadcastIntervalMs = 100;
  private pendingBroadcast: Set<ChangeMessage> = new Set();
  private broadcastTimer: NodeJS.Timeout | null = null;

  constructor(app: Express) {
    this.conflictResolver = new ConflictResolver();
  }

  handleConnection(ws: WebSocket, req: any) {
    const userId = req.headers['x-user-id'] || generateUUID();
    const userName = req.headers['x-user-name'] || 'Anonymous';

    const session: UserSession = {
      userId,
      userName,
      ws,
      presenceTimestamp: Date.now(),
    };

    this.sessions.set(userId, session);

    console.log(`User ${userName} (${userId}) connected`);

    // Send presence update
    this.broadcastPresence(userId, 'online');

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as RealtimeMessage;
        this.handleMessage(userId, message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      this.sessions.delete(userId);
      this.broadcastPresence(userId, 'offline');
      console.log(`User ${userName} (${userId}) disconnected`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  }

  private handleMessage(userId: string, message: RealtimeMessage) {
    switch (message.type) {
      case 'change':
        this.handleChange(userId, message as ChangeMessage);
        break;
      case 'presence':
        this.handlePresence(userId, message as PresenceMessage);
        break;
      case 'ack':
        this.handleAck(userId, message);
        break;
      case 'sync':
        this.handleSync(userId, message);
        break;
      case 'resolve':
        this.handleConflictResolution(userId, message);
        break;
    }
  }

  private handleChange(userId: string, message: ChangeMessage) {
    const changeId = generateUUID();
    message.version = ++this.messageVersion;

    // Detect conflicts with pending changes
    const conflicts = this.conflictResolver.detect(message, Array.from(this.pendingChanges.values()));

    if (conflicts.length > 0) {
      const conflictDetection: ConflictDetection = {
        id: generateUUID(),
        changes: [message, ...conflicts.map((c) => c.message)],
        detectedAt: Date.now(),
        status: 'detected',
      };
      this.conflictDetections.set(conflictDetection.id, conflictDetection);

      // Notify all clients of conflict
      this.broadcastConflict({
        id: message.id,
        type: 'conflict',
        userId,
        timestamp: Date.now(),
        data: {
          conflictId: conflictDetection.id,
          conflicts: conflicts.map((c) => ({
            userId: c.message.userId,
            operation: c.message.data.operation,
            entity: c.message.data.entity,
            resolution: c.resolution,
          })),
        },
      });
      return;
    }

    // Track pending change
    const pendingChange: PendingChange = {
      id: changeId,
      message,
      timestamp: Date.now(),
      status: 'pending',
    };
    this.pendingChanges.set(changeId, pendingChange);

    // Broadcast change to all clients (with debouncing)
    this.pendingBroadcast.add(message);
    this.scheduleFileBroadcast();

    // Acknowledge sender
    this.sendToUser(userId, {
      id: message.id,
      type: 'ack',
      userId,
      timestamp: Date.now(),
      data: { changeId },
    });
  }

  private handlePresence(userId: string, message: PresenceMessage) {
    const session = this.sessions.get(userId);
    if (session) {
      session.presenceTimestamp = Date.now();
      session.currentView = message.data.currentView;
      this.broadcastPresence(userId, message.data.status);
    }
  }

  private handleAck(userId: string, message: RealtimeMessage) {
    const { changeId } = message.data;
    const pending = this.pendingChanges.get(changeId);
    if (pending) {
      pending.status = 'acked';
      // Clean up acked changes to prevent memory leak
      this.pendingChanges.delete(changeId);
    }
  }

  private handleSync(userId: string, message: RealtimeMessage) {
    // Return current server state
    this.sendToUser(userId, {
      id: generateUUID(),
      type: 'sync',
      userId: 'server',
      timestamp: Date.now(),
      data: {
        entries: [],
        groups: [],
        rules: [],
        holidays: [],
        conflicts: [],
        lastSync: Date.now(),
      },
    });
  }

  private handleConflictResolution(userId: string, message: RealtimeMessage) {
    const { conflictId, resolution } = message.data;
    const conflict = this.conflictDetections.get(conflictId);

    if (conflict) {
      if (resolution === 'accept') {
        conflict.status = 'resolved';
        // Apply the change that was accepted
      } else if (resolution === 'reject') {
        conflict.status = 'resolved';
        // Discard the conflicting change
      } else if (resolution === 'merge') {
        conflict.status = 'resolved';
        // Merge conflicting changes
      }

      // Broadcast resolution
      this.broadcast({
        id: generateUUID(),
        type: 'resolve',
        userId,
        timestamp: Date.now(),
        data: { conflictId, resolution },
      });

      // Clean up resolved conflicts to prevent memory leak
      this.conflictDetections.delete(conflictId);
    }
  }

  private broadcastPresence(userId: string, status: 'online' | 'away' | 'offline') {
    const session = this.sessions.get(userId);
    if (session) {
      this.broadcast({
        id: generateUUID(),
        type: 'presence',
        userId,
        timestamp: Date.now(),
        data: {
          userId,
          userName: session.userName,
          status,
          currentView: session.currentView,
        },
      });
    }
  }

  private broadcastConflict(message: any) {
    this.broadcast(message);
  }

  private scheduleFileBroadcast() {
    if (!this.broadcastTimer) {
      this.broadcastTimer = setTimeout(() => {
        if (this.pendingBroadcast.size > 0) {
          const changes = Array.from(this.pendingBroadcast);
          this.pendingBroadcast.clear();

          changes.forEach((change) => {
            this.broadcast(change);
          });
        }
        this.broadcastTimer = null;
      }, this.broadcastIntervalMs);
    }
  }

  private broadcast(message: RealtimeMessage) {
    const payload = JSON.stringify(message);
    let successCount = 0;

    this.sessions.forEach((session) => {
      if (session.ws.readyState === 1) {
        // WebSocket.OPEN
        try {
          session.ws.send(payload);
          successCount++;
        } catch (error) {
          console.error(`Error sending to user ${session.userId}:`, error);
        }
      }
    });

    console.log(`Broadcast message (${message.type}) sent to ${successCount}/${this.sessions.size} clients`);
  }

  private sendToUser(userId: string, message: RealtimeMessage) {
    const session = this.sessions.get(userId);
    if (session && session.ws.readyState === 1) {
      session.ws.send(JSON.stringify(message));
    }
  }

  close() {
    if (this.broadcastTimer) {
      clearTimeout(this.broadcastTimer);
    }

    this.sessions.forEach((session) => {
      if (session.ws.readyState === 1) {
        session.ws.close();
      }
    });

    this.sessions.clear();
    this.pendingChanges.clear();
    this.conflictDetections.clear();
  }

  getActiveUsers() {
    return Array.from(this.sessions.values()).map((session) => ({
      userId: session.userId,
      userName: session.userName,
      status: 'online',
    }));
  }
}

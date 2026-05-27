import { UUID, CalendarEntry, Group, RecurringRule, Holiday, ConflictRule } from '@vereinskalender/shared';

export type RealtimeMessageType =
  | 'sync'
  | 'change'
  | 'presence'
  | 'comment'
  | 'ack'
  | 'conflict'
  | 'resolve';

export interface RealtimeMessage {
  id: string;
  type: RealtimeMessageType;
  userId: string;
  timestamp: number;
  data: any;
  version?: number;
}

export interface SyncMessage extends RealtimeMessage {
  type: 'sync';
  data: {
    entries: CalendarEntry[];
    groups: Group[];
    rules: RecurringRule[];
    holidays: Holiday[];
    conflicts: ConflictRule[];
    lastSync: number;
  };
}

export interface ChangeMessage extends RealtimeMessage {
  type: 'change';
  data: {
    operation: 'create' | 'update' | 'delete';
    entity: 'entry' | 'group' | 'rule' | 'holiday' | 'conflict';
    entityId: UUID;
    payload: any;
    version: number;
  };
}

export interface PresenceMessage extends RealtimeMessage {
  type: 'presence';
  data: {
    userId: string;
    userName: string;
    status: 'online' | 'away' | 'offline';
    currentView?: string;
  };
}

export interface CommentMessage extends RealtimeMessage {
  type: 'comment';
  data: {
    entityId: UUID;
    entityType: string;
    content: string;
    authorId: string;
    authorName: string;
  };
}

export interface ConflictResolutionMessage extends RealtimeMessage {
  type: 'resolve';
  data: {
    conflictId: string;
    resolution: 'accept' | 'reject' | 'merge';
    payload?: any;
  };
}

export interface UserSession {
  userId: string;
  userName: string;
  ws: any;
  presenceTimestamp: number;
  currentView?: string;
}

export interface PendingChange {
  id: string;
  message: ChangeMessage;
  timestamp: number;
  status: 'pending' | 'acked';
}

export interface ConflictDetection {
  id: string;
  changes: ChangeMessage[];
  detectedAt: number;
  status: 'detected' | 'resolved' | 'ignored';
}

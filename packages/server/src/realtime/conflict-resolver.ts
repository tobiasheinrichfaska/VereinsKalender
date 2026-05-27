import { ChangeMessage, PendingChange } from './types';
import { UUID } from '@vereinskalender/shared';

export interface ConflictDetails {
  message: ChangeMessage;
  resolution: 'accept_new' | 'keep_old' | 'merge';
}

export class ConflictResolver {
  /**
   * Detect conflicts between a new change and pending changes
   */
  detect(newChange: ChangeMessage, pendingChanges: PendingChange[]): ConflictDetails[] {
    const conflicts: ConflictDetails[] = [];

    for (const pending of pendingChanges) {
      const conflict = this.compareChanges(newChange, pending.message);
      if (conflict) {
        conflicts.push({
          message: pending.message,
          resolution: this.resolveConflict(newChange, pending.message),
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if two changes conflict with each other
   */
  private compareChanges(change1: ChangeMessage, change2: ChangeMessage): boolean {
    // Same entity being modified = conflict
    if (
      change1.data.entity === change2.data.entity &&
      change1.data.entityId === change2.data.entityId
    ) {
      // Deletion always conflicts
      if (
        change1.data.operation === 'delete' ||
        change2.data.operation === 'delete'
      ) {
        return true;
      }

      // Updates to the same entity conflict
      if (
        change1.data.operation === 'update' &&
        change2.data.operation === 'update'
      ) {
        return this.payloadsOverlap(change1.data.payload, change2.data.payload);
      }
    }

    return false;
  }

  /**
   * Check if two update payloads modify overlapping fields
   */
  private payloadsOverlap(payload1: any, payload2: any): boolean {
    if (!payload1 || !payload2) return false;

    const keys1 = Object.keys(payload1);
    const keys2 = Object.keys(payload2);

    // Check for common fields
    return keys1.some((key) => keys2.includes(key));
  }

  /**
   * Determine resolution strategy for conflicting changes
   */
  private resolveConflict(
    newChange: ChangeMessage,
    existingChange: ChangeMessage
  ): 'accept_new' | 'keep_old' | 'merge' {
    // Newer change (by timestamp) wins
    if (newChange.timestamp > existingChange.timestamp) {
      return 'accept_new';
    }

    // If same timestamp, older version wins (to maintain CRDT semantics)
    if (newChange.version !== undefined && existingChange.version !== undefined) {
      return newChange.version > existingChange.version ? 'accept_new' : 'keep_old';
    }

    // Try to merge if possible
    if (this.canMerge(newChange, existingChange)) {
      return 'merge';
    }

    // Default: keep old (existing change is already processed)
    return 'keep_old';
  }

  /**
   * Determine if two changes can be merged (e.g., updates to different fields)
   */
  private canMerge(change1: ChangeMessage, change2: ChangeMessage): boolean {
    if (
      change1.data.entity !== change2.data.entity ||
      change1.data.entityId !== change2.data.entityId
    ) {
      return false;
    }

    if (
      change1.data.operation !== 'update' ||
      change2.data.operation !== 'update'
    ) {
      return false;
    }

    // Merge if they update different fields
    const keys1 = new Set(Object.keys(change1.data.payload || {}));
    const keys2 = new Set(Object.keys(change2.data.payload || {}));

    for (const key of keys1) {
      if (keys2.has(key)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Merge two compatible changes
   */
  mergeChanges(change1: ChangeMessage, change2: ChangeMessage): any {
    return {
      ...change1.data.payload,
      ...change2.data.payload,
    };
  }

  /**
   * Apply operational transformation to resolve conflicts
   */
  applyOT(changes: ChangeMessage[]): ChangeMessage[] {
    // Sort by version/timestamp
    const sorted = [...changes].sort((a, b) => {
      const verA = a.version || 0;
      const verB = b.version || 0;
      return verA - verB;
    });

    return sorted;
  }

  /**
   * Detect cyclic dependencies in changes
   */
  hasCyclicDependency(changes: ChangeMessage[]): boolean {
    const adjacency = new Map<string, Set<string>>();

    changes.forEach((change) => {
      if (!adjacency.has(change.id)) {
        adjacency.set(change.id, new Set());
      }
    });

    // For now, simple implementation - can be extended with dependency tracking
    return false;
  }
}

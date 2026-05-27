import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarDatabase } from '@vereinskalender/shared';

export interface SyncState {
  lastSyncTime: number;
  pendingChanges: any[];
  isSyncing: boolean;
  isOnline: boolean;
}

export class SyncManager {
  private syncState: SyncState = {
    lastSyncTime: 0,
    pendingChanges: [],
    isSyncing: false,
    isOnline: true,
  };

  private serverUrl: string = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
  private syncIntervalMs = 30000; // 30 seconds
  private syncTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      // Load persisted sync state
      const savedState = await AsyncStorage.getItem('syncState');
      if (savedState) {
        this.syncState = JSON.parse(savedState);
      }

      // Start periodic sync
      this.startPeriodicSync();

      console.log('SyncManager initialized');
    } catch (error) {
      console.error('Failed to initialize SyncManager:', error);
    }
  }

  async shutdown(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    await this.persistState();
  }

  /**
   * Perform a full sync with server
   */
  async sync(): Promise<boolean> {
    if (this.syncState.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    this.syncState.isSyncing = true;

    try {
      // Upload pending changes
      if (this.syncState.pendingChanges.length > 0) {
        await this.uploadChanges();
      }

      // Download latest data
      await this.downloadData();

      this.syncState.lastSyncTime = Date.now();
      this.syncState.pendingChanges = [];

      await this.persistState();
      console.log('Sync completed successfully');
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    } finally {
      this.syncState.isSyncing = false;
    }
  }

  /**
   * Queue a local change for sync
   */
  async queueChange(change: any): Promise<void> {
    this.syncState.pendingChanges.push({
      ...change,
      timestamp: Date.now(),
      synced: false,
    });

    await this.persistState();

    // Attempt immediate sync if online
    if (this.syncState.isOnline) {
      await this.sync();
    }
  }

  /**
   * Upload pending changes to server
   */
  private async uploadChanges(): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/api/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changes: this.syncState.pendingChanges,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      console.log('Changes uploaded successfully');
    } catch (error) {
      console.error('Failed to upload changes:', error);
      throw error;
    }
  }

  /**
   * Download latest data from server
   */
  private async downloadData(): Promise<void> {
    try {
      const response = await fetch(
        `${this.serverUrl}/api/sync/download?since=${this.syncState.lastSyncTime}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Merge downloaded data with local storage
      const existing = await AsyncStorage.getItem('calendarData');
      const localData = existing ? JSON.parse(existing) : {};

      // Merge by ID to avoid duplicates
      const mergeById = (local: any[], remote: any[]) => {
        const map = new Map();
        // Add local items first
        local.forEach(item => map.set(item.id, item));
        // Override with remote items (server is source of truth)
        remote.forEach(item => map.set(item.id, item));
        return Array.from(map.values());
      };

      const mergedData = {
        entries: mergeById(localData.entries || [], data.entries || []),
        groups: mergeById(localData.groups || [], data.groups || []),
        rules: mergeById(localData.rules || [], data.rules || []),
        holidays: mergeById(localData.holidays || [], data.holidays || []),
        conflicts: mergeById(localData.conflicts || [], data.conflicts || []),
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem('calendarData', JSON.stringify(mergedData));
      console.log('Data downloaded and merged successfully');
    } catch (error) {
      console.error('Failed to download data:', error);
      throw error;
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      if (this.syncState.isOnline && !this.syncState.isSyncing) {
        await this.sync();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Persist sync state
   */
  private async persistState(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncState', JSON.stringify(this.syncState));
    } catch (error) {
      console.error('Failed to persist sync state:', error);
    }
  }

  /**
   * Get sync status
   */
  getStatus(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline: boolean): void {
    this.syncState.isOnline = isOnline;

    if (isOnline && this.syncState.pendingChanges.length > 0) {
      // Attempt sync when coming back online
      this.sync().catch((error) => {
        console.error('Failed to sync after coming online:', error);
      });
    }
  }

  /**
   * Get pending changes
   */
  getPendingChanges(): any[] {
    return [...this.syncState.pendingChanges];
  }

  /**
   * Clear pending changes (after confirmation of server receipt)
   */
  async clearPendingChanges(): Promise<void> {
    this.syncState.pendingChanges = [];
    await this.persistState();
  }
}

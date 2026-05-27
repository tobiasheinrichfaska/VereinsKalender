import React from 'react';
import './CollaborationIndicators.css';

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  currentView?: string;
  lastSeen?: number;
}

interface CollaborationIndicatorsProps {
  users: UserPresence[];
  maxDisplay?: number;
}

export function CollaborationIndicators({ users, maxDisplay = 5 }: CollaborationIndicatorsProps) {
  const onlineUsers = users.filter((u) => u.status === 'online');
  const displayUsers = users.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, users.length - maxDisplay);

  return (
    <div className="collaboration-indicators">
      <div className="indicators-header">
        <span className="online-badge">
          <span className="status-dot online"></span>
          {onlineUsers.length} online
        </span>
      </div>

      <div className="users-avatars">
        {displayUsers.map((user) => (
          <div
            key={user.userId}
            className={`user-avatar ${user.status}`}
            title={`${user.userName} - ${user.status}`}
          >
            <div className="avatar-initials">
              {user.userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className={`status-indicator ${user.status}`}></div>
            <div className="user-tooltip">
              <div className="tooltip-name">{user.userName}</div>
              <div className="tooltip-status">{user.status}</div>
              {user.currentView && <div className="tooltip-view">Viewing: {user.currentView}</div>}
            </div>
          </div>
        ))}

        {hiddenCount > 0 && (
          <div className="users-more" title={`${hiddenCount} more users`}>
            +{hiddenCount}
          </div>
        )}
      </div>

      <div className="activity-feed">
        {onlineUsers.length === 0 ? (
          <div className="no-activity">Keine aktiven Benutzer</div>
        ) : (
          <div className="active-users">
            {onlineUsers.slice(0, 3).map((user) => (
              <div key={user.userId} className="activity-item">
                <span className="activity-icon">✓</span>
                <span className="activity-user">{user.userName}</span>
                {user.currentView && <span className="activity-view">{user.currentView}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Floating collaboration panel for corner placement
 */
export function CollaborationPanel({ users }: { users: UserPresence[] }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={`collaboration-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Toggle collaboration panel"
      >
        <span className="toggle-icon">👥</span>
        <span className="user-count">{users.filter((u) => u.status === 'online').length}</span>
      </button>

      {isExpanded && (
        <div className="panel-content">
          <div className="panel-header">
            <h3>Active Users</h3>
            <button
              className="close-btn"
              onClick={() => setIsExpanded(false)}
              title="Close panel"
            >
              ×
            </button>
          </div>

          <div className="panel-users">
            {users.length === 0 ? (
              <div className="no-users">No users connected</div>
            ) : (
              users.map((user) => (
                <div key={user.userId} className={`panel-user ${user.status}`}>
                  <div className={`user-avatar-small ${user.status}`}>
                    {user.userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.userName}</div>
                    <div className="user-location">{user.currentView || 'Browsing'}</div>
                  </div>
                  <div className={`status-dot ${user.status}`}></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

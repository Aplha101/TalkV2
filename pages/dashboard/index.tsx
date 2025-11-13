import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState({
    serversJoined: 0,
    friendsCount: 0,
    messagesCount: 0,
    recentActivity: [] as Array<{
      id: string;
      type: string;
      description: string;
      timestamp: Date;
    }>,
  });

  useEffect(() => {
    if (session) {
      fetchUserStats();
    }
  }, [session]);

  const fetchUserStats = async () => {
    try {
      // For now, we'll use placeholder data
      // In a real implementation, you would fetch from your API
      setUserStats({
        serversJoined: 3,
        friendsCount: 12,
        messagesCount: 847,
        recentActivity: [
          {
            id: '1',
            type: 'message',
            description: 'Sent a message in #general',
            timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          },
          {
            id: '2',
            type: 'server_join',
            description: 'Joined "Gaming Community"',
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          },
          {
            id: '3',
            type: 'friend_request',
            description: 'Became friends with Alex',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'status-online';
      case 'IDLE': return 'status-idle';
      case 'DO_NOT_DISTURB': return 'status-dnd';
      case 'INVISIBLE': return 'status-offline';
      default: return 'status-offline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'Online';
      case 'IDLE': return 'Idle';
      case 'DO_NOT_DISTURB': return 'Do Not Disturb';
      case 'INVISIBLE': return 'Invisible';
      default: return 'Offline';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text">Welcome back, {session.user?.name}!</h1>
              <p className="text-text-secondary mt-2">Ready to connect and chat?</p>
            </div>
            <Link
              href="/channels/@me"
              className="btn btn-primary"
            >
              Open Talkie
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="md:col-span-1">
            <div className="card p-6">
              <div className="text-center">
                <div className="avatar w-24 h-24 text-3xl mx-auto mb-4">
                  {session.user?.avatarUrl ? (
                    <img
                      src={session.user.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    session.user?.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <h2 className="text-xl font-semibold text-text mb-1">
                  {session.user?.name}
                </h2>
                <p className="text-text-secondary mb-2">@{session.user?.username}</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className={`status-indicator ${getStatusColor(session.user?.status || 'OFFLINE')}`}></div>
                  <span className="text-sm text-text-muted">
                    {getStatusText(session.user?.status || 'OFFLINE')}
                  </span>
                </div>
                {session.user?.bio && (
                  <p className="text-sm text-text-muted mt-4 italic">
                    "{session.user.bio}"
                  </p>
                )}
                <div className="mt-6 space-y-2">
                  <Link
                    href="/settings/profile"
                    className="btn btn-secondary w-full btn-sm"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="btn btn-ghost w-full btn-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Your Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userStats.serversJoined}
                  </div>
                  <div className="text-sm text-text-secondary">Servers</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {userStats.friendsCount}
                  </div>
                  <div className="text-sm text-text-secondary">Friends</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-warning mb-1">
                    {userStats.messagesCount}
                  </div>
                  <div className="text-sm text-text-secondary">Messages</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Recent Activity</h3>
              <div className="card">
                {userStats.recentActivity.length > 0 ? (
                  <div className="divide-y divide-border">
                    {userStats.recentActivity.map((activity) => (
                      <div key={activity.id} className="p-4 hover:bg-surface-hover transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-text">{activity.description}</p>
                            <p className="text-sm text-text-muted">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          <div className="text-2xl">
                            {activity.type === 'message' && '💬'}
                            {activity.type === 'server_join' && '🎮'}
                            {activity.type === 'friend_request' && '👥'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-text-secondary">No recent activity</p>
                    <p className="text-sm text-text-muted mt-2">
                      Start chatting to see your activity here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/channels/@me"
                  className="card card-hover p-4 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-3xl mb-2">💬</div>
                  <div className="font-medium text-text">Direct Messages</div>
                  <div className="text-sm text-text-muted">Chat with friends</div>
                </Link>
                <Link
                  href="/servers"
                  className="card card-hover p-4 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-3xl mb-2">🎮</div>
                  <div className="font-medium text-text">Browse Servers</div>
                  <div className="text-sm text-text-muted">Find communities</div>
                </Link>
                <Link
                  href="/friends"
                  className="card card-hover p-4 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-medium text-text">Add Friends</div>
                  <div className="text-sm text-text-muted">Connect with others</div>
                </Link>
                <Link
                  href="/settings"
                  className="card card-hover p-4 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-3xl mb-2">⚙️</div>
                  <div className="font-medium text-text">Settings</div>
                  <div className="text-sm text-text-muted">Customize experience</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
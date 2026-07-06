'use client';

import { Mail } from 'lucide-react';

export interface InboxTabProps {
  notifications: any[];
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

export default function InboxTab({
  notifications = [],
  markAllAsRead,
  markAsRead,
}: InboxTabProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              <span>In-App Mailbox</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Your direct notifications, acknowledgments, and messages from LaunchPath.
            </p>
          </div>
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-[#5D3FD3] dark:text-violet-400 hover:underline bg-[#5D3FD3]/5 hover:bg-[#5D3FD3]/10 dark:bg-violet-955/20 dark:hover:bg-violet-955/40 px-3.5 py-2 rounded-lg border border-[#5D3FD3]/10 cursor-pointer self-start sm:self-center transition-all"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-850">
              <Mail className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-805 dark:text-slate-200">Your inbox is clear</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              When you apply for a job or get invited to interview, your platform notifications will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`py-4 first:pt-0 last:pb-0 flex gap-4 transition-all duration-200 cursor-pointer ${
                  !n.is_read 
                    ? 'bg-[#5D3FD3]/5 dark:bg-[#5D3FD3]/10 px-3 rounded-lg border-l-4 border-[#5D3FD3] ml-[-4px]' 
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  {n.type === 'APPLICATION' ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-bold">
                      📝
                    </div>
                  ) : n.type === 'INTERVIEW' ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold">
                      📅
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#5D3FD3]/10 text-[#5D3FD3] flex items-center justify-center text-sm font-bold">
                      🔔
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      {n.title}
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 inline-block" />
                      )}
                    </h4>
                    <span className="text-[10.5px] text-slate-450 dark:text-slate-500 whitespace-nowrap font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                    {n.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

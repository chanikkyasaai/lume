import { CheckCircle, Clock, History, Home, LogOut, Menu, Play, Settings, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { CouncilSession, getSessions } from "@/lib/history";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  onSessionSelect: (session: CouncilSession) => void;
  onNewSession: () => void;
}

const Sidebar = ({ onSessionSelect, onNewSession }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed like ChatGPT
  const sessions = getSessions();

  return (
    <>
      {/* Collapsed Sidebar - Just a chevron in middle */}
      {!isExpanded && (
        <div className="fixed left-0 z-[60]" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <button
            onClick={() => setIsExpanded(true)}
            className="w-8 h-16 bg-gray-900/80 backdrop-blur-sm border-r border-gray-700/50 flex items-center justify-center hover:bg-gray-800/80 transition-all duration-200 rounded-r-md"
            title="Expand sidebar"
          >
            <ChevronRight size={16} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Expanded Sidebar */}
      {isExpanded && (
        <div
          className="bg-gray-900/95 backdrop-blur-md text-white transition-all duration-300 ease-in-out flex flex-col border-r border-gray-700/50 fixed top-16 left-0 z-[60] w-72"
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          {/* Chat History Header with collapse chevron */}
          <div className="p-3 border-b border-gray-700/50 flex items-center justify-between">
            <h2 className="text-sm font-quicksand font-semibold flex items-center gap-2">
              <History size={16} />
              Chat History
            </h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded hover:bg-gray-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={14} className="text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-grow overflow-y-auto py-2 space-y-1">
            {sessions.length === 0 && (
              <div className="text-xs text-gray-500 px-3 py-8 text-center">
                No conversations yet
              </div>
            )}
            {sessions.map((session, index) => (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session)}
                className="mx-2 p-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-all duration-200 group relative"
                title={session.topic}
              >
                <div>
                  <p className="font-medium text-sm truncate mb-1 group-hover:text-white">
                    {session.topic}
                  </p>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    <span>{formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with New Conversation */}
          <div className="border-t border-gray-700/50">
            <button 
              onClick={onNewSession}
              className="w-full flex items-center gap-2 p-2.5 hover:bg-gray-800 transition-colors text-sm"
              title="New Conversation"
            >
              <Play size={14} />
              <span>New Conversation</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay for mobile when sidebar is expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50]"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default Sidebar;

import { CouncilMessage } from "./aiCouncilService";

export interface CouncilSession {
  id: string;
  topic: string;
  selectedDuration: number;
  actualDuration: number; // in seconds
  script: CouncilMessage[];
  createdAt: number; // timestamp
  firstPlayedAt?: number; // timestamp
}

const HISTORY_KEY = "lume-council-history";
const MAX_SESSIONS = 50; // Limit to 50 sessions to prevent storage bloat

export const getSessions = (): CouncilSession[] => {
  const historyJson = localStorage.getItem(HISTORY_KEY);
  if (!historyJson) {
    return [];
  }
  try {
    const sessions = JSON.parse(historyJson) as CouncilSession[];
    // Sort by creation date, newest first
    return sessions.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Failed to parse session history:", error);
    return [];
  }
};

export const saveSession = (session: CouncilSession): void => {
  try {
    const sessions = getSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    if (existingIndex > -1) {
      // Update existing session
      sessions[existingIndex] = session;
    } else {
      // Add new session
      sessions.push(session);
    }

    // Keep only the most recent sessions to prevent storage bloat
    const trimmedSessions = sessions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_SESSIONS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedSessions));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old sessions...');
      // Clear some old sessions and try again
      clearOldSessions();
      try {
        const sessions = getSessions();
        sessions.push(session);
        const trimmedSessions = sessions
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10); // Keep only 10 most recent
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedSessions));
      } catch (retryError) {
        console.error('Failed to save session even after clearing storage:', retryError);
      }
    } else {
      console.error('Failed to save session:', error);
    }
  }
};

const clearOldSessions = (): void => {
  try {
    const sessions = getSessions();
    // Keep only the 5 most recent sessions
    const recentSessions = sessions.slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(recentSessions));
  } catch (error) {
    console.error('Failed to clear old sessions:', error);
    // If all else fails, clear the entire history
    localStorage.removeItem(HISTORY_KEY);
  }
};

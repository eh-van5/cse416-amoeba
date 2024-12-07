import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

interface AppContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  sendMessage: (message: string, additionalData?: object) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useWebSocket = (url: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null> (null);

  useEffect(() => {
      const socket = new WebSocket(url);
      socket.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      socket.onmessage = (event) => {
        console.log("Message from server: ", event.data);
      };

      socket.onerror = (error) => {
          console.error("WebSocket error: ", error);
          setError("Failed to connect to WebSocket");
      };

      socket.onclose = () => {
          console.log("WebSocket disconnected");
          setConnected(false);
      };

      wsRef.current = socket;

      return () => {
          socket.close();
      };
  }, [url]);

  const sendMessage = useCallback((msg: string, additionalData?: object) => {
      const socket = wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
          message: msg,
          ...additionalData,
        }
          socket.send(JSON.stringify(message));
          // console.log("Sent message:", msg);
      } else {
          console.error("WebSocket is not open.");
      }
  }, []);

  // Return the sendMessage function and WebSocket ref (so caller can access it)
  return sendMessage;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const sendMessage = useWebSocket("ws://localhost:8080/ws")

  return (
    <AppContext.Provider value={{ isDarkMode, toggleTheme, sendMessage}}>
      {children}
    </AppContext.Provider>
  );
};
import React, { useMemo, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContext } from './SocketContext';

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  // Use the actual backend URL since Tauri might not resolve "/" like a browser
  const domain = import.meta.env.VITE_DOMAIN_URL; 
  
  const socket: Socket = useMemo(() => io(domain, {
    path: '/socket.io',
    transports: ['websocket'], // Often more stable with Tauri/Docker
  }), [domain]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
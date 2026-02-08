import { useContext } from "react";
import { SocketContext } from "../contexts/SocketContext";
import { Socket } from "socket.io-client";

export const useSocket = (): Socket => {
  const socket = useContext(SocketContext);
  
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  
  return socket;
};
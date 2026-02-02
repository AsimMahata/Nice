import { createContext } from 'react';
import {User} from './AuthProvider'

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
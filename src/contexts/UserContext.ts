import { createContext, useContext } from 'react'

export const UserContext = createContext<string>('user-1')

export function useCurrentUser() {
  return useContext(UserContext)
}

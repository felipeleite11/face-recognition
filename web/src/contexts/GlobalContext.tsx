'use client'

import { createContext, ReactNode } from 'react'

interface GlobalContextProps {
	
}

export const GlobalContext = createContext({} as GlobalContextProps)

interface GlobalProviderProps {
	children: ReactNode
}

export function GlobalProvider({ children }: GlobalProviderProps) {
	return (
		<GlobalContext.Provider 
			value={{
				
			}}
		>
			{children}
		</GlobalContext.Provider>
	)
}
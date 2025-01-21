'use client'

import { createContext, ReactNode, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface GlobalContextProps {
	socketInstance: Socket | null
}

export const GlobalContext = createContext({} as GlobalContextProps)

interface GlobalProviderProps {
	children: ReactNode
}

const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER, {
	autoConnect: false
})

export function GlobalProvider({ children }: GlobalProviderProps) {
	const [socketInstance, setSocketInstance] = useState<Socket | null>(null)

	useEffect(() => {
		if(socket) {
			setSocketInstance(socket)
		}
	}, [socket])

	useEffect(() => {
		if(socket.connected && socket.id) {
			setSocketInstance(socket)

			socket.on('connect', () => {
				console.log('Socket conectado!', socket)
			})
	
			socket.on('disconnect', () => {
				console.log('Desconectado do servidor')
			})
	
			socket.on('result', result => {
				console.log('Result:', result)
			})

			socket.on('validation_error', message => {
				console.log(message)
			})
		}
	}, [socket.connected])

	if(!socketInstance) {
		return null
	}

	return (
		<GlobalContext.Provider 
			value={{
				socketInstance
			}}
		>
			{children}
		</GlobalContext.Provider>
	)
}
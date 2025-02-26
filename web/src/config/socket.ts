import { io } from "socket.io-client"

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER, {
	autoConnect: false
})

socket.on('disconnect', () => {
	console.log('Desconectado do servidor')
})

socket.on('validation_error', message => {
	console.log(message)

	socket.disconnect()
})

export function connectSocket() {
	return new Promise((resolve, reject) => {
		socket.connect()

		socket.on('connect', () => {
			console.log('Socket conectado!')

			resolve(socket)
		})

		socket.on('connect_error', error => {
			reject(error)
		})
	})
}

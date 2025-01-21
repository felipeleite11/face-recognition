require('dotenv/config')
const cors = require('cors')
const express = require('express')
const http = require('http')
const { randomUUID } = require('crypto')
const { Server } = require('socket.io')
const { uploadMinio } = require('./config/multer')
const { storeFaceID, getReferenceRecord, getResult } = require('./config/redis')
const { loadModels, resolveResult } = require('./config/faceapi')
const MessageChannel = require('./config/rabbit-mq')
const { validateReferenceImageExtension } = require('./utils/validation')

const messageChannel = new MessageChannel()

let connectedClients = []

exports.connectedClients = connectedClients

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const server = http.createServer(app)

const port = process.env.PORT || 3360

server.listen(port, async () => {
	await loadModels()

	await setupRabbitMQConsumer()

	console.log(`Executando em http://localhost:${port}\n`)
})

// Socket IO
const io = new Server(server, {
	cors: {
		origin: '*'
	}
})

io.on('connection', socket => {
	console.log('Usuário conectado', socket.id)

	connectedClients.push(socket)

	socket.on('disconnect', () => {
		try {
			console.log('Usuário desconectado:', socket.id)

			connectedClients = connectedClients.filter(client => client.id !== socket.id)
		} catch(e) {}
	})
})

// Endpoints
app.get('/', (req, res) => {
	console.log('Chamada recebida...')

	return res.send('EXECUTANDO!')
})

app.post('/reference', uploadMinio.single('file'), async (req, res) => {
	const { identifier } = req.body

	if(!identifier) {
		return res.status(404).json({
			message: 'Identificador não informado!'
		})
	}

	if(!req.file?.location) {
		return res.status(404).json({
			message: 'Houve um erro ao salvar o arquivo enviado.'
		})
	}

	const url = req.file?.location
	
	try {
		await validateReferenceImageExtension(url)

		await storeFaceID(identifier, url)

		return res.sendStatus(201)
	} catch(e) {
		console.log(e.message)

		return res.status(400).json({ message: e.message })
	}
})

app.post('/compare', uploadMinio.single('file'), async (req, res) => {
	const { identifier, socket_id } = req.body

	console.log('socket_id', socket_id)

	if(!identifier) {
		return res.status(404).json({
			message: 'Identificador não informado!'
		})
	}

	if(!req.file?.location) {
		return res.status(404).json({
			message: 'Houve um erro ao salvar o arquivo enviado.'
		})
	}

	try {
		const referenceImageURL = await getReferenceRecord(identifier)
		const imageToCompareURL = req.file?.location

		if(!referenceImageURL) {
			return res.status(404).json({
				message: 'A imagem de referência não está cadastrada na base.'
			})
		}

		const id = randomUUID()

		// Registra a tarefa de comparação no RabbitMQ
		messageChannel.createMessage(id, {
			identifier,
			socket_id,
			reference: referenceImageURL,
			comparison: imageToCompareURL
		})

		io.to(socket_id).emit('message', 'MENSAGEM ENFILEIRADA...')
		console.log('Mensagem emitida para o cliente socket', socket_id)

		return res.status(201).json({ id })
	} catch(e) {
		return res.status(400).json({ message: e.message })
	}
})

app.get('/result/:id', async (req, res) => {
	const { id } = req.params

	try {
		if(id.length !== 36) {
			throw new Error('id deve ser um UUID válido.')
		}

		const result = await getResult(id)

		if(result) {
			return res.json(result)
		} else {
			throw new Error('O resultado não está mais disponível.')
		}
	} catch(e) {
		return res.status(400).json({
			message: e.message
		})
	}
})

// Rabbit MQ
async function setupRabbitMQConsumer() {
	await messageChannel.consume(resolveResult, io)
}

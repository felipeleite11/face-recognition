require('dotenv/config')
const cors = require('cors')
const express = require('express')
const http = require('http')
const { uploadMinio } = require('./config/multer')
const { storeFaceID, getReferenceRecord } = require('./config/redis')
const { loadModels, resolveResult } = require('./config/faceapi')
const MessageChannel = require('./config/rabbit-mq')

const messageChannel = new MessageChannel()

const app = express({})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
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
	
	try {
		await storeFaceID(identifier, req.file?.location)

		return res.sendStatus(201)
	} catch(e) {
		return res.status(400).json({ message: e.message })
	}
})

app.post('/compare', uploadMinio.single('file'), async (req, res) => {
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

	try {
		const referenceImageURL = await getReferenceRecord(identifier)
		const imageToCompareURL = req.file?.location

		if(!referenceImageURL) {
			return res.status(404).json({
				message: 'A imagem de referência não está cadastrada na base.'
			})
		}

		// Registra a tarefa de comparação no RabbitMQ
		messageChannel.createMessage({
			reference: referenceImageURL,
			comparison: imageToCompareURL
		})

		return res.sendStatus(204)
	} catch(e) {
		return res.status(400).json({ message: e.message })
	}
})

const server = http.createServer(app)

const port = process.env.PORT || 3360

server.listen(port, async () => {
	await loadModels()

	setTimeout(() => {
		messageChannel.consume(resolveResult)
	}, 1000)

	console.log(`Executando em http://localhost:${port}\n`)
})
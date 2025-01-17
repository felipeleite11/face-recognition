require('dotenv/config')
require('@tensorflow/tfjs-node')
const cors = require('cors')
const express = require('express')
const http = require('http')
const { uploadMinio } = require('./config/multer')
const { storeFaceID, getReferenceRecord } = require('./config/redis')
const { loadModels, compareImages } = require('./config/faceapi')

const app = express({})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

		const comparisonResult = await compareImages(
			referenceImageURL, 
			imageToCompareURL
		)

		if(typeof comparisonResult.isMatch !== 'undefined') {
			const { isMatch, similarity } = comparisonResult

			return res.json({
				face_matched: isMatch,
				similarity
			})
		}

		return res.json({
			face_matched: false,
			message: comparisonResult.message
		})
	} catch(e) {
		return res.status(400).json({ message: e.message })
	}
})

const server = http.createServer(app)

server.setTimeout(60 * 1000, () => { // 60 s
	console.log('Timed out = 60s')
})

const port = process.env.PORT || 3360

server.listen(port, async () => {
	await loadModels()

	console.log(`Executando em http://localhost:${port}`)
})
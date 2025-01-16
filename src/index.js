import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { uploadMinio } from './config/multer.mjs'
import { storeFaceID, getReferenceRecord } from './config/redis.mjs'
import { loadModels, compareImages } from './config/faceapi.mjs'

const app = express()

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

app.listen(3000, async () => {
	await loadModels()

	console.log('Executando em http://localhost:3000')
})
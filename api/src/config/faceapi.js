const canvas = require('canvas')
const fs = require('fs')
const { Canvas, Image, ImageData } = require('canvas')
const faceapi = require('face-api.js')
const sharp = require('sharp')
const axios = require('axios')
const { validateComparisonImagesExtensions } = require('../utils/validation')

faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

exports.faceapi = faceapi

exports.loadModels = async function() {
	const modelPath = './models'

	await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
	await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath)
	await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)

	console.log('\nModels carregados!\n')
}

async function getFaceDescriptors(imagePath) {
	let img

	if(Buffer.isBuffer(imagePath)) {
		img = await canvas.loadImage(imagePath)
	} else if(typeof imagePath === 'string') {
		const isURL = imagePath.startsWith('http')
	
		if(isURL) {
			img = await canvas.loadImage(imagePath)
		} else {
			const imgBuffer = fs.readFileSync(imagePath)
	
			img = await canvas.loadImage(imgBuffer)
		}
	} else {
		throw new Error('O formato de imagePath deve ser um Buffer ou String.')
	}

	// Detectar rostos e obter descritores faciais
	const detections = await faceapi
		.detectAllFaces(img)
		.withFaceLandmarks()
		.withFaceDescriptors()

	return detections
}

async function recognizeFaces(referenceImagePath, comparisonImagePath) {
	console.log('Obtendo descritores da imagem de referência...')

	try {
		const referenceResponse = await axios.get(referenceImagePath, { responseType: 'arraybuffer' })
		const comparisonResponse = await axios.get(comparisonImagePath, { responseType: 'arraybuffer' })

    	const referenceBuffer = Buffer.from(referenceResponse.data)
    	const comparisonBuffer = Buffer.from(comparisonResponse.data)

		const referenceConverted = await sharp(referenceBuffer).png().toBuffer()
		const comparisonConverted = await sharp(comparisonBuffer).png().toBuffer()
	
		const referenceDetections = await getFaceDescriptors(referenceConverted)

		if (referenceDetections.length === 0) {
			return { message: 'Nenhum rosto encontrado na imagem de referência!' }
		}

		if (referenceDetections.length > 1) {
			return { message: 'A imagem de referência contém mais de 1 rosto.' }
		}

		const labelForDescriptor = '_'

		// Criar um FaceMatcher para a imagem de referência
		const labeledDescriptors = referenceDetections.map(det =>
			new faceapi.LabeledFaceDescriptors(labelForDescriptor, [det.descriptor])
		)
		
		const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6) // Limite de similaridade

		// Obter descritores da imagem de destino
		console.log('Obtendo descritores da imagem de comparação...')

		const comparisonDetections = await getFaceDescriptors(comparisonConverted)

		if (comparisonDetections.length === 0) {
			return { message: 'Nenhum rosto na imagem de comparação!' }
		}

		if (comparisonDetections.length > 1) {
			return { message: 'A imagem de comparação contém mais de 1 rosto.' }
		}

		// Comparar rostos e exibir resultados
		const results = comparisonDetections.map(det => faceMatcher.findBestMatch(det.descriptor))

		// results.forEach((result, i) => {
		// 	console.log(`Rosto ${i + 1} na imagem de destino corresponde a ${result.toString()}`)
		// })

		// console.log('results', results)

		const matchedFace = results.find(item => item.label === labelForDescriptor)

		if(matchedFace) {
			return {
				isMatch: true,
				similarity: matchedFace.distance
			}
		}

		return {
			isMatch: false
		}
	} catch(e) {
		console.log('Erro na conversão das imagens!', e)
	}
}

async function compareImages(referenceImagePath, targetImagePath) {
	console.log('Comparando imagens...')

	const comparisonResult = await recognizeFaces(referenceImagePath, targetImagePath)

	switch(comparisonResult.isMatch) {
		case false:
			console.log(`O rosto não foi reconhecido!`)
			break
		case true:
			console.log(`O rosto foi reconhecido!`)
			break
		default:
			console.log(comparisonResult.message)
			break
	}

	return comparisonResult
}

exports.resolveResult = async function(content, io) {
	const { identifier, reference, comparison, socket_id, webhook_url, telegram_user_id } = content

	try {
		await validateComparisonImagesExtensions(content)
	} catch(e) {
		io.to(socket_id).emit('validation_error', 'As imagens não são válidas!')

		return
	}

	console.log('Iniciando comparação...')

	const comparisonResult = await compareImages(
		reference,
		comparison
	)

	if(comparisonResult) {
		console.log('Resultado gerado!')
	}

	if(socket_id) {
		io.to(socket_id).emit('status_change', 'done')
		
		console.log('status_change = DONE emitido para o socket:', socket_id)

		io.to(socket_id).emit('result', comparisonResult)
		
		console.log('Resultado emitido para', socket_id)
	} else if(webhook_url && telegram_user_id) {
		axios.post(webhook_url, {
			identifier,
			telegram_user_id,
			...comparisonResult
		})
	} else {
		throw new Error('Nenhum socket ou webhook definido para enviar o resultado.')
	}
}
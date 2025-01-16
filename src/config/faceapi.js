const canvas = require('canvas')
const { Canvas, Image, ImageData } = require('canvas')
const faceapi = require('face-api.js')

faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

exports.faceapi = faceapi

exports.loadModels = async function() {
	const modelPath = './models'

	await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
	await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath)
	await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)

	console.log('models carregados!')
}

async function getFaceDescriptors(imagePath) {
	const isURL = imagePath.startsWith('http')
	let img

	if(isURL) {
		img = await canvas.loadImage(imagePath)
	} else {
		const imgBuffer = fs.readFileSync(imagePath)

		img = await canvas.loadImage(imgBuffer)
	}

	// Detectar rostos e obter descritores faciais
	const detections = await faceapi
		.detectAllFaces(img)
		.withFaceLandmarks()
		.withFaceDescriptors()

	return detections
}

async function recognizeFaces(referenceImagePath, targetImagePath) {
	// Obter descritores da imagem de referência
	console.log('Obtendo descritores da imagem de referÊncia...')

	const referenceDetections = await getFaceDescriptors(referenceImagePath)

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

	const targetDetections = await getFaceDescriptors(targetImagePath)

	if (targetDetections.length === 0) {
		return { message: 'Nenhum rosto na imagem de comparação!' }
	}

	if (targetDetections.length > 1) {
		return { message: 'A imagem de comparação contém mais de 1 rosto.' }
	}

	// Comparar rostos e exibir resultados
	const results = targetDetections.map(det => faceMatcher.findBestMatch(det.descriptor))

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
}

exports.compareImages = async function(referenceImagePath, targetImagePath) {
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
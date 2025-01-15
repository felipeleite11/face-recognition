import canvas, { Canvas, Image, ImageData } from 'canvas'
import * as faceapi from 'face-api.js'
import fs from 'fs'

faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

async function loadModels() {
	const modelPath = './models'

	await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
	await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath)
	await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)

	console.log('models carregados!')
}

async function getFaceDescriptors(imagePath) {
	const imgBuffer = fs.readFileSync(imagePath)
	const img = await canvas.loadImage(imgBuffer)

	// Detectar rostos e obter descritores faciais
	const detections = await faceapi
		.detectAllFaces(img)
		.withFaceLandmarks()
		.withFaceDescriptors()

	return detections
}

async function recognizeFaces(descriptorLabel, referenceImagePath, targetImagePath) {
	// Obter descritores da imagem de referência
	const referenceDetections = await getFaceDescriptors(referenceImagePath)

	if (referenceDetections.length === 0) {
		return null
	}

	// Criar um FaceMatcher para a imagem de referência
	const labeledDescriptors = referenceDetections.map(det =>
		new faceapi.LabeledFaceDescriptors(descriptorLabel, [det.descriptor])
	)
	const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6) // Limite de similaridade

	// Obter descritores da imagem de destino
	const targetDetections = await getFaceDescriptors(targetImagePath)

	if (targetDetections.length === 0) {
		return null
	}

	// Comparar rostos e exibir resultados
	const results = targetDetections.map(td => faceMatcher.findBestMatch(td.descriptor))

	// results.forEach((result, i) => {
	// 	console.log(`Rosto ${i + 1} na imagem de destino corresponde a ${result.toString()}`)
	// })

	return results.some(item => item.label === descriptorLabel)
}

async function createImageWithLandmarks(url) {
	// Carregar uma imagem
	const imageBuffer = fs.readFileSync(url)
	const img = await canvas.loadImage(imageBuffer)

	// Detectar faces
	const detections = await faceapi.detectAllFaces(img).withFaceLandmarks()
	console.log('Detecções:', detections)

	// Desenhar resultados na imagem
	const outCanvas = faceapi.createCanvasFromMedia(img)
	faceapi.draw.drawDetections(outCanvas, detections)
	faceapi.draw.drawFaceLandmarks(outCanvas, detections)

	// Salvar a saída em um arquivo
	const out = fs.createWriteStream('./output-image.jpg')
	const stream = outCanvas.createJPEGStream()
	stream.pipe(out)
}

async function compareImages(descriptorLabel, referenceImagePath, targetImagePath) {
	console.log('Processando...')

	const isFaceRecognized = await recognizeFaces(descriptorLabel, referenceImagePath, targetImagePath)

	switch(isFaceRecognized) {
		case null: 
			console.log('Nenhum rosto encontrado!')
			break
		case false:
			console.log(`O rosto ${descriptorLabel} não foi reconhecido!`)
			break
		case true:
			console.log(`O rosto ${descriptorLabel} foi reconhecido!`)
			break
	}

	return isFaceRecognized
}

async function main() {
	await loadModels()

	// await createImageWithLandmarks('./images/carlos1.jpg')

	await compareImages('carlos_santos', './images/carlos1.jpg', './images/carlos2.jpg')
}

main()

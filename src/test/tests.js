const fs = require("fs")
const { faceapi, loadModels } = require('../config/faceapi')

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

async function main() {
	await loadModels()

	// Criar imagem com landmarks no disco local

	// await createImageWithLandmarks('../images/carlos1.jpg')

	
	// Arquivos locais

	// await compareImages('../images/carlos1.jpg', '../images/carlos2.jpg')


	// URL remota

	// Sucesso!
	// await compareImages(
	// 	'https://i0.wp.com/www.portalshakira.com/wp-content/uploads/2024/09/shakira-fobia-de-amor.webp', 
	// 	'https://vejario.abril.com.br/wp-content/uploads/2024/05/shakira-praia-de-copacabana.jpg'
	// )

	// Falha!
	// await compareImages(
	// 	'https://i0.wp.com/www.portalshakira.com/wp-content/uploads/2024/09/shakira-fobia-de-amor.webp', 
	// 	'https://m.media-amazon.com/images/M/MV5BMTQzNjU3MDczN15BMl5BanBnXkFtZTYwNzY2Njc4._V1_FMjpg_UX1000_.jpg'
	// )
}
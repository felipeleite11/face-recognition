const { extname } = require('path')

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.avif', '.webp', '.bmp']

exports.validateComparisonImagesExtensions = async ({ reference, comparison }) => {
	if(!imageExtensions.includes(extname(reference))) {
		throw new Error('A imagem de referência é inválida.')
	}

	if(!imageExtensions.includes(extname(comparison))) {
		throw new Error('A imagem de comparação é inválida.')
	}

	return true
}

exports.validateReferenceImageExtension = async reference => {
	if(!imageExtensions.includes(extname(reference))) {
		throw new Error(`A imagem de referência é inválida! - URL: ${reference}`)
	}

	return true
}
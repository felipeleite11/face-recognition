const mongoose = require("mongoose")
const { Schema } = require("mongoose")

const faceSchema = new Schema({
	url: { type: String, require: true },
	identifier: { type: String, require: true }
})

const connection = mongoose.createConnection(process.env.MONGO_URL, {
	auth: {
		username: process.env.MONGO_USER,
		password: process.env.MONGO_PASSWORD
	},
	dbName: process.env.MONGO_DATABASE
})

const Face = connection.model('faces', faceSchema)


exports.storeFaceID = async function(identifier, url) {
	const data = await Face.findOne({
		identifier
	})

	if(data) {
		throw new Error('Esta referência já existe.')
	}

	await Face.create({
		identifier,
		url
	})
}

exports.getReferenceRecord = async function(identifier) {
	try {
		const data = await Face.findOne({
			identifier
		})

		return data.url
	} catch(e) {
		console.log(e.message)

		return false
	}
}


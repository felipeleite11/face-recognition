const redis = require('redis')

const redisClient = redis.createClient({
	url: process.env.REDIS_URL
})

const resultTimelife = 60 // sec

exports.redisClient = redisClient

exports.storeFaceID = async function(identifier, url) {
	try {
		await redisClient.connect()

		await redisClient.set(identifier, url)
	} finally {
		await redisClient.disconnect()
	}
}

exports.storeResult = async function(id, data) {
	try {
		if(!redisClient.isOpen) {
			await redisClient.connect()
		}

		await redisClient.setEx(id, resultTimelife, JSON.stringify(data))
	} finally {
		if(redisClient.isOpen) {
			await redisClient.disconnect()
		}
	}
}

exports.getReferenceRecord = async function(identifier) {
	try {
		await redisClient.connect()
	
		const record = await redisClient.get(identifier)

		return record
	} catch(e) {
		console.log(e.message)

		return false
	} finally {
		await redisClient.disconnect()
	}
}

exports.getResult = async function(identifier) {
	try {
		if(!redisClient.isOpen) {
			await redisClient.connect()
		}
	
		const result = await redisClient.get(identifier)

		if(!result) {
			throw new Error('Resultado não encontrado.')
		}

		return JSON.parse(result)
	} catch(e) {
		console.log(e.message)

		return null
	} finally {
		if(redisClient.isOpen) {
			await redisClient.disconnect()
		}
	}
}

exports.storeValidationError = async function(data) {
	try {
		data.error = 'Validation error.'

		const { id, ...props } = data

		if(!redisClient.isOpen) {
			await redisClient.connect()
		}

		await redisClient.setEx(id, resultTimelife, JSON.stringify(props))
	} finally {
		if(redisClient.isOpen) {
			await redisClient.disconnect()
		}
	}
}

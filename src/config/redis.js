const redis = require('redis')
const { randomUUID } = require('crypto')

const redisClient = redis.createClient({
	url: process.env.REDIS_URL
})

const resultTimelife = 30 // sec

exports.redisClient = redisClient

exports.storeFaceID = async function(identifier, url) {
	try {
		await redisClient.connect()

		await redisClient.set(identifier, url)
	} finally {
		await redisClient.disconnect()
	}
}

exports.storeResult = async function(data) {
	try {
		await redisClient.connect()

		await redisClient.setEx(randomUUID(), resultTimelife, JSON.stringify(data))
	} finally {
		await redisClient.disconnect()
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
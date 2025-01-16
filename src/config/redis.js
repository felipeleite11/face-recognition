const redis = require('redis')

const redisClient = redis.createClient({
	url: 'redis://default:123456@easypanel.robot.rio.br:6379'
})

exports.redisClient = redisClient

exports.storeFaceID = async function(identifier, url) {
	try {
		await redisClient.connect()

		await redisClient.set(identifier, url)
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
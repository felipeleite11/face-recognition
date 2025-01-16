import redis from 'redis'

export const redisClient = redis.createClient({
	url: 'redis://default:123456@easypanel.robot.rio.br:6379'
})

export async function storeFaceID(identifier, url) {
	try {
		await redisClient.connect()

		await redisClient.set(identifier, url)
	} finally {
		await redisClient.disconnect()
	}
}

export async function getReferenceRecord(identifier) {
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
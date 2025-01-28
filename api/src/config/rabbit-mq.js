const { connect } = require('amqplib')

const queueName = 'face-recognition'

class MessageChannel {
	channel

	constructor() {
		this.createMessageChannel()
	}

	async createMessageChannel() {
		try {
			const connection = await connect(process.env.AMQP_URL)

			this.channel = await connection.createChannel()

			this.channel.assertQueue(queueName)
		} catch(e) {
			console.log('Erro ao conectar com RabbitMQ', e)
		}
	}

	async createMessage(id, data) {
		try {
			if(this.channel) {
				Object.assign(data, { id })

				this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)))
	
				console.log('Dados inseridos na fila!', data)
			}
		} catch(e) {
			console.log('Erro no createMessage', e)
		}
	}

	async consume(resolver, io) {
		if(this.channel) {
			this.channel?.consume(queueName, async msg => {
				const content = JSON.parse(msg?.content.toString())

				console.log('Mensagem recebida', content)

				await resolver(content, io)

				this.channel?.ack(msg)
			})

			console.log('Consumer iniciado...\n')
		}
	}
}

module.exports = MessageChannel

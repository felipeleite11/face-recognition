const { connect } = require('amqplib')
const { storeResult } = require('./redis')

const queueName = 'face-recognition'

class MessageChannel {
	channel

	constructor() {
		this.createMessageChannel()
	}

	async createMessageChannel() {
		try {
			const connection = await connect('amqp://guest:guest@localhost:5672')

			this.channel = await connection.createChannel()

			this.channel.assertQueue(queueName)
		} catch(e) {
			console.log('Erro ao conectar com RabbitMQ', e)
		}
	}

	async createMessage(data) {
		try {
			if(this.channel) {
				this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)))
	
				console.log('Dados inseridos na fila!')
			}
		} catch(e) {
			console.log('Erro no createMessage', e)
		}
	}

	async consume(resolver) {
		if(this.channel) {
			this.channel?.consume(queueName, async msg => {
				const content = JSON.parse(msg?.content.toString())

				console.log('Mensagem recebida', content)

				const { reference, comparison } = content

				await resolver(reference, comparison)

				this.channel?.ack(msg)
				
				console.log('Consumido com sucesso!')
			})

			console.log('Consumidor iniciado...\n')
		}
	}
}

module.exports = MessageChannel
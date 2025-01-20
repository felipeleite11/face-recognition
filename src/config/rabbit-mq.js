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

	async consume(resolver) {
		if(this.channel) {
			this.channel?.consume(queueName, async msg => {
				const content = JSON.parse(msg?.content.toString())

				console.log('Mensagem recebida', content)

				const { id, reference, comparison } = content

				await resolver(id, reference, comparison)

				this.channel?.ack(msg)
				
				console.log(`Resultado disponível em: http://localhost:3360/result/${id}`)
			})

			console.log('Consumidor iniciado...\n')
		}
	}
}

module.exports = MessageChannel
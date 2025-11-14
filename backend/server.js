const express = require('express')
const cors = require('cors')
const amqp = require('amqplib')

console.log('🔵 server.js se está ejecutando (inicio del archivo)')

const app = express()
app.use(cors())
app.use(express.json())

const QUEUE = 'pedidos'
let channel = null

async function conectarRabbit() {
    console.log('🔄 Intentando conectar a RabbitMQ en amqp://localhost')

    try {
        const connection = await amqp.connect('amqp://localhost')
        channel = await connection.createChannel()
        await channel.assertQueue(QUEUE)
        console.log('✅ Conectado a RabbitMQ y cola creada:', QUEUE)

        channel.consume(QUEUE, async (msg) => {
            const pedido = JSON.parse(msg.content.toString())
            console.log(`🍔 Procesando pedido de ${pedido.nombre} - ${pedido.menu}`)

            await new Promise((resolve) => setTimeout(resolve, 30000))

            console.log(`✅ Pedido completado para ${pedido.nombre}`)
            channel.ack(msg)
        })

        console.log('👂 Esperando pedidos en la cola...')
    } catch (err) {
        console.error('❌ Error conectando a RabbitMQ:', err.message)
    }
}

app.post('/pedido', (req, res) => {
    console.log('📥 Llegó una petición a /pedido con body:', req.body)

    if (!channel) {
        console.error('⚠️ Canal de RabbitMQ no está listo')
        return res.status(500).json({ error: 'RabbitMQ no está listo' })
    }

    const pedido = req.body

    if (!pedido.nombre || !pedido.menu) {
        console.error('⚠️ Pedido incompleto:', pedido)
        return res.status(400).json({ error: 'Faltan datos del pedido' })
    }

    try {
        channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(pedido)))
        console.log('📩 Pedido encolado en RabbitMQ:', pedido)
        res.json({ ok: true, message: 'Pedido enviado a la cola' })
    } catch (err) {
        console.error('❌ Error al encolar pedido:', err.message)
        res.status(500).json({ error: 'No se pudo encolar el pedido' })
    }
})

const PORT = 4000
app.listen(PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${PORT}`)
    conectarRabbit()
})
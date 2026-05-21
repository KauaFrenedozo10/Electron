const express = require('express')
const cors = require('cors')

const produtosRoutes = require('./produtos')
const vendasRoutes = require('./vendas')
const historicoRoutes = require('./historico')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/produtos', produtosRoutes)
app.use('/vendas', vendasRoutes)
app.use('/historico', historicoRoutes)

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000')
})
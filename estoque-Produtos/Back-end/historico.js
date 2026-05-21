const express = require('express')
const router = express.Router()

const db = require('./database/database.js')



router.get('/', (req, res) => {

    db.all(`
        SELECT *
        FROM historico_vendas
        ORDER BY id_historico_venda DESC
    `, [], (erro, rows) => {

        if (erro) {
            return res.status(500).json(erro)
        }

        res.json(rows)
    })
})

module.exports = router
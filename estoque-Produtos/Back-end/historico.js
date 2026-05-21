const express = require('express')
const router = express.Router()
const db = require('./database/database.js')

// 1. ROTA GET - Busca todo o histórico (http://localhost:3000/historico)
router.get('/', (req, res) => {
    db.all(`
        SELECT *
        FROM historico_vendas
        ORDER BY id_historico_venda DESC
    `, [], (erro, rows) => {
        if (erro) {
            console.error("Erro ao buscar histórico:", erro.message)
            return res.status(500).json({ erro: "Erro ao ler banco", detalhes: erro.message })
        }
        res.json(rows)
    })
})

// 2. ROTA DELETE UNICO - Apaga apenas uma linha pelo ID (http://localhost:3000/historico/:id)
router.delete('/:id', (req, res) => {
    const id = req.params.id
    db.run(`
        DELETE FROM historico_vendas 
        WHERE id_historico_venda = ?
    `, [id], function(erro) {
        if (erro) {
            console.error("Erro ao deletar item do histórico:", erro.message)
            return res.status(500).json({ erro: erro.message })
        }
        res.json({ mensagem: "Registro removido com sucesso!" })
    })
})

// 3. ROTA DELETE GLOBAL - Limpa a tabela inteira para o novo mês (http://localhost:3000/historico)
router.delete('/', (req, res) => {
    db.run(`DELETE FROM historico_vendas`, [], function(erro) {
        if (erro) {
            console.error("Erro ao limpar histórico completo:", erro.message)
            return res.status(500).json({ erro: erro.message })
        }
        res.json({ mensagem: "Todo o histórico foi limpo!" })
    })
})

module.exports = router
const express = require('express')
const router = express.Router()

const db = require('./database/database.js')



// LISTAR PRODUTOS

router.get('/', (req, res) => {

    db.all(`
        SELECT * FROM produtos
    `, [], (erro, rows) => {

        if (erro) {
            return res.status(500).json(erro)
        }

        res.json(rows)
    })
})



// CADASTRAR PRODUTO

router.post('/', (req, res) => {

    const {
        nome_produto,
        categoria_produto,
        quantidade_estoque_produto,
        preco_custo_produto,
        preco_venda_produto,
        preco_consignado_produto,
        quantidade_minima_alerta_produto,
        caminho_imagem_produto
    } = req.body

    db.run(`
        INSERT INTO produtos (

            nome_produto,
            categoria_produto,
            quantidade_estoque_produto,
            preco_custo_produto,
            preco_venda_produto,
            preco_consignado_produto,
            quantidade_minima_alerta_produto,
            caminho_imagem_produto

        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [

        nome_produto,
        categoria_produto,
        quantidade_estoque_produto,
        preco_custo_produto,
        preco_venda_produto,
        preco_consignado_produto,
        quantidade_minima_alerta_produto,
        caminho_imagem_produto

    ], function(erro) {

        if (erro) {
            return res.status(500).json(erro)
        }

        res.json({
            mensagem: 'Produto cadastrado!',
            id_produto: this.lastID
        })
    })
})



// EDITAR PRODUTO

router.put('/:id', (req, res) => {

    const id = req.params.id

    const {
        nome_produto,
        categoria_produto,
        quantidade_estoque_produto,
        preco_custo_produto,
        preco_venda_produto,
        preco_consignado_produto,
        quantidade_minima_alerta_produto,
        caminho_imagem_produto
    } = req.body

    db.run(`
        UPDATE produtos SET

            nome_produto = ?,
            categoria_produto = ?,
            quantidade_estoque_produto = ?,
            preco_custo_produto = ?,
            preco_venda_produto = ?,
            preco_consignado_produto = ?,
            quantidade_minima_alerta_produto = ?,
            caminho_imagem_produto = ?

        WHERE id_produto = ?
    `, [

        nome_produto,
        categoria_produto,
        quantidade_estoque_produto,
        preco_custo_produto,
        preco_venda_produto,
        preco_consignado_produto,
        quantidade_minima_alerta_produto,
        caminho_imagem_produto,
        id

    ], function(erro) {

        if (erro) {
            return res.status(500).json(erro)
        }

        res.json({
            mensagem: 'Produto atualizado!'
        })
    })
})



// EXCLUIR PRODUTO

router.delete('/:id', (req, res) => {

    const id = req.params.id

    db.run(`
        DELETE FROM produtos
        WHERE id_produto = ?
    `, [id], function(erro) {

        if (erro) {
            return res.status(500).json(erro)
        }

        res.json({
            mensagem: 'Produto excluído!'
        })
    })
})

module.exports = router
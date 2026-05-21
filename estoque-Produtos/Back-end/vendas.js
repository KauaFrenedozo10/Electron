const express = require('express')
const router = express.Router()

const db = require('./database/database.js')



router.post('/', (req, res) => {

    const {
        nome_cliente_venda,
        valor_bonificacao_venda,
        valor_final_venda,
        itens
    } = req.body

    const dataAtual = new Date().toISOString()

    db.run(`
        INSERT INTO vendas (

            nome_cliente_venda,
            valor_bonificacao_venda,
            valor_final_venda,
            data_hora_venda

        )

        VALUES (?, ?, ?, ?)
    `, [

        nome_cliente_venda,
        valor_bonificacao_venda,
        valor_final_venda,
        dataAtual

    ], function(erro) {

        if (erro) {
            return res.status(500).json(erro)
        }

        const idVenda = this.lastID

        let quantidadeItens = 0

        itens.forEach(item => {

            quantidadeItens += item.quantidade

            db.run(`
                INSERT INTO itens_venda (

                    id_venda_item_venda,
                    id_produto_item_venda,
                    nome_produto_item_venda,
                    quantidade_produto_item_venda,
                    valor_unitario_produto_item_venda,
                    valor_total_produto_item_venda

                )

                VALUES (?, ?, ?, ?, ?, ?)
            `, [

                idVenda,
                item.id_produto,
                item.nome_produto,
                item.quantidade,
                item.valor_unitario,
                item.valor_total

            ])



            db.run(`
                UPDATE produtos
                SET quantidade_estoque_produto =
                quantidade_estoque_produto - ?
                WHERE id_produto = ?
            `, [

                item.quantidade,
                item.id_produto

            ])
        })



        db.run(`
            INSERT INTO historico_vendas (

                id_venda_historico_venda,
                nome_cliente_historico_venda,
                quantidade_itens_historico_venda,
                valor_total_historico_venda,
                valor_bonificacao_historico_venda,
                valor_final_historico_venda,
                data_hora_historico_venda

            )

            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [

            idVenda,
            nome_cliente_venda,
            quantidadeItens,
            valor_final_venda,
            valor_bonificacao_venda,
            valor_final_venda,
            dataAtual

        ], function(erroHistorico) {

            if (erroHistorico) {
                return res.status(500).json(erroHistorico)
            }

            res.json({
                mensagem: 'Venda realizada!',
                id_venda: idVenda
            })
        })
    })
})

module.exports = router
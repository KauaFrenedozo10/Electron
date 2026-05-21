const express = require('express')
const router = express.Router()
const db = require('./database/database.js')

function executarSQL(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(erro) {
            if (erro) reject(erro)
            else resolve(this)
        })
    })
}

router.post('/', async (req, res) => {
    const {
        nome_cliente_venda,
        valor_bonificacao_venda,
        valor_final_venda,
        itens 
    } = req.body

    const dataAtual = new Date().toISOString()

    try {
        if (!itens || itens.length === 0) {
            return res.status(400).json({ erro: "Nenhum item enviado no pedido." })
        }

        // 1. Insere a venda principal
        const resultadoVenda = await executarSQL(`
            INSERT INTO vendas (nome_cliente_venda, valor_bonificacao_venda, valor_final_venda, data_hora_venda)
            VALUES (?, ?, ?, ?)
        `, [
            nome_cliente_venda || 'Consumidor Não Identificado',
            Number(valor_bonificacao_venda) || 0,
            Number(valor_final_venda) || 0,
            dataAtual
        ])

        const idVenda = resultadoVenda.lastID
        let quantidadeTotalItens = 0
        let totalBrutoCalculado = 0

        // 2. Processa os itens em série (síncrono)
        for (const item of itens) {
            const qtd = Number(item.quantidade_produto) || 1
            const idProd = Number(item.id_produto)
            const nomeProd = item.nome_produto || 'Produto Sem Nome'
            const valUnit = Number(item.valor_unitario) || 0
            const valTotal = Number(item.valor_total) || 0

            quantidadeTotalItens += qtd
            totalBrutoCalculado += valTotal

            // Insere na tabela relacional
            await executarSQL(`
                INSERT INTO itens_venda (
                    id_venda_item_venda, id_produto_item_venda, nome_produto_item_venda,
                    quantidade_produto_item_venda, valor_unitario_produto_item_venda, valor_total_produto_item_venda
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `, [idVenda, idProd, nomeProd, qtd, valUnit, valTotal])

            // Atualiza o estoque físico
            await executarSQL(`
                UPDATE produtos
                SET quantidade_estoque_produto = quantidade_estoque_produto - ?
                WHERE id_produto = ?
            `, [qtd, idProd])
        }

        const itensString = JSON.stringify(itens)

        // 3. Insere no Histórico Global
        await executarSQL(`
            INSERT INTO historico_vendas (
                id_venda_historico_venda, nome_cliente_historico_venda, quantidade_itens_historico_venda,
                itens_historico_venda, valor_total_historico_venda, valor_bonificacao_historico_venda,
                valor_final_historico_venda, data_hora_historico_venda
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            idVenda,
            nome_cliente_venda || 'Consumidor Não Identificado',
            quantidadeTotalItens,
            itensString,
            Number(totalBrutoCalculado) || 0,
            Number(valor_bonificacao_venda) || 0,
            Number(valor_final_venda) || 0,
            dataAtual
        ])

        return res.json({ mensagem: 'Venda realizada com sucesso!', id_venda: idVenda })

    } catch (erroInterno) {
        console.error("ERRO DETECTADO NO NODE:", erroInterno)
        // CRÍTICO: Devolve o erro exato do SQLite para o Front-end capturar e exibir no alert
        return res.status(500).json({ 
            erro: "Erro interno no processamento do banco de dados", 
            detalhes: erroInterno.message 
        })
    }
})

module.exports = router
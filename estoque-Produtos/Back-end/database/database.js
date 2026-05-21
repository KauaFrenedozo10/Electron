const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database(path.join(__dirname, '..', 'estoque.db'))
db.serialize(() => {

    // TABELA DE PRODUTOS

    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (

            id_produto INTEGER PRIMARY KEY AUTOINCREMENT,

            nome_produto TEXT NOT NULL,

            categoria_produto TEXT NOT NULL,

            quantidade_estoque_produto INTEGER NOT NULL,

            preco_custo_produto REAL NOT NULL,

            preco_venda_produto REAL NOT NULL,

            preco_consignado_produto REAL NOT NULL,

            quantidade_minima_alerta_produto INTEGER NOT NULL,

            caminho_imagem_produto TEXT

        )
    `)


    // TABELA DE VENDAS

    db.run(`
        CREATE TABLE IF NOT EXISTS vendas (

            id_venda INTEGER PRIMARY KEY AUTOINCREMENT,

            nome_cliente_venda TEXT NOT NULL,

            valor_bonificacao_venda REAL NOT NULL DEFAULT 0,

            valor_final_venda REAL NOT NULL,

            data_hora_venda TEXT NOT NULL

        )
    `)



    // TABELA DOS ITENS DA VENDA
 
    db.run(`
        CREATE TABLE IF NOT EXISTS itens_venda (

            id_item_venda INTEGER PRIMARY KEY AUTOINCREMENT,

            id_venda_item_venda INTEGER NOT NULL,

            id_produto_item_venda INTEGER NOT NULL,

            nome_produto_item_venda TEXT NOT NULL,

            quantidade_produto_item_venda INTEGER NOT NULL,

            valor_unitario_produto_item_venda REAL NOT NULL,

            valor_total_produto_item_venda REAL NOT NULL,

            FOREIGN KEY (id_venda_item_venda)
            REFERENCES vendas(id_venda)

        )
    `)


    
    // TABELA DE HISTÓRICO DE VENDAS

    db.run(`
        CREATE TABLE IF NOT EXISTS historico_vendas (

            id_historico_venda INTEGER PRIMARY KEY AUTOINCREMENT,

            id_venda_historico_venda INTEGER NOT NULL,

            nome_cliente_historico_venda TEXT NOT NULL,

            quantidade_itens_historico_venda INTEGER NOT NULL,

            valor_total_historico_venda REAL NOT NULL,

            valor_bonificacao_historico_venda REAL,

            valor_final_historico_venda REAL NOT NULL,

            data_hora_historico_venda TEXT NOT NULL,

            FOREIGN KEY (id_venda_historico_venda)
            REFERENCES vendas(id_venda)

        )
    `)

})

console.log('Banco conectado com sucesso!')

module.exports = db
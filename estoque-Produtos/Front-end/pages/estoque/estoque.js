const API_URL = 'http://localhost:3000'

async function carregarProdutos() {

    try {

        const response = await fetch(`${API_URL}/produtos`)

        const produtos = await response.json()

        renderizarProdutos(produtos)

    } catch (error) {

        console.log(error)
    }
}

function formatarDinheiro(valor) {

    return Number(valor).toLocaleString('pt-BR', {

        style: 'currency',

        currency: 'BRL'
    })
}

function renderizarProdutos(produtos) {

    const tabela = document.getElementById('estoque-tabela')

    if (!produtos.length) {

        tabela.innerHTML = `
        
            <tr>

                <td colspan="8">

                    Nenhum produto cadastrado

                </td>

            </tr>
        `

        return
    }

    tabela.innerHTML = produtos.map(produto => {

        let status = ''

        if (produto.quantidade_estoque_produto <= 0) {

            status = '<span class="status-zero">Sem estoque</span>'

        } else if (
            produto.quantidade_estoque_produto <=
            produto.quantidade_minima_alerta_produto
        ) {

            status = '<span class="status-baixo">Estoque baixo</span>'

        } else {

            status = '<span class="status-ok">Normal</span>'
        }

        return `
        
            <tr>

                <td>

                    <img
                        class="produto-imagem"
                        src="${produto.caminho_imagem_produto || 'https://via.placeholder.com/55'}"
                    >

                </td>

                <td>

                    ${produto.nome_produto}

                </td>

                <td>

                    ${produto.categoria_produto}

                </td>

                <td>

                    ${produto.quantidade_estoque_produto}

                </td>

                <td>

                    ${formatarDinheiro(produto.preco_custo_produto)}

                </td>

                <td>

                    ${formatarDinheiro(produto.preco_venda_produto)}

                </td>

                <td>

                    ${formatarDinheiro(produto.preco_consignado_produto)}

                </td>

                <td>

                    ${status}

                </td>

            </tr>
        `
    }).join('')
}

function abrirModalProduto() {

    document.getElementById('modal-produto').style.display = 'flex'
}

function fecharModalProduto() {

    document.getElementById('modal-produto').style.display = 'none'
}

async function salvarProduto() {

    const produto = {

        nome_produto:
            document.getElementById('nome_produto').value,

        categoria_produto:
            document.getElementById('categoria_produto').value,

        quantidade_estoque_produto:
            Number(document.getElementById('quantidade_produto').value),

        preco_custo_produto:
            Number(document.getElementById('preco_custo_produto').value),

        preco_venda_produto:
            Number(document.getElementById('preco_venda_produto').value),

        preco_consignado_produto:
            Number(document.getElementById('preco_consignado_produto').value),

        quantidade_minima_alerta_produto:
            Number(document.getElementById('quantidade_minima_produto').value),

        caminho_imagem_produto:
            document.getElementById('imagem_produto').value
    }

    try {

        await fetch(`${API_URL}/produtos`, {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json'
            },

            body: JSON.stringify(produto)
        })

        fecharModalProduto()

        carregarProdutos()

    } catch (error) {

        console.log(error)
    }
}

carregarProdutos()
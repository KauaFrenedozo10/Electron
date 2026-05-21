const API_URL = 'http://localhost:3000'

let produtosDisponiveis = []

let itensVenda = []

async function carregarProdutosVenda() {

    const response = await fetch(`${API_URL}/produtos`)

    produtosDisponiveis = await response.json()
}

function formatarDinheiro(valor) {

    return Number(valor).toLocaleString('pt-BR', {

        style: 'currency',

        currency: 'BRL'
    })
}

function adicionarProdutoVenda() {

    itensVenda.push({

        id_produto: produtosDisponiveis[0]?.id_produto,

        quantidade: 1
    })

    renderizarProdutosVenda()
}

function removerProdutoVenda(index) {

    itensVenda.splice(index, 1)

    renderizarProdutosVenda()
}

function alterarProduto(index, valor) {

    itensVenda[index].id_produto = Number(valor)

    atualizarPreviewPDF()
}

function alterarQuantidade(index, valor) {

    itensVenda[index].quantidade = Number(valor)

    atualizarPreviewPDF()
}

function renderizarProdutosVenda() {

    const container =
        document.getElementById('lista-produtos-venda')

    container.innerHTML = itensVenda.map((item, index) => {

        return `
        
            <div class="produto-row">

                <select onchange="alterarProduto(${index}, this.value)">

                    ${produtosDisponiveis.map(produto => `
                    
                        <option
                            value="${produto.id_produto}"

                            ${produto.id_produto === item.id_produto
                                ? 'selected'
                                : ''
                            }
                        >

                            ${produto.nome_produto}

                        </option>
                    `).join('')}

                </select>

                <input
                    type="number"
                    min="1"
                    value="${item.quantidade}"
                    onchange="alterarQuantidade(${index}, this.value)"
                >

                <button onclick="removerProdutoVenda(${index})">

                    X

                </button>

            </div>
        `
    }).join('')

    atualizarPreviewPDF()
}

function atualizarPreviewPDF() {

    const preview = document.getElementById('pdf-preview')

    const cliente =
        document.getElementById('cliente_nome').value || 'Sem nome'

    const bonificacao =
        Number(document.getElementById('bonificacao_valor').value)

    let total = 0

    const itensHtml = itensVenda.map(item => {

        const produto = produtosDisponiveis.find(
            p => p.id_produto === item.id_produto
        )

        const subtotal =
            produto.preco_venda_produto * item.quantidade

        total += subtotal

        return `
        
            <div class="preview-item">

                <span>

                    ${produto.nome_produto}
                    x${item.quantidade}

                </span>

                <strong>

                    ${formatarDinheiro(subtotal)}

                </strong>

            </div>
        `
    }).join('')

    const final = total - bonificacao

    document.getElementById('valor_total_venda').innerText =
        formatarDinheiro(total)

    document.getElementById('valor_final_venda').innerText =
        formatarDinheiro(final)

    preview.innerHTML = `
    
        <h2>RECIBO DE VENDA</h2>

        <p>

            Cliente:
            <strong>${cliente}</strong>

        </p>

        <hr>

        <h3>Itens</h3>

        ${itensHtml}

        <div class="preview-total">

            <p>

                Total:
                <strong>${formatarDinheiro(total)}</strong>

            </p>

            <p>

                Bonificação:
                <strong>${formatarDinheiro(bonificacao)}</strong>

            </p>

            <p>

                Final:
                <strong>${formatarDinheiro(final)}</strong>

            </p>

        </div>
    `
}

async function finalizarVenda() {

    const cliente =
        document.getElementById('cliente_nome').value || 'Sem nome'

    const bonificacao =
        Number(document.getElementById('bonificacao_valor').value)

    let total = 0

    const itens = itensVenda.map(item => {

        const produto = produtosDisponiveis.find(
            p => p.id_produto === item.id_produto
        )

        total +=
            produto.preco_venda_produto * item.quantidade

        return {

            nome_produto: produto.nome_produto,

            quantidade_produto: item.quantidade
        }
    })

    const final = total - bonificacao

    await fetch(`${API_URL}/vendas`, {

        method: 'POST',

        headers: {

            'Content-Type': 'application/json'
        },

        body: JSON.stringify({

            nome_cliente_historico_venda: cliente,

            itens_historico_venda: itens,

            valor_total_historico_venda: total,

            valor_bonificacao_historico_venda: bonificacao,

            valor_final_historico_venda: final
        })
    })

    alert('Venda registrada!')
}

function baixarPDFVenda() {

    const conteudo =
        document.getElementById('pdf-preview').innerHTML

    const janela = window.open('', '', 'width=800,height=600')

    janela.document.write(`
    
        <html>

            <head>

                <title>Venda</title>

            </head>

            <body>

                ${conteudo}

            </body>

        </html>
    `)

    janela.document.close()

    janela.print()
}

carregarProdutosVenda()
const API_URL = 'http://localhost:3000'

async function carregarHistoricoVendas() {

    try {

        const response = await fetch(`${API_URL}/vendas`)

        const vendas = await response.json()

        renderizarHistorico(vendas)

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

function renderizarHistorico(vendas) {

    const tabela = document.getElementById('historico-tabela-body')

    if (!vendas.length) {

        tabela.innerHTML = `
        
            <tr>

                <td colspan="6">

                    <div class="sem-historico">

                        Nenhuma venda registrada

                    </div>

                </td>

            </tr>
        `

        return
    }

    tabela.innerHTML = vendas.map(venda => {

        const itens = JSON.parse(venda.itens_historico_venda)

        const itensHtml = itens.map(item => {

            return `
            
                <span class="item-pill">

                    ${item.nome_produto} x${item.quantidade_produto}

                </span>
            `
        }).join('')

        const data = new Date(venda.data_hora_historico_venda)

        const dataFormatada =
            data.toLocaleDateString('pt-BR') +
            ' às ' +
            data.toLocaleTimeString('pt-BR')

        return `
        
            <tr>

                <td>#${venda.id_historico_venda}</td>

                <td>

                    ${venda.nome_cliente_historico_venda}

                </td>

                <td>

                    ${itensHtml}

                </td>

                <td class="valor-bonificacao">

                    ${formatarDinheiro(venda.valor_bonificacao_historico_venda)}

                </td>

                <td class="valor-final">

                    ${formatarDinheiro(venda.valor_final_historico_venda)}

                </td>

                <td>

                    ${dataFormatada}

                </td>

            </tr>
        `
    }).join('')
}

carregarHistoricoVendas()
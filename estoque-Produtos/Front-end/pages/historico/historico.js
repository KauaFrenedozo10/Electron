const API_URL = 'http://localhost:3000'
let listaVendasGlobais = [] // Guarda as vendas na memória para a impressão

async function carregarHistoricoVendas() {
    try {
        const response = await fetch(`${API_URL}/historico?t=${new Date().getTime()}`)
        
        if (!response.ok) throw new Error("Não foi possível carregar os registros.")
        
        const vendas = await response.json()
        listaVendasGlobais = vendas // Salva na global
        renderizarHistorico(vendas)
    } catch (error) {
        console.error("Erro na comunicação com o back-end:", error)
        const tabela = document.getElementById('historico-tabela-body')
        if (tabela) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="7" style="color: red; text-align: center; padding: 20px;">
                        Falha ao conectar com o servidor local. Verifique se o Back-end está ativo.
                    </td>
                </tr>
            `
        }
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
    if (!tabela) return

    if (!vendas || vendas.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="sem-historico" style="text-align: center; padding: 30px; color: #9ca3af; font-style: italic;">
                        Nenhuma movimentação comercial registrada até o momento.
                    </div>
                </td>
            </tr>
        `
        return
    }

    tabela.innerHTML = vendas.map(venda => {
        let itensHtml = ""
        
        try {
            const itens = JSON.parse(venda.itens_historico_venda || "[]")
            itensHtml = itens.map(item => {
                const qtd = item.quantidade_produto || item.quantidade || 1
                const nome = item.nome_produto || 'Produto Não Identificado'
                
                const eBonificacao = item.valor_unitario === 0
                const estiloPill = eBonificacao 
                    ? 'background: #fff3cd; border: 1px solid #ffeeba; color: #856404;'
                    : 'background: #e9ecef; border: 1px solid #ced4da; color: #333;'

                const tagBonificacao = eBonificacao 
                    ? ' <span style="background: #ffc107; padding: 1px 4px; border-radius: 3px; font-size: 10px; color: #000; font-weight: bold; margin-left: 3px;">Bonificação</span>' 
                    : ''

                return `
                    <span class="item-pill" style="display: inline-block; padding: 4px 8px; margin: 2px; border-radius: 4px; font-size: 12px; ${estiloPill}">
                        ${nome} <strong>x${qtd}</strong>${tagBonificacao}
                    </span>
                `
            }).join('')
        } catch (e) {
            console.error("Erro de parse nos itens:", e)
            itensHtml = `<span style="color:red; font-size:12px;">Erro ao carregar lista</span>`
        }

        const data = new Date(venda.data_hora_historico_venda)
        const dataFormatada = isNaN(data.getTime()) 
            ? 'Data Inválida' 
            : data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

        const bonificacao = Number(venda.valor_bonificacao_historico_venda) || 0
        const totalFinal = Number(venda.valor_final_historico_venda) || 0

        return `
            <tr>
                <td style="font-weight: bold; padding: 10px; border-bottom: 1px solid #dee2e6;">#${venda.id_historico_venda}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${venda.nome_cliente_historico_venda}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${itensHtml}</td>
                <td class="valor-bonificacao" style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #ca8a04; font-weight: bold;">
                    ${bonificacao > 0 ? '-' + formatarDinheiro(bonificacao) : formatarDinheiro(0)}
                </td>
                <td class="valor-final" style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #15803d;">
                    ${formatarDinheiro(totalFinal)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #666; font-size: 13px;">${dataFormatada}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center; display: flex; justify-content: center; gap: 4px;">
                    <button class="btn-imprimir" onclick="reimprimirRecibo(${venda.id_historico_venda})">🖨️ PDF</button>
                    <button class="btn-deletar-unico" onclick="deletarRegistroUnico(${venda.id_historico_venda})" title="Excluir do Histórico">❌</button>
                </td>
            </tr>
        `
    }).join('')
}

// Apaga apenas uma linha selecionada
// Apaga apenas uma linha selecionada
async function deletarRegistroUnico(idHistorico) {
    const confirmar = confirm(`Deseja apagar o registro #${idHistorico} do histórico? (Isso não altera o estoque atual dos produtos)`);
    if (!confirmar) return;

    try {
        const response = await fetch(`${API_URL}/historico/${idHistorico}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Erro ao remover o item.");
        
        await carregarHistoricoVendas();

        // AVISO EM TEMPO REAL: Manda uma mensagem para a tela principal atualizar os cards na hora!
        if (window.parent) {
            window.parent.postMessage("atualizar_cards", "*");
        }

    } catch (error) {
        console.error(error);
        alert("Falha ao apagar registro.");
    }
}

// Apaga a tabela inteira do banco de dados (Zera o mês)
async function limparTodoOHistorico() {
    const confirmacao1 = confirm("⚠️ ATENÇÃO CRÍTICA!\n\nVocê tem certeza absoluta que deseja APAGAR TODO o histórico de faturamento existente? Essa operação não pode ser desfeita!");
    if (!confirmacao1) return;

    const confirmacao2 = confirm("Confirmação Final: Digite OK para confirmar que já anotou os dados de faturamento do mês e deseja iniciar uma planilha limpa.");
    if (!confirmacao2) return;

    try {
        const response = await fetch(`${API_URL}/historico`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Erro ao limpar dados.");
        
        await carregarHistoricoVendas();

        // AVISO EM TEMPO REAL: Manda uma mensagem para a tela principal atualizar os cards na hora!
        if (window.parent) {
            window.parent.postMessage("atualizar_cards", "*");
        }

    } catch (error) {
        console.error(error);
        alert("Falha ao limpar histórico.");
    }
}
function reimprimirRecibo(idHistorico) {
    const venda = listaVendasGlobais.find(v => v.id_historico_venda === idHistorico)
    if (!venda) {
        alert("Erro ao resgatar dados da venda para impressão.")
        return
    }

    let itens = []
    try {
        itens = JSON.parse(venda.itens_historico_venda || "[]")
    } catch (e) {
        alert("Erro ao ler os itens do cupom.")
        return
    }

    let totalBruto = 0
    const itensHtml = itens.map(item => {
        const qtd = item.quantidade_produto || item.quantidade || 1
        const nome = item.nome_produto || 'Produto Sem Nome'
        const valTotal = Number(item.valor_total) || 0
        const eBonificacao = item.valor_unitario === 0 || item.tipo === 'bonificacao'
        
        totalBruto += valTotal

        return `
            <div class="preview-item" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>
                    ${nome} x${qtd}
                    ${eBonificacao ? '<span style="background:#ffc107; padding:2px 5px; border-radius:3px; font-size:11px; color: black; font-weight:bold;">Bonificação</span>' : ''}
                </span>
                <strong>${eBonificacao ? 'R$ 0,00' : formatarDinheiro(valTotal)}</strong>
            </div>
        `
    }).join('')

    const desconto = Number(venda.valor_bonificacao_historico_venda) || 0
    const valorLiquido = Number(venda.valor_final_historico_venda) || 0
    
    const dataVenda = new Date(venda.data_hora_historico_venda)
    const dataVendaFormatada = isNaN(dataVenda.getTime()) ? new Date().toLocaleString('pt-BR') : dataVenda.toLocaleString('pt-BR')

    const janela = window.open('', '', 'width=800,height=600')
    janela.document.write(`
        <html>
            <head>
                <title>Reimpressão de Recibo #${venda.id_historico_venda}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: black; }
                    .preview-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                <div style="border: 1px solid #000; padding: 20px;">
                    <h2 style="text-align: center; margin-top: 0;">RECIBO DE ENTREGA DE MERCADORIA</h2>
                    <p><strong>Pedido/Venda:</strong> #${venda.id_historico_venda}</p>
                    <p><strong>Data/Hora Original:</strong> ${dataVendaFormatada}</p>
                    <p><strong>Cliente:</strong> ${venda.nome_cliente_historico_venda}</p>
                    <hr style="border-top: 1px dashed #000;">
                    <h3 style="margin-bottom: 5px;">Relação de Itens</h3>
                    ${itensHtml}
                    <div style="margin-top: 15px; border-top: 2px solid #000; padding-top: 5px;">
                        <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                            <span>Total Bruto dos Itens:</span>
                            <strong>${formatarDinheiro(totalBruto || valorLiquido + desconto)}</strong>
                        </p>
                        <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                            <span>Descontos Adicionais:</span>
                            <strong>${formatarDinheiro(desconto)}</strong>
                        </p>
                        <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 18px;">
                            <span>VALOR LÍQUIDO COBRADO:</span>
                            <strong>${formatarDinheiro(valorLiquido)}</strong>
                        </p>
                    </div>
                </div>
            </body>
        </html>
    `)
    janela.document.close()
}

carregarHistoricoVendas()
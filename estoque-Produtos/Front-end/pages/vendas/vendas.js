const API_URL = 'http://localhost:3000'

let produtosDisponiveis = []
let itensVenda = []

// Busca os produtos do banco SQLite
async function carregarProdutosVenda() {
    try {
        const response = await fetch(`${API_URL}/produtos`)
        produtosDisponiveis = await response.json()
        
        // Inicializa a tela com a primeira linha de produto limpa
        if (produtosDisponiveis.length > 0) {
            itensVenda = []
            adicionarProdutoVenda()
        }
    } catch (error) {
        console.error("Erro ao ler produtos do back-end:", error)
    }
}

function formatarDinheiro(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

// Garante que o item seja adicionado com propriedades seguras e reativas
function adicionarProdutoVenda() {
    if (!produtosDisponiveis || produtosDisponiveis.length === 0) {
        alert('Cadastre produtos no estoque antes de realizar uma movimentação!')
        return
    }

    // Adiciona o primeiro produto encontrado no banco como padrão da linha
    itensVenda.push({
        id_produto: produtosDisponiveis[0].id_produto,
        quantidade: 1,
        tipo: 'venda'
    })

    renderizarProdutosVenda()
}

function removerProdutoVenda(index) {
    itensVenda.splice(index, 1)
    renderizarProdutosVenda()
}

function alterarProduto(index, idProduto) {
    itensVenda[index].id_produto = Number(idProduto)
    atualizarPreviewPDF()
}

function alterarQuantidade(index, quantidade) {
    itensVenda[index].quantidade = Math.max(1, Number(quantidade))
    atualizarPreviewPDF()
}

function alterarTipoItem(index, tipo) {
    itensVenda[index].tipo = tipo
    atualizarPreviewPDF()
}

// Atualiza o HTML da lista de inputs na tela
function renderizarProdutosVenda() {
    const container = document.getElementById('lista-produtos-venda')
    if (!container) return;
    
    if (itensVenda.length === 0) {
        container.innerHTML = `<p style="color: #666; font-style: italic;">Nenhum item adicionado.</p>`
        atualizarPreviewPDF()
        return
    }

    container.innerHTML = itensVenda.map((item, index) => {
        return `
            <div class="produto-row">
                <select style="flex: 2;" onchange="alterarProduto(${index}, this.value)">
                    ${produtosDisponiveis.map(p => `
                        <option value="${p.id_produto}" ${p.id_produto === item.id_produto ? 'selected' : ''}>
                            ${p.nome_produto} (Qtd: ${p.quantidade_estoque_produto})
                        </option>
                    `).join('')}
                </select>

                <input type="number" style="width: 70px;" min="1" value="${item.quantidade}" oninput="alterarQuantidade(${index}, this.value)">

                <select style="flex: 1;" onchange="alterarTipoItem(${index}, this.value)">
                    <option value="venda" ${item.tipo === 'venda' ? 'selected' : ''}>Venda</option>
                    <option value="bonificacao" ${item.tipo === 'bonificacao' ? 'selected' : ''}>Bonificação</option>
                </select>

                <button type="button" style="background:red; color:white; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;" onclick="removerProdutoVenda(${index})">X</button>
            </div>
        `
    }).join('')

    atualizarPreviewPDF()
}

// Monta o espelho do PDF em tempo real na direita
function atualizarPreviewPDF() {
    const preview = document.getElementById('pdf-preview')
    if (!preview) return;

    const cliente = document.getElementById('cliente_nome').value.trim() || 'Consumidor Não Identificado'
    const descontoAdicional = Number(document.getElementById('bonificacao_valor').value) || 0

    let totalBruto = 0

    const itensHtml = itensVenda.map(item => {
        const produto = produtosDisponiveis.find(p => p.id_produto === item.id_produto)
        if (!produto) return ''

        const eBonificacao = item.tipo === 'bonificacao'
        const precoAplicado = eBonificacao ? 0 : produto.preco_venda_produto
        const subtotal = precoAplicado * item.quantidade
        
        totalBruto += subtotal

        return `
            <div class="preview-item" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>
                    ${produto.nome_produto} x${item.quantidade}
                    ${eBonificacao ? '<span style="background:#ffc107; padding:2px 5px; border-radius:3px; font-size:11px; color: black;">Bonificação</span>' : ''}
                </span>
                <strong>${eBonificacao ? 'R$ 0,00' : formatarDinheiro(subtotal)}</strong>
            </div>
        `
    }).join('')

    const valorFinal = Math.max(0, totalBruto - descontoAdicional)

    // Travas de segurança para evitar quebra de execução caso os IDs ainda não existam no DOM
    const elTotalVenda = document.getElementById('valor_total_venda')
    const elFinalVenda = document.getElementById('valor_final_venda')
    if (elTotalVenda) elTotalVenda.innerText = formatarDinheiro(totalBruto);
    if (elFinalVenda) elFinalVenda.innerText = formatarDinheiro(valorFinal);

    preview.innerHTML = `
        <div style="border: 1px solid #000; padding: 20px; font-family: 'Courier New', Courier, monospace; color: black;">
            <h2 style="text-align: center; margin-top: 0;">RECIBO DE ENTREGA DE MERCADORIA</h2>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Cliente:</strong> ${cliente}</p>
            <hr style="border-top: 1px dashed #000;">
            <h3 style="margin-bottom: 5px;">Relação de Itens</h3>
            ${itensHtml || '<p style="font-style: italic;">Nenhum produto listado.</p>'}
            <div style="margin-top: 15px; border-top: 2px solid #000; padding-top: 5px;">
                <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                    <span>Total Bruto dos Itens:</span>
                    <strong>${formatarDinheiro(totalBruto)}</strong>
                </p>
                <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                    <span>Descontos Adicionais:</span>
                    <strong>${formatarDinheiro(descontoAdicional)}</strong>
                </p>
                <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 18px;">
                    <span>VALOR LÍQUIDO COBRADO:</span>
                    <strong>${formatarDinheiro(valorFinal)}</strong>
                </p>
            </div>
        </div>
    `
}

// Salva e persiste os dados com segurança no SQLite
async function finalizarVenda() {
    const cliente = document.getElementById('cliente_nome').value.trim() || 'Consumidor Não Identificado'
    const descontoAdicional = Number(document.getElementById('bonificacao_valor').value) || 0

    if (itensVenda.length === 0) {
        alert('Adicione pelo menos um item para processar a saída!')
        return
    }

    let totalCalculado = 0
    const payloadItens = itensVenda.map(item => {
        const produto = produtosDisponiveis.find(p => p.id_produto === item.id_produto)
        const precoFinalItem = item.tipo === 'bonificacao' ? 0 : produto.preco_venda_produto
        
        totalCalculado += (precoFinalItem * item.quantidade)

        return {
            id_produto: produto.id_produto,
            id_produto_item_venda: produto.id_produto, 
            nome_produto: produto.nome_produto,
            quantidade_produto: item.quantidade,
            valor_unitario: precoFinalItem,
            valor_total: precoFinalItem * item.quantidade
        }
    })

    const finalLiquido = Math.max(0, totalCalculado - descontoAdicional)

    try {
        const response = await fetch(`${API_URL}/vendas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome_cliente_venda: cliente,
                valor_bonificacao_venda: descontoAdicional,
                valor_final_venda: finalLiquido,
                itens: payloadItens
            })
        })

        const dadosResposta = await response.json()

        if (!response.ok) {
            throw new Error(dadosResposta.detalhes || dadosResposta.erro || "Erro desconhecido")
        }

        // --- SEQUÊNCIA DE DESTRAVAMENTO DA TELA ---
        
        // 1. Limpa os campos de texto primeiro
        document.getElementById('cliente_nome').value = ''
        document.getElementById('bonificacao_valor').value = '0'
        
        // 2. Reseta o array de itens para o estado inicial
        itensVenda = []
        
        // 3. Puxa os dados novos do estoque do banco
        const respProd = await fetch(`${API_URL}/produtos`)
        produtosDisponiveis = await respProd.json()
        
        // 4. Cria a primeira linha em branco e atualiza o preview do PDF na direita
        adicionarProdutoVenda()

        // 5. O TRUQUE DE MESTRE: Força a janela a perder e recuperar o foco.
        // Isso mata qualquer travamento de clique do Electron!
        window.blur();
        window.focus();

        // 6. Solta o aviso de sucesso por último, quando a tela já está toda renderizada e destravada
        setTimeout(() => {
            alert('Movimentação gravada no banco com sucesso!')
        }, 100)

    } catch (error) {
        console.error("Falha ao encerrar transação:", error)
        alert('O BANCO DE DADOS REJEITOU A VENDA!\nMotivo: ' + error.message)
    }
}
function baixarPDFVenda() {
    const conteudo = document.getElementById('pdf-preview').innerHTML
    const janela = window.open('', '', 'width=800,height=600')

    janela.document.write(`
        <html>
            <head>
                <title>Recibo</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .preview-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                ${conteudo}
            </body>
        </html>
    `)
    janela.document.close()
}

// Start inicial da tela
carregarProdutosVenda()
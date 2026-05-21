const API_URL = 'http://localhost:3000'
let listaProdutosGeral = [] // Guarda a lista de produtos na memória para consulta rápida
let idProdutoEdicao = null  // Controla se o modal está editando ou salvando um novo

async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos?t=${new Date().getTime()}`)
        const produtos = await response.json()
        listaProdutosGeral = produtos // Salva o estado atual na global
        
        // Atualiza os contadores dos cards antes de montar a tabela
        atualizarCardsDashboard(produtos)
        
        renderizarProdutos(produtos)
    } catch (error) {
        console.error("Erro ao ler estoque do servidor:", error)
    }
}

// NOVA FUNÇÃO: Calcula os dados acumulados e atualiza a interface dos Cards
// FUNÇÃO ATUALIZADA: Calcula dados do Estoque Atual + Vendas Reais do Histórico
async function atualizarCardsDashboard(produtos) {
    let totalItens = 0
    let custoInvestido = 0
    let totalAlertas = 0
    
    // 1. Calcula os dados baseados no estoque físico atual
    produtos.forEach(produto => {
        const qtd = Number(produto.quantidade_estoque_produto) || 0
        const custoUnitario = Number(produto.preco_custo_produto) || 0
        const qtdMinima = Number(produto.quantidade_minima_alerta_produto) || 0

        totalItens += qtd
        custoInvestido += (qtd * custoUnitario) // Custo das mercadorias paradas

        if (qtd <= qtdMinima) {
            totalAlertas++
        }
    })

    // 2. BUSCA DO HISTÓRICO: Calcula o Faturamento REAL do mês corrente
    let faturamentoRealDasVendas = 0
    try {
        const response = await fetch(`${API_URL}/historico?t=${new Date().getTime()}`)
        if (response.ok) {
            const vendas = await response.json()
            vendas.forEach(venda => {
                // Soma o faturamento final líquido de cada venda gravada no banco
                faturamentoRealDasVendas += Number(venda.valor_final_historico_venda) || 0
            })
        }
    } catch (error) {
        console.error("Erro ao buscar histórico para os cards:", error)
    }

    // Injeta os valores calculados diretamente nos elementos do HTML do index.html
    document.getElementById('card-total-itens').innerText = totalItens
    document.getElementById('card-alertas').innerText = totalAlertas
    document.getElementById('card-custo').innerText = formatarDinheiro(custoInvestido)
    
    // Agora o card mostra o faturamento real do histórico! Se o histórico for limpo, vai para R$ 0,00 na hora!
    document.getElementById('card-faturamento').innerText = formatarDinheiro(faturamentoRealDasVendas)
}
function formatarDinheiro(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

function renderizarProdutos(produtos) {
    const tabela = document.getElementById('estoque-tabela')
    if (!tabela) return

    if (!produtos || produtos.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 20px; color: #777; font-style: italic;">
                    Nenhum produto cadastrado no momento.
                </td>
            </tr>
        `
        return
    }

    tabela.innerHTML = produtos.map(produto => {
        let status = ''

        if (produto.quantidade_estoque_produto <= 0) {
            status = '<span class="status-zero" style="background:#f8d7da; color:#721c24; padding:3px 6px; border-radius:4px; font-size:12px;">Sem estoque</span>'
        } else if (produto.quantidade_estoque_produto <= produto.quantidade_minima_alerta_produto) {
            status = '<span class="status-baixo" style="background:#fff3cd; color:#856404; padding:3px 6px; border-radius:4px; font-size:12px;">Estoque baixo</span>'
        } else {
            status = '<span class="status-ok" style="background:#d4edda; color:#155724; padding:3px 6px; border-radius:4px; font-size:12px;">Normal</span>'
        }

        return `
            <tr>
                <td>
                    <img class="produto-imagem" src="${produto.caminho_imagem_produto || 'https://via.placeholder.com/55'}" style="width:45px; height:45px; object-fit:cover; border-radius:4px;">
                </td>
                <td style="font-weight: bold;">${produto.nome_produto}</td>
                <td>${produto.categoria_produto}</td>
                <td><strong>${produto.quantidade_estoque_produto}</strong></td>
                <td>${formatarDinheiro(produto.preco_custo_produto)}</td>
                <td>${formatarDinheiro(produto.preco_venda_produto)}</td>
                <td>${formatarDinheiro(produto.preco_consignado_produto)}</td>
                <td>${status}</td>
                <td style="text-align: center;">
                    <button onclick="editarProduto(${produto.id_produto})" style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; margin-right: 5px;">✏️ Editar</button>
                    <button onclick="deletarProduto(${produto.id_produto}, '${produto.nome_produto}')" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">🗑️ Apagar</button>
                </td>
            </tr>
        `
    }).join('')
}

function abrirModalProduto() {
    idProdutoEdicao = null
    document.getElementById('modal-titulo').innerText = "Cadastrar Novo Produto"
    
    document.getElementById('nome_produto').value = ''
    document.getElementById('categoria_produto').value = ''
    document.getElementById('quantidade_produto').value = '0'
    document.getElementById('preco_custo_produto').value = '0'
    document.getElementById('preco_venda_produto').value = '0'
    document.getElementById('preco_consignado_produto').value = '0'
    document.getElementById('quantidade_minima_produto').value = '0'
    document.getElementById('imagem_produto').value = ''

    document.getElementById('modal-produto').style.display = 'flex'
}

function fecharModalProduto() {
    document.getElementById('modal-produto').style.display = 'none'
    idProdutoEdicao = null
}

function editarProduto(idProduto) {
    const produto = listaProdutosGeral.find(p => p.id_produto === idProduto)
    if (!produto) return

    idProdutoEdicao = idProduto
    document.getElementById('modal-titulo').innerText = "Editar Produto"

    document.getElementById('nome_produto').value = produto.nome_produto
    document.getElementById('categoria_produto').value = produto.categoria_produto
    document.getElementById('quantidade_produto').value = produto.quantidade_estoque_produto
    document.getElementById('preco_custo_produto').value = produto.preco_custo_produto
    document.getElementById('preco_venda_produto').value = produto.preco_venda_produto
    document.getElementById('preco_consignado_produto').value = produto.preco_consignado_produto
    document.getElementById('quantidade_minima_produto').value = produto.quantidade_minima_alerta_produto
    document.getElementById('imagem_produto').value = produto.caminho_imagem_produto || ''

    document.getElementById('modal-produto').style.display = 'flex'
}

// Alerta customizado em banner injetado via DOM para evitar travamentos de foco
function mostrarAvisoSucesso(mensagem) {
    const alerta = document.getElementById('alerta-customizado');
    if (alerta) {
        alerta.querySelector('span').innerText = "✓ " + mensagem;
        alerta.style.display = 'block';
        setTimeout(() => {
            alerta.style.display = 'none';
        }, 2200);
    }
}

async function salvarProduto() {
    const produtoPayload = {
        nome_produto: document.getElementById('nome_produto').value.trim(),
        categoria_produto: document.getElementById('categoria_produto').value.trim(),
        quantidade_estoque_produto: Number(document.getElementById('quantidade_produto').value) || 0,
        preco_custo_produto: Number(document.getElementById('preco_custo_produto').value) || 0,
        preco_venda_produto: Number(document.getElementById('preco_venda_produto').value) || 0,
        preco_consignado_produto: Number(document.getElementById('preco_consignado_produto').value) || 0,
        quantidade_minima_alerta_produto: Number(document.getElementById('quantidade_minima_produto').value) || 0,
        caminho_imagem_produto: document.getElementById('imagem_produto').value.trim()
    }

    if (!produtoPayload.nome_produto || !produtoPayload.categoria_produto) {
        alert('Por favor, preencha o Nome e a Categoria do item!')
        return
    }

    try {
        let url = `${API_URL}/produtos`
        let metodo = 'POST'

        if (idProdutoEdicao !== null) {
            url = `${API_URL}/produtos/${idProdutoEdicao}`
            metodo = 'PUT'
        }

        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produtoPayload)
        })

        if (!response.ok) throw new Error("Erro na comunicação com o servidor local.")

        fecharModalProduto()
        carregarProdutos()
        mostrarAvisoSucesso("Estoque modificado com sucesso!");
    } catch (error) {
        console.error("Falha ao salvar produto:", error)
    }
}

async function deletarProduto(idProduto, nomeProduto) {
    const confirmacao = confirm(`Deseja mesmo remover o produto "${nomeProduto}" definitivamente do sistema?`)
    if (!confirmacao) return

    try {
        const response = await fetch(`${API_URL}/produtos/${idProduto}`, {
            method: 'DELETE'
        })

        if (!response.ok) throw new Error("Erro ao excluir registro.")

        carregarProdutos()
        mostrarAvisoSucesso("Produto excluído do estoque.");
    } catch (error) {
        console.error("Erro ao apagar produto:", error)
    }
}

// Garante que a função está no escopo global para o index.html gerenciar
window.carregarProdutos = carregarProdutos;

// Execução inicial ao abrir o app
carregarProdutos();
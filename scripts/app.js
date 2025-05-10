// Variável global para armazenar as empresas
window.empresas = [];

// Função para carregar empresas
async function loadEmpresas() {
    try {
        const response = await fetch('data/empresas.json');
        if (!response.ok) throw new Error('Arquivo não encontrado');
        
        const data = await response.json();
        window.empresas = data.empresas || [];
        renderEmpresas();
        
        // Atualiza contador
        updateCounter();
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        checkLocalData();
    }
}

// Função para adicionar nova empresa
function addEmpresa() {
    const nomeInput = document.getElementById('nome');
    const cnpjInput = document.getElementById('cnpj');
    const situacaoSelect = document.getElementById('situacao');
    
    if (!nomeInput || !cnpjInput || !situacaoSelect) {
        console.error('Elementos do formulário não encontrados');
        return;
    }
    
    const novaEmpresa = {
        id: Date.now(),
        nome: nomeInput.value,
        cnpj: cnpjInput.value,
        situacao: situacaoSelect.value,
        dataCadastro: new Date().toISOString()
    };
    
    window.empresas.push(novaEmpresa);
    renderEmpresas();
    saveToLocal();
    
    // Limpa o formulário
    document.getElementById('empresaForm').reset();
    
    // Atualiza contador
    updateCounter();
}

// Função para renderizar empresas na tabela
function renderEmpresas() {
    const container = document.getElementById('empresasList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (window.empresas.length === 0) {
        container.innerHTML = '<p>Nenhuma empresa cadastrada.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Situação</th>
                <th>Data Cadastro</th>
            </tr>
        </thead>
        <tbody>
            ${window.empresas.map(empresa => `
                <tr>
                    <td>${empresa.nome}</td>
                    <td>${empresa.cnpj}</td>
                    <td class="situacao-${empresa.situacao.toLowerCase()}">${empresa.situacao}</td>
                    <td>${new Date(empresa.dataCadastro).toLocaleDateString('pt-BR')}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.appendChild(table);
}

// Função para salvar no localStorage
function saveToLocal() {
    if (window.empresas) {
        localStorage.setItem('empresasPendentes', JSON.stringify(window.empresas));
    }
}

// Função para verificar dados locais
function checkLocalData() {
    const pendingData = localStorage.getItem('empresasPendentes');
    if (pendingData) {
        if (confirm('Existem dados não sincronizados. Deseja carregá-los?')) {
            window.empresas = JSON.parse(pendingData);
            renderEmpresas();
            updateCounter();
        }
    }
}

// Função para atualizar contador
function updateCounter() {
    const counterElement = document.getElementById('contador');
    if (counterElement) {
        counterElement.textContent = `(${window.empresas ? window.empresas.length : 0})`;
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Carrega empresas
    loadEmpresas();
    
    // Configura o formulário
    const form = document.getElementById('empresaForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addEmpresa();
        });
    }
    
    // Configura o botão de sincronização
    const syncButton = document.getElementById('syncButton');
    if (syncButton) {
        syncButton.addEventListener('click', () => {
            if (typeof syncWithGitHub === 'function') {
                syncWithGitHub();
            } else {
                console.error('Função syncWithGitHub não disponível');
                const statusElement = document.getElementById('syncStatus');
                if (statusElement) {
                    statusElement.textContent = 'Erro: Função não disponível';
                    statusElement.style.color = 'red';
                }
            }
        });
    }
    
    // Verificação inicial
    console.log('Aplicativo iniciado', {
        empresas: window.empresas,
        syncWithGitHub: typeof syncWithGitHub
    });
});

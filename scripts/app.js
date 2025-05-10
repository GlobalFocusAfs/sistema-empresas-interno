// Carrega os dados quando a página é aberta
document.addEventListener('DOMContentLoaded', () => {
    loadEmpresas();
    
    // Formulário de nova empresa
    document.getElementById('empresaForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addEmpresa();
    });
    
    // Botão de sincronização
    document.getElementById('syncButton').addEventListener('click', syncWithGitHub);
});

// Array para armazenar empresas em memória
let empresas = [];

// Carrega empresas do arquivo JSON
async function loadEmpresas() {
    try {
        const response = await fetch('data/empresas.json');
        const data = await response.json();
        empresas = data.empresas || [];
        renderEmpresas();
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
    }
}

// Adiciona nova empresa
function addEmpresa() {
    const nome = document.getElementById('nome').value;
    const cnpj = document.getElementById('cnpj').value;
    const situacao = document.getElementById('situacao').value;
    
    const novaEmpresa = {
        id: Date.now(), // ID único baseado no timestamp
        nome,
        cnpj,
        situacao,
        dataCadastro: new Date().toISOString()
    };
    
    empresas.push(novaEmpresa);
    renderEmpresas();
    saveToLocal(); // Salva localmente até a sincronização
    
    // Limpa o formulário
    document.getElementById('empresaForm').reset();
}

// Exibe empresas na tela
function renderEmpresas() {
    const container = document.getElementById('empresasList');
    container.innerHTML = '';
    
    if (empresas.length === 0) {
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
            ${empresas.map(empresa => `
                <tr>
                    <td>${empresa.nome}</td>
                    <td>${empresa.cnpj}</td>
                    <td class="situacao-${empresa.situacao.toLowerCase()}">${empresa.situacao}</td>
                    <td>${new Date(empresa.dataCadastro).toLocaleDateString()}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.appendChild(table);
}

// Salva localmente até a sincronização com GitHub
function saveToLocal() {
    localStorage.setItem('empresasPendentes', JSON.stringify(empresas));
}

// Verifica se há dados locais não sincronizados
function checkLocalData() {
    const pendingData = localStorage.getItem('empresasPendentes');
    if (pendingData) {
        if (confirm('Existem dados não sincronizados. Deseja carregá-los?')) {
            empresas = JSON.parse(pendingData);
            renderEmpresas();
        }
    }
}
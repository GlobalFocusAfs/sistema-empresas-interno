// Array para armazenar empresas em memória
let empresas = [];

// Carrega os dados quando a página é aberta
document.addEventListener('DOMContentLoaded', () => {
    checkLocalData();
    loadEmpresas();
    
    // Formulário de nova empresa
    document.getElementById('empresaForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addEmpresa();
    });
    
    // Botão de sincronização
    document.getElementById('syncButton').addEventListener('click', syncWithGitHub);
});

// Carrega empresas do arquivo JSON
async function loadEmpresas() {
    try {
        const response = await fetch('data/empresas.json');
        if (!response.ok) throw new Error('Arquivo não encontrado');
        
        const data = await response.json();
        empresas = data.empresas || [];
        renderEmpresas();
        console.log('Empresas carregadas:', empresas.length);
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        // Tenta carregar do localStorage se houver
        const localData = localStorage.getItem('empresasPendentes');
        if (localData) {
            empresas = JSON.parse(localData);
            renderEmpresas();
        }
    }
}

// Adiciona nova empresa
function addEmpresa() {
    const nome = document.getElementById('nome').value;
    const cnpj = document.getElementById('cnpj').value;
    const situacao = document.getElementById('situacao').value;
    
    const novaEmpresa = {
        id: Date.now(),
        nome,
        cnpj,
        situacao,
        dataCadastro: new Date().toISOString()
    };
    
    empresas.push(novaEmpresa);
    renderEmpresas();
    saveToLocal();
    
    // Limpa o formulário
    document.getElementById('empresaForm').reset();
    
    console.log('Nova empresa adicionada:', novaEmpresa);
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
                    <td>${new Date(empresa.dataCadastro).toLocaleDateString('pt-BR')}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.appendChild(table);
}

// Salva localmente até a sincronização com GitHub
function saveToLocal() {
    localStorage.setItem('empresasPendentes', JSON.stringify(empresas));
    console.log('Dados salvos localmente');
}

// Verifica se há dados locais não sincronizados
function checkLocalData() {
    const pendingData = localStorage.getItem('empresasPendentes');
    if (pendingData) {
        if (confirm('Existem dados não sincronizados. Deseja carregá-los?')) {
            empresas = JSON.parse(pendingData);
            renderEmpresas();
            console.log('Dados locais carregados:', empresas.length);
        }
    }
}

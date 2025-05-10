// Configurações do repositório
const REPO_OWNER = 'GlobalFocusAfs';
const REPO_NAME = 'sistema-empresas-interno';
const FILE_PATH = 'data/empresas.json';
const GITHUB_TOKEN = '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';

// Função principal de sincronização (agora disponível globalmente)
window.syncWithGitHub = async function() {
    const statusElement = document.getElementById('syncStatus');
    if (!statusElement) {
        console.error('Elemento syncStatus não encontrado');
        return;
    }

    try {
        statusElement.textContent = 'Iniciando sincronização...';
        statusElement.style.color = 'blue';
        
        // 1. Obter conteúdo atual do arquivo
        let currentContent;
        try {
            currentContent = await getFileContent();
            console.log('Conteúdo atual obtido:', currentContent);
        } catch (error) {
            if (error.message.includes('404')) {
                console.log('Arquivo não existe, criando novo...');
                currentContent = { content: '{"empresas": []}', sha: null };
            } else {
                throw error;
            }
        }

        // 2. Preparar novo conteúdo
        const empresas = window.empresas || [];
        const newContent = {
            empresas: empresas
        };
        const newContentString = JSON.stringify(newContent, null, 2);
        
        // 3. Atualizar arquivo no GitHub
        await updateFile(newContentString, currentContent.sha);
        
        statusElement.textContent = 'Sincronizado com sucesso! ✅';
        statusElement.style.color = 'green';
        
        // Limpa storage local após sincronização
        localStorage.removeItem('empresasPendentes');
    } catch (error) {
        console.error('Erro na sincronização:', error);
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = `Erro ao sincronizar! ❌ (${error.message})`;
            statusElement.style.color = 'red';
        }
        
        // Mantém os dados não sincronizados no localStorage
        if (window.empresas) {
            localStorage.setItem('empresasPendentes', JSON.stringify(window.empresas));
        }
    }
};

// Função para obter conteúdo do arquivo
async function getFileContent() {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Falha ao obter arquivo'}`);
    }
    
    const data = await response.json();
    return {
        content: atob(data.content.replace(/\s/g, '')),
        sha: data.sha
    };
}

// Função para atualizar arquivo no GitHub
async function updateFile(content, sha) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Atualização de empresas via sistema - ${new Date().toLocaleString('pt-BR')}`,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Falha ao atualizar arquivo'}`);
    }
}

// Verifica se as configurações estão corretas no carregamento
console.log('GitHub API Config:', {
    REPO_OWNER,
    REPO_NAME,
    FILE_PATH,
    TOKEN_PRESENT: !!GITHUB_TOKEN
});

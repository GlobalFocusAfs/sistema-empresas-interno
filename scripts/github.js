// Configurações do repositório
const REPO_OWNER = 'GlobalFocusAfs';
const REPO_NAME = 'sistema-empresas-interno';
const FILE_PATH = 'data/empresas.json';
const GITHUB_TOKEN = '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';

// Função principal de sincronização
window.syncWithGitHub = async function() {
    const statusElement = document.getElementById('syncStatus');
    if (!statusElement) {
        console.error('Elemento syncStatus não encontrado');
        return;
    }

    try {
        // Validação inicial do token
        if (!validateGitHubToken(GITHUB_TOKEN)) {
            throw new Error('Formato do token inválido');
        }

        statusElement.textContent = 'Iniciando sincronização...';
        statusElement.style.color = 'blue';
        
        // 1. Obter conteúdo atual do arquivo
        let currentContent = await getFileContentWithRetry();
        
        // 2. Preparar novo conteúdo
        const empresas = window.empresas || [];
        const newContent = {
            empresas: empresas,
            ultimaAtualizacao: new Date().toISOString(),
            totalRegistros: empresas.length
        };
        const newContentString = JSON.stringify(newContent, null, 2);
        
        // 3. Atualizar arquivo no GitHub
        await updateFile(newContentString, currentContent.sha);
        
        statusElement.textContent = 'Sincronizado com sucesso! ✅';
        statusElement.style.color = 'green';
        
        // Limpa storage local após sincronização
        localStorage.removeItem('empresasPendentes');
        
        // Atualiza a lista após sincronização
        if (typeof loadEmpresas === 'function') {
            await loadEmpresas();
        }
    } catch (error) {
        handleSyncError(error, statusElement);
    }
};

// Função para obter conteúdo do arquivo com tentativa de retry
async function getFileContentWithRetry() {
    let lastError;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const content = await getFileContent();
            return content;
        } catch (error) {
            lastError = error;
            if (error.message.includes('404')) {
                console.log('Arquivo não existe, criando novo...');
                return { 
                    content: '{"empresas": []}', 
                    sha: null 
                };
            }
            
            if (attempt < 2) {
                console.log(`Tentativa ${attempt} falhou, tentando novamente...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    throw lastError;
}

// Função para obter conteúdo do arquivo
async function getFileContent() {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    const response = await fetch(url, {
        headers: createGitHubHeaders()
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Falha ao obter arquivo'}`);
    }
    
    const data = await response.json();
    return {
        content: decodeBase64(data.content),
        sha: data.sha
    };
}

// Função para atualizar arquivo no GitHub
async function updateFile(content, sha) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    const body = {
        message: `Atualização via sistema - ${new Date().toLocaleString('pt-BR')}`,
        content: encodeBase64(content),
        sha: sha || undefined
    };
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: createGitHubHeaders(),
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Falha ao atualizar arquivo'}`);
    }
    
    return await response.json();
}

// Funções auxiliares
function decodeBase64(content) {
    try {
        return decodeURIComponent(escape(atob(content.replace(/\s/g, ''))));
    } catch (e) {
        console.error('Erro ao decodificar conteúdo:', e);
        return atob(content);
    }
}

function encodeBase64(content) {
    return btoa(unescape(encodeURIComponent(content)));
}

function createGitHubHeaders() {
    return {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SistemaEmpresas/1.0',
        'X-GitHub-Api-Version': '2022-11-28'
    };
}

function validateGitHubToken(token) {
    if (!token) return false;
    // Verifica se é um PAT (começa com github_pat_) ou token clássico
    return token.startsWith('github_pat_') || token.startsWith('ghp_');
}

function handleSyncError(error, statusElement) {
    console.error('Erro na sincronização:', error);
    
    let errorMessage = error.message;
    if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Token inválido, expirado ou sem permissões suficientes';
    } else if (error.message.includes('404')) {
        errorMessage = 'Arquivo ou repositório não encontrado';
    } else if (error.message.includes('422')) {
        errorMessage = 'Dados inválidos ou SHA incorreto';
    }
    
    if (statusElement) {
        statusElement.textContent = `Erro ao sincronizar! ❌ (${errorMessage})`;
        statusElement.style.color = 'red';
    }
    
    // Mantém os dados não sincronizados no localStorage
    if (window.empresas) {
        localStorage.setItem('empresasPendentes', JSON.stringify(window.empresas));
    }
}

// Verificação inicial
console.log('Configurações GitHub:', {
    REPO_OWNER,
    REPO_NAME,
    FILE_PATH,
    TOKEN_VALID: validateGitHubToken(GITHUB_TOKEN)
});

// Teste de conexão inicial
async function testGitHubConnection() {
    try {
        const testUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
        const response = await fetch(testUrl, {
            headers: createGitHubHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Conexão com GitHub API: OK', {
            repo: data.full_name,
            permissions: data.permissions
        });
        return true;
    } catch (error) {
        console.error('Falha no teste de conexão:', error);
        return false;
    }
}

// Executa o teste de conexão ao carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        testGitHubConnection().then(success => {
            if (!success) {
                const statusElement = document.getElementById('syncStatus');
                if (statusElement) {
                    statusElement.textContent = 'Problema na conexão com GitHub. Verifique o console.';
                    statusElement.style.color = 'orange';
                }
            }
        });
    }, 1000);
});

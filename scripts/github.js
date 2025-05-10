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
        // Validação inicial
        if (!GITHUB_TOKEN || GITHUB_TOKEN.length < 10) {
            throw new Error('Token de acesso não configurado corretamente');
        }

        statusElement.textContent = 'Iniciando sincronização...';
        statusElement.style.color = 'blue';
        
        // 1. Obter conteúdo atual do arquivo
        let currentContent;
        try {
            currentContent = await getFileContent();
            console.log('Conteúdo atual obtido com sucesso');
        } catch (error) {
            if (error.message.includes('404')) {
                console.log('Arquivo não existe, criando novo...');
                currentContent = { 
                    content: '{"empresas": []}', 
                    sha: null 
                };
            } else {
                throw error;
            }
        }

        // 2. Preparar novo conteúdo
        const empresas = window.empresas || [];
        const newContent = {
            empresas: empresas,
            ultimaAtualizacao: new Date().toISOString()
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
            loadEmpresas();
        }
    } catch (error) {
        console.error('Erro na sincronização:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('401')) {
            errorMessage = 'Token inválido ou expirado. Gere um novo token.';
        } else if (error.message.includes('403')) {
            errorMessage = 'Acesso proibido. Verifique as permissões do token.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Arquivo não encontrado. Verifique o caminho.';
        }
        
        statusElement.textContent = `Erro ao sincronizar! ❌ (${errorMessage})`;
        statusElement.style.color = 'red';
        
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
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'SistemaEmpresas/1.0'
        }
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resposta de erro do GitHub:', errorData);
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
        sha: sha || undefined // Envia sha apenas se existir
    };
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'SistemaEmpresas/1.0'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resposta de erro do GitHub:', errorData);
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

// Verificação inicial
console.log('Configurações GitHub:', {
    REPO_OWNER,
    REPO_NAME,
    FILE_PATH,
    TOKEN_PRESENT: !!GITHUB_TOKEN && GITHUB_TOKEN.length > 10
});

// Teste de conexão inicial (opcional)
async function testConnection() {
    try {
        const testUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
        const response = await fetch(testUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            console.error('Teste de conexão falhou:', response.status);
        } else {
            console.log('Conexão com GitHub API: OK');
        }
    } catch (error) {
        console.error('Erro no teste de conexão:', error);
    }
}

// Executa o teste (remova em produção se desejar)
testConnection();

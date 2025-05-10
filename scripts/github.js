// Configurações do repositório
const REPO_OWNER = 'GlobalFocusAfs';
const REPO_NAME = 'sistema-empresas-interno';
const FILE_PATH = 'data/empresas.json';
const GITHUB_TOKEN = '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';

// Função principal de sincronização
window.syncWithGitHub = async function() {
    const statusElement = document.getElementById('syncStatus');
    try {
        // 1. Verificação inicial
        if (!GITHUB_TOKEN) throw new Error("Token não configurado");
        
        statusElement.textContent = 'Verificando conexão...';
        statusElement.style.color = 'blue';

        // 2. Teste de conexão básica
        const canConnect = await testGitHubConnection();
        if (!canConnect) throw new Error("Falha na conexão com GitHub");

        // 3. Obter conteúdo atual
        let currentContent;
        try {
            currentContent = await getFileContent();
        } catch (error) {
            if (error.message.includes('404')) {
                currentContent = { content: '{"empresas": []}', sha: null };
            } else {
                throw error;
            }
        }

        // 4. Preparar novo conteúdo
        const newContent = {
            empresas: window.empresas || [],
            ultimaAtualizacao: new Date().toISOString()
        };

        // 5. Atualizar arquivo
        await updateFile(JSON.stringify(newContent, null, 2), currentContent.sha);
        
        statusElement.textContent = 'Sincronizado com sucesso! ✅';
        statusElement.style.color = 'green';
        localStorage.removeItem('empresasPendentes');
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        statusElement.textContent = `Erro: ${getFriendlyError(error)}`;
        statusElement.style.color = 'red';
    }
};

// Funções auxiliares atualizadas
async function getFileContent() {
    const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, 
        {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return {
        content: atob(data.content.replace(/\s/g, '')),
        sha: data.sha
    };
}

async function updateFile(content, sha) {
    const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                message: `Atualização em ${new Date().toLocaleString('pt-BR')}`,
                content: btoa(unescape(encodeURIComponent(content))),
                sha: sha
            })
        }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

async function testGitHubConnection() {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );
        return response.ok;
    } catch (error) {
        return false;
    }
}

function getFriendlyError(error) {
    if (error.message.includes('401')) {
        return 'Token inválido ou expirado. Gere um novo token em GitHub Settings > Developer Settings > Tokens';
    }
    if (error.message.includes('404')) {
        return 'Arquivo ou repositório não encontrado. Verifique o nome do repositório e se o arquivo data/empresas.json existe';
    }
    return error.message;
}

// Verificação inicial
console.log('Configuração GitHub:', {
    token: GITHUB_TOKEN ? '***' + GITHUB_TOKEN.slice(-4) : 'NÃO CONFIGURADO',
    repositório: `${REPO_OWNER}/${REPO_NAME}`,
    arquivo: FILE_PATH
});

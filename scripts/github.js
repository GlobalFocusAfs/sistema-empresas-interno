// Configurações do repositório
const REPO_OWNER = 'seu-usuario-github';
const REPO_NAME = 'sistema-empresas-interno';
const FILE_PATH = 'data/empresas.json';
const GITHUB_TOKEN = 'seu-token-de-acesso'; // Gerar em GitHub > Settings > Developer settings > Personal access tokens

// Sincroniza com GitHub
async function syncWithGitHub() {
    try {
        const statusElement = document.getElementById('syncStatus');
        statusElement.textContent = 'Sincronizando...';
        statusElement.style.color = 'blue';
        
        // 1. Obter conteúdo atual do arquivo
        const currentContent = await getFileContent();
        
        // 2. Preparar novo conteúdo
        const newContent = {
            empresas: empresas
        };
        
        // 3. Atualizar arquivo no GitHub
        await updateFile(JSON.stringify(newContent, null, 2), currentContent.sha);
        
        statusElement.textContent = 'Sincronizado com sucesso!';
        statusElement.style.color = 'green';
        
        // Limpa storage local após sincronização
        localStorage.removeItem('empresasPendentes');
    } catch (error) {
        console.error('Erro na sincronização:', error);
        document.getElementById('syncStatus').textContent = 'Erro ao sincronizar!';
        document.getElementById('syncStatus').style.color = 'red';
    }
}

// Obtém conteúdo atual do arquivo
async function getFileContent() {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) throw new Error('Falha ao obter arquivo');
    
    const data = await response.json();
    return {
        content: atob(data.content), // Decodifica base64
        sha: data.sha
    };
}

// Atualiza arquivo no GitHub
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
            message: 'Atualização de empresas via sistema interno',
            content: btoa(unescape(encodeURIComponent(content))), // Codifica para base64
            sha: sha
        })
    });
    
    if (!response.ok) throw new Error('Falha ao atualizar arquivo');
}

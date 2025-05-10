// Configurações do repositório - ATUALIZE ESTES VALORES!
const REPO_OWNER = 'GlobalFocusAfs';
const REPO_NAME = 'sistema-empresas-interno';
const FILE_PATH = 'data/empresas.json';
const GITHUB_TOKEN = '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'; // ← Substitua pelo token gerado

// Função principal de sincronização
window.syncWithGitHub = async function() {
    const statusElement = document.getElementById('syncStatus');
    if (!statusElement) {
        console.error('Elemento syncStatus não encontrado');
        return;
    }

    try {
        statusElement.textContent = 'Iniciando sincronização...';
        statusElement.style.color = 'blue';
        
        // Verifica se o token está presente
        if (!GITHUB_TOKEN || GITHUB_TOKEN.length < 10) {
            throw new Error('Token de acesso não configurado corretamente');
        }

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
        const errorMessage = error.message.includes('401') 
            ? 'Acesso não autorizado - Token inválido ou expirado' 
            : error.message;
        
        statusElement.textContent = `Erro ao sincronizar! ❌ (${errorMessage})`;
        statusElement.style.color = 'red';
        
        // Mantém os dados não sincronizados no localStorage
        if (window.empresas) {
            localStorage.setItem('empresasPendentes', JSON.stringify(window.empresas));
        }
    }
};

// Restante do código permanece igual...
// [Manter as outras funções getFileContent, updateFile, etc.]

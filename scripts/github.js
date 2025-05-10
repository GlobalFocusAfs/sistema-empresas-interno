// Configurações do repositório
const GlobalFocusAfs = 'GlobalFocusAfs';
const sistema-empresas-interno = 'sistema-empresas-interno';
const data/empresas.json = 'data/empresas.json';
const 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 = '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';

// Função para sincronizar com GitHub
async function syncWithGitHub() {
    const statusElement = document.getElementById('syncStatus');
    try {
        statusElement.textContent = 'Iniciando sincronização...';
        statusElement.style.color = 'blue';
        
        console.log('Obtendo conteúdo atual...');
        let currentContent;
        try {
            currentContent = await getFileContent();
            console.log('Conteúdo obtido com sucesso:', currentContent);
        } catch (error) {
            if (error.message.includes('404')) {
                console.log('Arquivo não existe, criando novo...');
                currentContent = { content: '{"empresas": []}', sha: null };
            } else {
                throw error;
            }
        }

        console.log('Preparando novo conteúdo...');
        const newContent = {
            empresas: empresas
        };
        const newContentString = JSON.stringify(newContent, null, 2);
        
        console.log('Atualizando arquivo no GitHub...');
        await updateFile(newContentString, currentContent.sha);
        
        statusElement.textContent = 'Sincronizado com sucesso! ✅';
        statusElement.style.color = 'green';
        console.log('Sincronização completa');
        
        localStorage.removeItem('empresasPendentes');
    } catch (error) {
        console.error('Erro detalhado:', error);
        statusElement.textContent = `Erro ao sincronizar! ❌ (${error.message})`;
        statusElement.style.color = 'red';
        
        // Adiciona os dados não sincronizados de volta ao localStorage
        localStorage.setItem('empresasPendentes', JSON.stringify(empresas));
    }
}

// Obtém conteúdo do arquivo no GitHub
async function getFileContent() {
    const url = `https://api.github.com/repos/${GlobalFocusAfs}/${sistema-empresas-interno}/contents/${data/empresas.json}`;
    console.log(`Buscando arquivo em: ${url}`);
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${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}`,
            'Accept': 'application/vnd.github.v3+json'
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

// Atualiza arquivo no GitHub
async function updateFile(content, sha) {
    const url = `https://api.github.com/repos/${GlobalFocusAfs}/${sistema-empresas-interno}/contents/${data/empresas.json}`;
    console.log(`Enviando atualização para: ${url}`);
    
    const body = {
        message: `Atualização via sistema - ${new Date().toLocaleString('pt-BR')}`,
        content: encodeBase64(content),
        sha: sha || undefined // Envia sha apenas se existir
    };
    
    console.log('Dados sendo enviados:', { ...body, content: '...' }); // Não loga conteúdo completo
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${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}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
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
        return decodeURIComponent(escape(atob(content)));
    } catch (e) {
        console.error('Erro ao decodificar conteúdo:', e);
        return atob(content);
    }
}

function encodeBase64(content) {
    return btoa(unescape(encodeURIComponent(content)));
}

// Log inicial para verificar configurações
console.log('Configurações GitHub:', {
    GlobalFocusAfs,
    sistema-empresas-interno,
    data/empresas.json,
    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: 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 ? '*** (token presente)' : '❌ (token ausente)'
});

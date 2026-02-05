import { sendCallBackMessage } from "../utils/message.js";

// O chatId é adicionado para garantir que mensagens de erro sejam enviadas ao chat correto.
async function getAccessToken(env, chatId) { 
    const tokensG = env.tokens_G;
    const [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, DRIVE_FOLDER_ID] = tokensG.split(',');
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: GOOGLE_REFRESH_TOKEN,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to retrieve access token');
        }

        const data = await response.json();
        return data.access_token || null;
    } catch (error) {
        // Agora usa o chatId injetado.
        await sendCallBackMessage(`Error retrieving access token: ${error.message}`, chatId, env); 
        return null;
    }
}

// O chatId é adicionado para notificar sobre falhas de upload.
// Assumindo que getAccessToken e sendCallBackMessage estão importados/disponíveis.

// O chatId é adicionado para notificar sobre falhas de upload.
async function uploadGdrive(fileUrl, filename, mimeType, env, chatId) { 

    const DRIVE_FOLDER_ID = (env.tokens_G.split(','))[3];
    const MAX_UPLOAD_ATTEMPTS = 3;
    // getAccessToken agora recebe o chatId.
    const accessToken = await getAccessToken(env, chatId); 

    // Verifica se o Access Token foi obtido com sucesso.
    if (!accessToken) {
        return new Response(JSON.stringify({ success: false, message: 'Failed to retrieve access token' }), { status: 500 });
    }
    
    // Baixar o arquivo do link
    const fileResponse = await fetch(fileUrl);
        
    if (!fileResponse.ok) {
        return new Response(JSON.stringify({ success: false, message: 'Erro ao baixar o arquivo' }), { status: 500 });
    }
        
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: mimeType });

    // Lógica para determinar a extensão
    const ext = mimeType.split('/')[1];
    const fileExtension = ext ? `.${ext}` : '';
    const fullFilename = filename.endsWith(fileExtension) ? filename : `${filename}${fileExtension}`;

    const metadata = {
        name: fullFilename,
        parents: [DRIVE_FOLDER_ID]
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', fileBlob, fullFilename);


    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
        let response = null; // 🐛 FIX: Declaração e inicialização no escopo do loop
        try {
            response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formData
            });

            if (!response.ok) {
                // Se a rede funcionou, mas a API falhou, lança erro para retentativa.
                throw new Error(`Failed to upload file (HTTP ${response.status})`);
            }

            const result = await response.json();
            return result.id;

        } catch (error) {
            // Captura erros de rede ou de API.
            await sendCallBackMessage(`Error uploading file (Attempt ${attempt} of ${MAX_UPLOAD_ATTEMPTS}): ${error.message}`, chatId, env); 

            if (attempt === MAX_UPLOAD_ATTEMPTS) {
                return new Response(JSON.stringify({ success: false, message: 'Max upload attempts reached' }), { status: 500 });
            }
        }
    }
}

// O chatId é adicionado para notificar sobre falhas de download.
async function downloadGdrive(fileId, env, chatId) { 
    const MAX_DOWNLOAD_ATTEMPTS = 3;
    const RETRY_DELAY = 2000;

    // getAccessToken agora recebe o chatId.
    const accessToken = await getAccessToken(env, chatId); 
    if (!accessToken) {
        // Agora usa o chatId injetado.
        await sendCallBackMessage("❌ Falha ao obter access token.", chatId, env); 
        throw new Error("Failed to retrieve access token");
    }

    for (let attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt++) {
        let metadataRes = null; // Declaração de variável no escopo do loop
        let fileRes = null;     // Declaração de variável no escopo do loop
        try {
            // 1. Obter metadados
            metadataRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            if (metadataRes.status === 404) {
                // Agora usa o chatId injetado.
                await sendCallBackMessage("❌ Arquivo não encontrado (404). Verifique o fileId e permissões.", chatId, env); 
                throw new Error("File not found");
            }

            if (!metadataRes.ok) {
                // Agora usa o chatId injetado.
                await sendCallBackMessage(`❌ Falha ao obter metadados (HTTP ${metadataRes.status})`, chatId, env); 
                throw new Error(`Failed to fetch file metadata (HTTP ${metadataRes.status})`);
            }
            
            const metadata = await metadataRes.json();
            const fileName = metadata.name || `${fileId}.bin`;
            
            // 2. Fazer download do arquivo
            fileRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            if (!fileRes.ok) {
                // Agora usa o chatId injetado.
                await sendCallBackMessage(`❌ Falha ao baixar o arquivo (HTTP ${fileRes.status})`, chatId, env); 
                throw new Error(`Failed to download file (HTTP ${fileRes.status})`);
            }

            const arrayBuffer = await fileRes.arrayBuffer();

            return {
                buffer: arrayBuffer,
                name: fileName,
                mimeType: fileRes.headers.get("content-type") || "application/octet-stream"
            };

        } catch (err) {
            // Agora usa o chatId injetado.
            await sendCallBackMessage(`⛔ Tentativa ${attempt} falhou: ${err.message}`, chatId, env); 

            if (attempt < MAX_DOWNLOAD_ATTEMPTS) {
                // Agora usa o chatId injetado.
                await sendCallBackMessage("⏳ Nova tentativa em 2 segundos...", chatId, env); 
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                // Agora usa o chatId injetado.
                await sendCallBackMessage("🚫 Número máximo de tentativas atingido.", chatId, env); 
                throw new Error("Max download attempts reached");
            }
        }
    }
}

// O chatId é adicionado para notificar sobre falhas na exclusão.
async function deleteGdrive(fileId, env, chatId) {
    const MAX_DELETE_ATTEMPTS = 3;
    
    // Reutiliza a função de autenticação existente.
    const accessToken = await getAccessToken(env, chatId);

    // Verifica se o Access Token foi obtido com sucesso.
    if (!accessToken) {
        return new Response(JSON.stringify({ success: false, message: 'Failed to retrieve access token' }), { status: 500 });
    }

    for (let attempt = 1; attempt <= MAX_DELETE_ATTEMPTS; attempt++) {
        try {
            // Método DELETE na API v3 do Google Drive
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'DELETE',
                headers: { 
                    Authorization: `Bearer ${accessToken}` 
                }
            });

            // 204 No Content é o retorno de sucesso padrão para DELETE no Google Drive
            if (response.status === 204) {
                // Sucesso: Retorna true ou um objeto de sucesso
                return { success: true, message: 'File deleted successfully' };
            }

            // Se o arquivo não for encontrado (404), não adianta tentar novamente.
            if (response.status === 404) {
                const msg = `❌ Erro: Arquivo ${fileId} não encontrado no GDrive.`;
                await sendCallBackMessage(msg, chatId, env);
                return new Response(JSON.stringify({ success: false, message: 'File not found' }), { status: 404 });
            }

            // Se houve outro erro, lança exceção para cair no catch e tentar novamente
            if (!response.ok) {
                throw new Error(`Failed to delete file (HTTP ${response.status})`);
            }

        } catch (error) {
            // Captura erros de rede ou de API.
            await sendCallBackMessage(`⚠️ Erro ao excluir arquivo (Tentativa ${attempt} de ${MAX_DELETE_ATTEMPTS}): ${error.message}`, chatId, env);

            if (attempt === MAX_DELETE_ATTEMPTS) {
                return new Response(JSON.stringify({ success: false, message: 'Max delete attempts reached' }), { status: 500 });
            }
            
            // Opcional: Pequeno delay antes da próxima tentativa (se desejar consistência com o download)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Exporta as funções de manipulação do Google Drive para serem usadas por outros módulos.
export { downloadGdrive, uploadGdrive, deleteGdrive };
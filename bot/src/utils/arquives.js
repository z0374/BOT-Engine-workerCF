import { sendCallBackMessage } from "./message.js";
import { recFile } from "./recFile.js";
import { uploadGdrive } from "../services/gDrive.js";
// ❗ NOVO: Importa a lista de MIME types permitidos do módulo de configuração
import { ALLOWED_IMAGE_MIMES } from "../../config/mimeType.js"; 


/**
 * Orquestra o download do Telegram e o upload de uma mídia para o Google Drive.
 * @param {string} fileId ID do arquivo do Telegram.
 * @param {string} name Nome do arquivo a ser salvo no Google Drive.
 * @param {string} mimeType MIME type do arquivo (ex: 'image/jpeg').
 * @param {object} env Variáveis de ambiente do Worker.
 * @param {number} chatId ID do chat para notificações de erro.
 * @returns {Promise<string>} O ID do arquivo salvo no Google Drive.
 */
async function image(fileId, name, mimeType, env, chatId){ 
    
    const lowerMime = mimeType.toLowerCase();
    
    // 1. Validação do MIME Type
    if (lowerMime.startsWith('image/')) {
        // Checa se o MIME type da imagem está na lista permitida.
        if (!ALLOWED_IMAGE_MIMES.includes(lowerMime)) {
            await sendCallBackMessage(`Alerta: Formato de imagem não suportado (${mimeType}). Apenas os formatos recomendados (PNG, JPEG, WebP, GIF) são aceitos.`, chatId, env);
            throw new Error("Formato de imagem não suportado.");
        }
    }
    
    // 2. Rejeição de tipos não suportados
    // Se não for imagem nem vídeo, rejeita.
    if (!lowerMime.startsWith('image/') && !lowerMime.startsWith('video/')) {
         await sendCallBackMessage(`Alerta: Tipo de mídia desconhecido ou não suportado: ${mimeType}.`, chatId, env);
         throw new Error("Tipo de mídia não suportado.");
    }


    try{  
        // 3. Obtém a URL de download do Telegram.
        const fileUrl = await recFile(fileId, env);

        // 4. Upload para o Google Drive com o MIME Type validado.
        const gDrive = await uploadGdrive(fileUrl, name, mimeType, env, chatId);
      
        return gDrive.toString(); // Retorna o File ID do Google Drive
    }catch(error){  
        await sendCallBackMessage('Alerta no processamento de mídia: ' + error.message, chatId, env); 
        throw error;
    }
}

export{ image }
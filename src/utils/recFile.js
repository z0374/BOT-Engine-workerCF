// Localização: /assets/js/bot/src/utils/recFile.js

import { sendCallBackMessage } from "./message.js";
  
/**
 * Obtém o URL de download direto de um arquivo no Telegram.
 * @param {string} fileId O ID do arquivo fornecido pelo Telegram (document, photo, video).
 * @param {object} env Variáveis de ambiente do Worker.
 * @param {number} chatId ID do chat, necessário para notificar erros.
 * @returns {Promise<string>} O URL de download direto do arquivo.
 */
async function recFile(fileId, env, chatId) {
    try {
      // O botToken é o primeiro elemento da string env.bot_Token.
      const botToken = env.bot_Token.split(',')[0];
      
      // 1. Obtém o caminho do arquivo (file_path)
      const fileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
      const fileResponse = await fetch(fileUrl);
      const fileData = await fileResponse.json();
  
      if (!fileData.result?.file_path) {
        throw new Error("Erro ao obter caminho do arquivo do Telegram. O arquivo pode ter expirado ou o ID é inválido.");
      }
  
      // 2. Constrói e retorna o URL de download final
      return `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
      
    } catch (error) {
      // 3. Notifica o usuário e propaga o erro
      await sendCallBackMessage("Erro ao obter arquivo: " + error.message, chatId, env);
      
      // Lança um erro para interromper o fluxo na função chamadora (ex: na função 'image').
      throw new Error("Falha ao recuperar o arquivo do Telegram.");
    }
  }

  export{ recFile }
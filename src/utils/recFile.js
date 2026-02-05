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

  async function downloadFile(fileUrl, env, chatId) {
    const MAX_DOWNLOAD_ATTEMPTS = 3;
    const RETRY_DELAY = 2000;

    for (let attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt++) {
        try {
            // 1. Faz o download direto da URL fornecida
            const response = await fetch(fileUrl);

            if (!response.ok) {
                await sendCallBackMessage(`❌ Falha ao baixar arquivo (HTTP ${response.status})`, chatId, env);
                throw new Error(`Failed to download file (HTTP ${response.status})`);
            }

            // 2. Processa o conteúdo binário
            const arrayBuffer = await response.arrayBuffer();
            const mimeType = response.headers.get("content-type") || "application/octet-stream";

            // 3. Extrai o nome do arquivo da própria URL
            // URLs do Telegram geralmente terminam com o nome do arquivo (ex: .../documento.pdf)
            let fileName = fileUrl.split('/').pop();
            
            // Remove parâmetros de query string se houver (ex: ?token=...)
            if (fileName.includes('?')) {
                fileName = fileName.split('?')[0];
            }

            // Decodifica caracteres especiais (ex: "Meus%20Dados.pdf" -> "Meus Dados.pdf")
            fileName = decodeURIComponent(fileName);

            // Se por acaso o nome vier vazio, define um padrão
            if (!fileName) fileName = `file_${Date.now()}.bin`;

            // 4. Retorna a estrutura idêntica à do downloadGdrive
            return {
                buffer: arrayBuffer,
                name: fileName,
                mimeType: mimeType
            };

        } catch (err) {
            // Lógica de Retentativa (Retry)
            await sendCallBackMessage(`⛔ Tentativa ${attempt} falhou: ${err.message}`, chatId, env);

            if (attempt < MAX_DOWNLOAD_ATTEMPTS) {
                await sendCallBackMessage("⏳ Nova tentativa em 2 segundos...", chatId, env);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                await sendCallBackMessage("🚫 Número máximo de tentativas atingido.", chatId, env);
                throw new Error("Max download attempts reached");
            }
        }
    }
}
  export{ recFile, downloadFile }
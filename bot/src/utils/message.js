// Localização: /assets/js/bot/src/utils/message.js (Versão Final Completa e Corrigida)

// Função utilitária para obter o Bot Token de forma consistente
function getBotToken(env) {
    // Extrai o BOT_TOKEN assumindo que ele é o primeiro elemento da string env.bot_Token.
    // Ex: "TOKEN_A, ValorB, ValorC" -> Retorna "TOKEN_A"
    return env.bot_Token.split(',')[0];
}

/**
 * Envia uma mensagem de texto formatada (HTML) para um chat.
 * @param {string} message O texto da mensagem a ser enviada.
 * @param {number} chatId O ID do chat de destino.
 * @param {object} env Variáveis de ambiente do Worker.
 * @returns {Promise<object>} O resultado da resposta da API do Telegram.
 */
async function sendMessage(message, chatId, env) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const botToken = getBotToken(env);
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const response = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
            }),
        });

        const json = await response.json();

        if (!json.ok) {
            console.error("Erro ao enviar mensagem:", json);
            // Lança erro para ser tratado no fluxo principal.
            throw new Error(`Telegram API Error: ${json.description}`);
        }

        return json;
    } catch (error) {
        console.error("Erro ao conectar com a API do Telegram (sendMessage):", error);
        return { ok: false, description: error.message };
    }
}

/**
 * Envia uma mensagem de texto formatada (HTML) para um chat após um delay (simulando callback).
 * É semanticamente similar a sendMessage, mas usado para respostas de fluxo/confirmação.
 * @param {string} message O texto da mensagem a ser enviada.
 * @param {number} chatId O ID do chat de destino.
 * @param {object} env Variáveis de ambiente do Worker.
 * @returns {Promise<object>} O resultado da resposta da API do Telegram.
 */
async function sendCallBackMessage(message, chatId, env) {
    // Mantém o delay de 500ms para evitar flood
    await new Promise(resolve => setTimeout(resolve, 500)); 

    // Reuso da implementação robusta de sendMessage
    return await sendMessage(message, chatId, env);
}

/**
 * Envia um documento ou imagem (midia) com uma legenda (caption) para um chat.
 * @param {Array<object, string>|object} midia Array onde [0] é o objeto do arquivo (com buffer e mimeType) e [1] é a legenda, ou apenas o objeto do arquivo.
 * @param {number} chatId O ID do chat de destino.
 * @param {object} env Variáveis de ambiente do Worker.
 * @returns {Promise<object>} O resultado da resposta da API do Telegram.
 */
async function sendMidia(midia, chatId, env) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const isArray = Array.isArray(midia);
    const file = isArray ? midia[0] : midia;
    const caption = isArray ? midia[1] || '' : '';
    const botToken = getBotToken(env);

    const formData = new FormData();
    formData.append('chat_id', chatId.toString());
    
    // Adiciona o arquivo como um Blob
    formData.append('document', new Blob([file.buffer], { type: file.mimeType }), file.name || 'file.bin'); 
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;

    try {
        const response = await fetch(telegramUrl, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.ok) {
            console.error("Erro ao enviar arquivo:", result);
            throw new Error(`Telegram API Error: ${result.description}`);
        }

        return result;

    } catch (error) {
        console.error("Erro ao conectar com a API do Telegram (sendMidia):", error);
        return { ok: false, description: error.message };
    }
}

/**
 * Deleta uma mensagem específica em um chat.
 * @param {number} messageId O ID da mensagem a ser deletada.
 * @param {number} chatId O ID do chat.
 * @param {object} env Variáveis de ambiente do Worker.
 * @returns {Promise<object>} Objeto indicando sucesso ou falha na operação.
 */
async function deleteMessage(messageId, chatId, env) {
  const botToken = getBotToken(env); 
  const telegramUrl = `https://api.telegram.org/bot${botToken}/deleteMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });

    const json = await response.json();

    if (!json.ok) {
      console.error("Erro ao deletar mensagem:", json);
      // Erros comuns (mensagem já deletada) não devem quebrar o fluxo.
      return { success: false, error: json.description }; 
    }

    return { success: true, result: json.result };
  } catch (error) {
    console.error("Erro ao conectar com a API do Telegram (deleteMessage):", error);
    return { success: false, error: error.message };
  }
}

// Exporta todas as funções de comunicação
export{ sendMessage, sendCallBackMessage, deleteMessage, sendMidia }
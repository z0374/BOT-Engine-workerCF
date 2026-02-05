import { dataExist } from "./src/db/D1.js";
import { handleUser } from "./src/services/user.js";
import { handleRequest } from "./src/services/webhook.js";
import { handleJson } from "./src/services/webHost.js";
import { sendCallBackMessage } from "./src/utils/message.js"; // Importação mantida para log
import { sendMessage } from "./src/utils/message.js"; // Necessário para log de segurança



export default {
  async fetch(request, env, ctx) {
    try {
      // 1. Otimização de Variáveis de Token
      const telegramSecretToken = env.bot_Token.split(",")[1];
//  console.log('passou!');
      const pageToken = env.tokenSite.split(",")[1];
//  console.log('passou!');
      const requestTelegramSecretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
//  console.log('passou!');
      const requestPageToken = request.headers.get("X-Page-Token");
//console.log(`telegram token : ${requestTelegramSecretToken} = ${telegramSecretToken} |\n page token : ${requestPageToken} = ${pageToken}`);
      // 2. Verifica se existe usuário MASTER (Registro inicial)
      const hasMaster = await dataExist("users", { id: 1, tipo: "MASTER" }, env);

      if (!hasMaster) {
        // Delega a requisição bruta para handleUser para que ele possa extrair o chatId e iniciar o cadastro.
        return await handleUser(request, env);
      }

      // 3. Roteamento por Headers

      // Verifica se é requisição do bot do Telegram
      if (requestTelegramSecretToken == telegramSecretToken) {
        // Delega o processamento da mensagem para o handler do webhook.
        return await handleRequest(request, env);
      }

      // Verifica se é uma página autorizada (frontend/site)
      if (requestPageToken == pageToken) {
        // Delega para o handler de JSON (serviço de dados).
        return await handleJson(request, env);
      }

      // 4. Caso não autorizado
      /*if(!requestTelegramSecretToken && !requestPageToken) {
          const assetsBinding = env.ASSETS || env.__STATIC_CONTENT;
        // Se assetsBinding não existir, retorne fallback (ou uma página inline)
        if (!assetsBinding) {
          console.warn("Assets binding não encontrado (env.ASSETS / env.__STATIC_CONTENT undefined)");
          const fallbackHtml = await (async () => {
            // opcional: embed mínimo do index.html aqui como fallback
            return `<html><body><h1>Acesso Negado</h1></body></html>`;
          })();
          return new Response(fallbackHtml, { status: 403, headers: { "Content-Type": "text/html" } });
        }
          // Gere URL absoluta para o asset (evita "Invalid URL")
          // usamos request.url como base para manter o mesmo origin do worker
          const indexUrl = new URL("/index.html", request.url); // -> e.g. https://template.../index.html

          // ou você pode forçar outro origin: new URL('/index.html','https://assets.local')
          // agora busque o asset
          return await assetsBinding.fetch(indexUrl);
      }else{}*/

      return new Response("Acesso Negado!", {status: 200})

    } catch (error) {
      // 5. Tratamento de Erro Global (CRÍTICO EM WORKERS)
      console.error("ERRO FATAL NÃO CAPTURADO:", error.stack);
      
      // Retorna 200 OK para o Telegram para evitar reenvio da mensagem.
      return new Response("OK", { status: 200 });
    }
  },
};

//# sourceMappingURL=

# 🔐 Variáveis de Ambiente e Segredos

O sistema utiliza uma estratégia de **Variáveis Compostas** para economizar slots de variáveis na Cloudflare e agrupar contextos.

Configure estas variáveis no seu `wrangler.toml` ou via Dashboard/Comando `wrangler secret put`.

## 1. `bot_Token` (Telegram & Segurança)
Utilizado em `worker.js` e `src/utils/message.js`.

**Formato:** `TOKEN_TELEGRAM,SECRET_TOKEN_WEBHOOK`

* **Índice 0:** O Token do bot fornecido pelo @BotFather.
* **Índice 1:** O `X-Telegram-Bot-Api-Secret-Token` que você definiu ao configurar o webhook (segurança anti-spoofing).
* **Índice 2:** O ChatId do chat que receberá mensagens de callback e erros.

---

## 2. `tokens_G` (Integração Google Drive)
Utilizado em `src/services/gDrive.js`.

**Formato:** `CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,DRIVE_FOLDER_ID`

* **Índice 0:** Google Client ID (OAuth2).
* **Índice 1:** Google Client Secret.
* **Índice 2:** Refresh Token (para gerar Access Tokens sem intervenção humana).
* **Índice 3:** ID da pasta no Google Drive onde as mídias serão salvas.

---

## 3. `tokenSite` (Integração Frontend/WebHost)
Utilizado em `src/services/webHost.js`.

**Formato:** `ALLOWED_ORIGIN,VALID_PAGE_TOKEN,AUTH_TOKEN`

* **Índice 0:** Domínio permitido para requisições CORS (ex: `https://meusite.com`).
* **Índice 1:** Valor esperado no header `X-Page-Token`.
* **Índice 2:** Valor esperado no header `Authorization`.

---

## 4. Bindings (Vínculos de Recursos)

No seu arquivo `wrangler.toml`, certifique-se de vincular:

* **D1 Database:** Binding name = `Data`
* **KV Namespace:** Binding name = `session`

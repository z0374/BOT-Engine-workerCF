```markdown
# INSTALL.md: Guia de Instalação e Configuração

### 1. Pré-requisitos

* Cloudflare Account (Workers, D1, KV).
* Conta de desenvolvedor Google Cloud (para Google Drive API).
* Node.js e Cloudflare CLI (`wrangler`).

### 2. Configuração de Variáveis de Ambiente

Preencha o seu arquivo `wrangler.toml` (ou utilize o painel de Workers) com as seguintes configurações:

1. **D1 & KV Bindings:** Configure os bindings `Data` (D1) e `sessionState` (KV).
2. **Tokens do Bot:** Preencha `bot_Token` no formato `TOKEN,CHAT_ID`.
3. **Google Drive:** Obtenha as chaves `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` e o `DRIVE_FOLDER_ID` e configure a variável `tokens_G`.

### 3. Configuração do Webhook (Vínculo com Telegram)

Para que o Telegram envie as mensagens para o seu Worker de forma segura, você precisa registrar a URL do seu Worker junto com um token secreto.

1. **Deploy Inicial:** Execute a build de implantação da cloundflare e copie a URL gerada (ex: `https://seu-bot.usuario.workers.dev`).
2. **Registrar Webhook:** Cole a seguinte URL no seu navegador, substituindo os campos pelos seus dados.
* **Nota:** O campo `secret_token` **deve** ser igual ao `token/senha` que você colocou na variável `SECRET_TOKEN` do `wrangler.toml`.


```text
https://api.telegram.org/bot<TOKEN_DO_BOT>/setWebhook?url=<URL_DO_WORKER>&secret_token=<SEU_CHAT_ID>

```


*Exemplo real:*
`https://api.telegram.org/bot123456:ABC-DEF/setWebhook?url=https://meu-bot.workers.dev&secret_token=84SJ7U6K9874A88HJKJ774A4G7FR`
3. **Confirmação:** Você deve ver uma resposta JSON como: `{"ok":true, "result":true, "description":"Webhook was set"}`.

---

### Por que essa mudança é necessária?

No seu arquivo `worker.js`, a validação de segurança é feita nesta linha:
`const telegramSecretToken = env.bot_Token.split(",")[1];`.

Se você não enviar o `secret_token` na URL do webhook, o Telegram não enviará o cabeçalho `X-Telegram-Bot-Api-Secret-Token`, a validação falhará, e o worker ignorará a mensagem.

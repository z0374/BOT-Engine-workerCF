
## 📄 INSTALL.md

```markdown
# INSTALL.md: Guia de Instalação e Configuração

### 1. Pré-requisitos

* Cloudflare Account (Workers, D1, KV).
* Conta de desenvolvedor Google Cloud (para Google Drive API).
* Node.js e Cloudflare CLI (`wrangler`).

### 2. Configuração de Variáveis de Ambiente

Preencha o seu arquivo `wrangler.toml` (ou utilize o painel de Workers) com as seguintes configurações:

1.  **D1 & KV Bindings:** Configure os bindings `Data` (D1) e `sessionState` (KV).
2.  **Tokens do Bot:** Preencha `bot_Token` no formato `TOKEN,CHAT_ID`.
3.  **Google Drive:** Obtenha as chaves `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` e o `DRIVE_FOLDER_ID` e configure a variável `tokens_G`.

### 3. Setup de Segurança (PIN e PUK)

1.  Faça o deploy inicial do Worker.
2.  Envie qualquer mensagem para o bot. Como não há Master cadastrado, o bot iniciará o fluxo `handleUser`.
3.  Siga o fluxo para definir seu **PIN**.
4.  O bot fornecerá o **PUK (Personal Unlock Key)**, necessário para redefinições futuras. **Salve-o em local seguro.**

### 4. Setup do Frontend

1.  O frontend deve ser configurado com o **ALLOWED\_ORIGIN** (variável `tokenSite`).
2.  O frontend deve enviar requisições **POST** para o Worker com os *headers* `X-Page-Token` e `Authorization` (Tokens de página) para acessar o serviço de dados (`webHost.js`).

---

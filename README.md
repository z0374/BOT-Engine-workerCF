# Gerenciador de Sites Chatbot

Este projeto é uma solução de **Gerenciamento de Sites Chatbot** focada em **Pequenos Empresários e Pequenos Desenvolvedores** que buscam uma ferramenta modular e segura para atualizar o conteúdo de catálogos digitais e páginas web diretamente via Telegram.

## ✨ Destaques da Arquitetura

O projeto foi arquitetado para oferecer **melhoria na manutenabilidade e segurança**, utilizando a infraestrutura de Cloudflare Workers (D1, KV, Workers) para um backend escalável e econômico.

* **Modularidade Total:** O código é dividido em módulos de responsabilidade única (`services`, `utils`, `comands`), facilitando o desenvolvimento e a manutenção.
* **Segurança Criptográfica:** Implementação do padrão **PBKDF2** para o hashing seguro de PINs de acesso.
* **Roteamento por Header:** O acesso ao Worker é rigidamente controlado via *headers* HTTP (`X-Telegram-Bot-Api-Secret-Token` e `X-Page-Token`) no arquivo base `worker2.js`.

## ⚙️ Arquitetura e Configuração de Ambiente

O Worker atua como o ponto de controle central, utilizando o estado de sessão e tokens de autorização para rotear o tráfego e garantir a segurança.

### 1. Roteamento e Autorização

O Worker utiliza headers de requisição para identificar a origem do tráfego:

* **Requisições do Telegram:** Roteadas pela chave secreta.
* **Requisições do Frontend/Site:** Roteadas pela chave de página (`X-Page-Token`) para servir os dados ao catálogo.

### 2. Variáveis de Ambiente (Chaves Essenciais)

As variáveis de ambiente (`env`) são cruciais para a operação do bot. Consulte a documentação completa em [docs/ENV_VARS.md](#).

| Variável | Conteúdo Esperado | Notas |
| :--- | :--- | :--- |
| `bot_Token` | **`BOT_TOKEN,CHAT_ID`** | O `CHAT_ID` é usado para verificação de Master/Admin. |
| `tokenSite` | `ALLOWED_ORIGIN, VALID_PAGE_TOKEN, AUTH_TOKEN` | Define o domínio autorizado e as chaves de autorização para o frontend. |

### 3. Hashing Seguro (PBKDF2)

O sistema utiliza o PBKDF2 para proteção de PINs de acesso. O número de iterações (cost) deve ser configurado com segurança (padrão de projeto: 900).

| Parâmetro | Valor Configurado | Nível de Segurança |
| :--- | :--- | :--- |
| **Iterações (Cost)** | **900** | **⚠️ ALERTA DE SEGURANÇA:** O valor de 900 é *extremamente baixo*. É altamente recomendável aumentá-lo. |
| **PUK** | Apenas para redefinição de PIN | A PUK (Personal Unlock Key) é usada para a recuperação do PIN. |

## 📁 Documentação e Arquivos de Configuração

A documentação detalhada para instalação, fluxos de estado e segurança está disponível nos seguintes arquivos:

* **Guia de Instalação Completo:** [docs/INSTALL.md](#)
* **Detalhes das Variáveis de Ambiente:** [docs/ENV_VARS.md](#)
* **Arquitetura do Bot e Estados:** [docs/BOT_API.md](#)
* **Regras de Mídia e Formatos Aceitos:** [docs/MIMETYPES.md](#)

Os arquivos de configuração importantes no diretório `/assets/js/bot` são:

* **Configuração do Worker:** [assets/js/bot/wrangler.toml](#)
* **Lista de MIME Types:** [bot/config/mimeType.js](#)
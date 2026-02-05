# 📝 CHANGELOG: BOT-Engine-workerCF

## [v1.0.0] - 2026-02-03 (MVP)

Esta versão inicial estabelece o Produto Mínimo Viável (MVP), focando na infraestrutura central de um chatbot de gestão via Telegram com persistência em Cloudflare Workers e interface web.

### 🏗️ Arquitetura e Core (Cloudflare Workers)
* **Ponto de Entrada Único (Dispatcher)**: Implementação do `worker.js` para roteamento inteligente de tráfego entre mensagens do Telegram e requisições de dados para o site.
* **Persistência SQL com D1**: Integração com o banco de dados Cloudflare D1 para o armazenamento de utilizadores e itens do catálogo.
* **Gestão de Sessão via KV**: Utilização do Cloudflare KV para manter o estado da conversação e máquinas de estado por utilizador.
* **Roteamento por Headers**: Validação de segurança baseada em tokens (`X-Telegram-Bot-Api-Secret-Token` e `X-Page-Token`) para autorizar o acesso aos serviços.

### 🔐 Segurança e Autenticação
* **Proteção de PIN (PBKDF2)**: Implementação de hashing seguro para PINs utilizando SHA-256 com 100.000 iterações e salt aleatório.
* **Verificação Resistente a Timing Attacks**: Sistema de comparação de hashes que impede a deteção de padrões através do tempo de resposta.
* **Fluxo Master User**: Sistema de registo inicial que identifica e cadastra automaticamente o primeiro utilizador administrador.
* **Sistema de PUK**: Geração de uma chave de recuperação única (Personal Unlock Key) para desbloqueio de conta, com eliminação automática da mensagem após 15 segundos.
* **⚠️ Nota Importante**: As camadas de autenticação para operações de escrita direta (**salvamento, atualização e deleção**) no banco de dados ainda não foram aplicadas nesta versão.

### 📂 Integração de Mídia e Google Drive (GED)
* **Orquestração de Upload**: Automação para capturar mídias do Telegram e transferi-las para o Google Drive.
* **Validação de MIME Type**: Filtro rigoroso de formatos permitidos (PNG, JPEG, WebP, GIF, SVG) configurado centralmente.
* **DownloadGdrive**: Sistema para recuperar e servir ficheiros binários do Google Drive diretamente para o frontend.
* **🚫 Limitações Atuais**:
    * Não há suporte para o processamento de vídeos ou documentos (PDF, DOC, etc.) nesta versão.
    * As operações de escrita no D1 não possuem validação de sessão/auth no código atual.

### 🤖 Chatbot e Comandos
* **Máquina de Estados**: Processador de comandos que mantém o contexto do utilizador através de sessões persistentes no KV.
* **Comandos Iniciais**:
    * `/comandos`: Listagem dinâmica de módulos e comandos disponíveis.
    * `/ajuda`: Guia rápido de suporte ao utilizador.
    * `/encerrar`: Finalização de fluxos ativos e limpeza de cache de sessão.
* **Formatadores Utilitários**: Funções para conversão monetária (BRL), normalização de nomes de ficheiros e desativação de links automáticos.

---
*Este documento é parte da documentação oficial do motor BOT-Engine-workerCF.*


# 🤖 BOT Engine - Worker Cloudflare

> **Licença:** GNU GPLv3  
> **Versão:** 1.0.0 (Stable/MVP)

O **BOT Engine** é um ecossistema backend *serverless* de alta performance, projetado para operar na *Edge* da Cloudflare. Este motor integra o Telegram (Interface de Comando), Google Drive (Storage de Mídia) e Frontends Web, utilizando **Cloudflare D1** para persistência relacional e **Cloudflare KV** para gestão de estados de sessão.

## 🌟 Funcionalidades Principais

* **Arquitetura Serverless:** Deploy global com latência mínima e escalabilidade automática via Cloudflare Workers.
* **Protocolos de Segurança:** * Criptografia de credenciais via **PBKDF2** (SHA-256, 100k iterações + Salt aleatório).
    * Recuperação de acesso via **PUK (Personal Unlock Key)** com autodestruição de mensagem.
* **Gestão de Mídia (GED):** Integração bidirecional com **Google Drive API v3** para armazenamento e streaming de arquivos.
* **WebHost & API:** Serviço especializado para fornecimento de dados JSON e ativos binários para interfaces web externas.
* **State Machine Engine:** Gerenciador de fluxos de conversação persistente, permitindo diálogos complexos e assíncronos.

## 📚 Documentação Técnica

Para facilitar o desenvolvimento e a manutenção, a documentação foi segmentada por domínios:

* **[⚙️ Instalação e Deploy](docs/DEPLOY.md):** Guia técnico para provisionamento e configuração via Wrangler.
* **[🔐 Variáveis de Ambiente](docs/ENV_VARS.md):** Dicionário de Secrets e configurações críticas (Telegram, Google, API).
* **[📂 Estrutura do Projeto](docs/STRUCTURE.md):** Visão detalhada da arquitetura de pastas e módulos.
* **[🛠️ Módulos de Extensão](docs/CONTRIBUTING.md):** Guia para desenvolvedores sobre como expandir as funcionalidades do bot.
* **[📝 Notas de Lançamento](docs/CHANGELOG.md):** Histórico de versões, correções e funcionalidades da engine.
* **[🖼️ Tipos de Mídia](docs/MIMETYPES.md):** Matriz de suporte a formatos de arquivos e extensões permitidas.
* **[🤖 API de Comandos](docs/BOT_API.md):** Documentação dos endpoints e comandos disponíveis via Telegram.

## 🛠️ Tecnologias Utilizadas

* **Runtime:** Cloudflare Workers (V8 Engine)
* **Database:** Cloudflare D1 (SQLite na Edge)
* **Cache/Session:** Cloudflare KV
* **Language:** JavaScript (ES6+)

## 🤝 Contribuição e Licenciamento

Este projeto é distribuído sob a licença **GNU GPLv3**. Encorajamos a colaboração da comunidade. Antes de submeter *Pull Requests*, certifique-se de que sua contribuição adere aos padrões descritos no arquivo de [Contribuição](docs/CONTRIBUTING.md). 

*Nota: Qualquer trabalho derivado distribuído deve, obrigatoriamente, manter os termos da licença original e o código-fonte aberto.*

---
Copyright © 2026 - Desenvolvido sob a Licença GPLv3.

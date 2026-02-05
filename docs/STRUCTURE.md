# 📂 Estrutura do Projeto

Abaixo está a árvore de diretórios completa e organizada do projeto **BOT-Engine-workerCF**.

```text
BOT-Engine-workerCF/
├── assets/                  # Recursos estáticos e Frontend
│   └── pages/               # Páginas HTML servidas pelo bot
│       ├── index.html       # Página inicial do Catálogo
│       └── privacidade.html # Página de Política de Privacidade
├── config/                  # Configurações globais
│   └── mimeType.js          # Lista de tipos de mídia permitidos
├── docs/                    # Documentação do projeto
│   ├── BOT_API.md           # Arquitetura da API e Fluxos
│   ├── CHANGELOG.md         # Registro de alterações
│   ├── CONTRIBUTING.md      # Guia de contribuição
│   ├── ENV_VARS.md          # Variáveis de ambiente
│   ├── INSTALL.md           # Guia de instalação
│   ├── MIMETYPES.md         # Detalhes sobre arquivos suportados
│   └── STRUCTURE.md         # Este arquivo (Mapa do projeto)
├── src/                     # Código fonte principal (Backend)
│   ├── db/                  # Camada de Dados (Database)
│   │   ├── D1.js            # Abstração para Cloudflare D1 (SQLite)
│   │   └── session.js       # Gerenciamento de sessão (KV)
│   ├── services/            # Lógica de Negócio e Integrações
│   │   ├── commands.js      # Roteador de comandos
│   │   ├── cookies.js       # Gestão de cookies
│   │   ├── gDrive.js        # Integração Google Drive API
│   │   ├── user.js          # Gestão de usuários e Auth
│   │   ├── webHost.js       # API JSON para o site
│   │   └── webhook.js       # Handler do Telegram Webhook
│   └── utils/               # Funções Utilitárias
│       ├── arquives.js      # Manipulação de arquivos
│       ├── cryptography.js  # Criptografia e Segurança (PBKDF2)
│       ├── formatters.js    # Formatação de texto e moeda
│       ├── message.js       # Envio de mensagens Telegram
│       └── recFile.js       # Download de arquivos do Telegram
├── GLOBAL_DIR.js            # Utilitário de diretório global
├── README.md                # Documentação principal
├── commands.index.js        # Índice de exportação de comandos
├── engine.index.js          # Índice do motor (Engine)
├── LICENSE                  # Arquivo de Licença (GPLv3)
├── worker.js                # Ponto de entrada (Worker Entrypoint)
└── wrangler.toml            # Configuração do Cloudflare Worker

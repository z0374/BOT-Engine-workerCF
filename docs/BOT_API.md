# BOT_API.md: Arquitetura e Fluxo de Contexto

Este documento detalha o fluxo de execução, a Máquina de Estados (State Machine) e a gestão de contexto (injeção de variáveis) no backend do bot.

### 1. Modelo de Roteamento (Dispatcher)

A função `handleRequest` (`webhook.js`) atua como o dispatcher principal, priorizando a continuidade de um processo em andamento:

1.  **Guarda de Processo Ativo:** Se `userState.proces` estiver definido (ex: `'templatecatalog01'`), a requisição é **delegada imediatamente** ao motor de estados (`templateCatalog01.js`), ignorando o switch de comandos.
2.  **Comandos de Nível Superior:** Se o processo não estiver ativo, o `switch` processa o comando (ex: `/index`, `/catalogo`) e define a flag `userState.proces`.

### 2. Máquina de Estados (Deep State Machine)

A lógica de fluxo de trabalho é controlada pela função `templateCatalog01` (localizada em `/comands`).

| Componente | Variável | Propósito |
| :--- | :--- | :--- |
| **Módulo Ativo** | `userState.proces` | Flag que indica qual módulo (`templateCatalog01` ou outro) deve processar a mensagem. |
| **Estado Atual** | `userState.state` | Define o que o bot está aguardando (ex: `waiting_phone_configuracao`). |
| **Contador** | `userState.procesCont` | Contador de requisições dentro de um fluxo. Usado para prevenir *loops* infinitos (máximo de 3). |
| **Composição** | `waiting_section` | Estado inicial genérico que, na primeira mensagem após o comando, é convertido em um estado específico (ex: `waiting_section_configuracao`). |

### 3. Gestão de Contexto e I/O (Injeção de Variáveis)

O sistema foi corrigido para injetar explicitamente o contexto necessário em **todas** as operações de I/O (Database, Telegram, GDrive), evitando falhas de escopo.

| Variável | Origem | Módulos que Requerem Injeção |
| :--- | :--- | :--- |
| **`chatId`** | Corpo da Requisição | `sendMessage`, `dataExist` (CRUD), `yesOrNo`, `image`, `downloadGdrive` |
| **`userId`** | Corpo da Requisição | `dataExist` (CRUD), `saveUserState` |
| **`env`** | Parâmetro `fetch` | Todos os serviços de I/O de terceiros. |

---
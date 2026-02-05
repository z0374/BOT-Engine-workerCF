# BOT_API.md: Arquitetura e Fluxo de Contexto

Este documento detalha o fluxo de execução, a Máquina de Estados (State Machine) e a gestão de contexto (injeção de variáveis) no backend do bot.

### 1. Modelo de Roteamento (Dispatcher)

A função `handleRequest` (`webhook.js`) atua como o dispatcher principal, priorizando a continuidade de um processo em andamento:

1.  **Guarda de Processo Ativo:** Se `session.proces` estiver definido (ex: `'linksfera'` ou `'templatecatalog01'`), a requisição é identificada pelo `comand` (`src/services/commands.js`) e delegada ao handler correspondente, mantendo o usuário dentro do fluxo daquele comando.
2.  **Comandos de Nível Superior:** Se o processo não estiver ativo, o sistema verifica se a mensagem corresponde a um comando registrado no manifesto (ex: `/index`, `/catalogo`) e inicia um novo fluxo, definindo a flag `session.proces`.

### 2. Máquina de Estados (Deep State Machine)

A lógica de fluxo de trabalho é controlada pelos handlers (localizados em `/comands`). Cada módulo é responsável por gerenciar seus próprios estados.

| Componente | Variável | Propósito |
| :--- | :--- | :--- |
| **Módulo Ativo** | `session.proces` | Flag que indica qual módulo (`linksfera`, `templatecatalog01`, etc.) detém o controle da conversa. |
| **Estado Atual** | `session.state` | Define o que o bot está aguardando naquele momento (ex: `waiting_phone_configuracao`, `waiting_payment`). |
| **Contador** | `session.procesCont` | Contador de interações/tentativas dentro de um mesmo estado. Usado para lógica de retentativa ou prevenção de loops. |
| **Dados** | `session.data` | Objeto para armazenamento temporário de inputs do usuário antes da persistência final no banco. |

### 3. Gestão de Contexto e I/O (Injeção de Variáveis)

O sistema utiliza injeção de dependência para garantir que as operações de I/O (Database, Telegram, GDrive) tenham acesso ao contexto correto sem depender de escopo global.

| Variável | Origem | Módulos que Requerem Injeção |
| :--- | :--- | :--- |
| **`chatId`** | Corpo da Requisição | `sendMessage`, `dataExist` (CRUD), `yesOrNo`, `image`, `downloadGdrive`, `deleteMessage` |
| **`userId`** | Corpo da Requisição | `dataExist` (CRUD), `saveSession`, `recUser`, `handleUser` |
| **`env`** | Parâmetro `fetch` | Todos os serviços de I/O de terceiros e Bindings (D1, KV). |

---

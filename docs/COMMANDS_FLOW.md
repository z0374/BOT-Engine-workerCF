# ⚙️ Comandos da Engine e Fluxos de Execução

Este documento mapeia todos os comandos reconhecidos nativamente pela Engine (`BOT-Engine-workerCF`) e descreve os fluxos de decisão que ocorrem desde o recebimento do Webhook.

---

## 1. Manifesto de Comandos (Dispatcher)

O arquivo `src/services/commands.js` atua como o **Roteador de Negócios**. Ele define a lista de comandos "puros" que iniciam módulos específicos da aplicação.

### Comandos Registrados

Estes comandos são definidos no array `commands_manifest`:

* **`/linksfera`**
    * **Handler:** `COMMANDS.linksfera`
    * **Descrição:** Inicia o fluxo do módulo de gestão do portal de links Linksfera.
* **`/catalogo`**
    * **Handler:** `COMMANDS.templateCatalog01`
    * **Descrição:**  Inicia o fluxo do módulo de gestão do catálogo virtual.

### Lógica de Roteamento (`comand`)

A função `comand` executa a seguinte lógica para decidir para onde enviar a mensagem:

1.  **Verificação de Sessão:** Checa se `SESSION.proces` (processo atual do usuário) ou a mensagem recebida coincide com o nome de algum comando no manifesto.
2.  **Verificação de Texto:** Checa se o texto da mensagem (`messageText`) é exatamente igual ao nome de um comando (ex: `/linksfera`).
3.  **Execução:** Se houver correspondência, executa o `handler` associado com um **Timeout de 15 segundos**.
4.  **Fallback:** Se não encontrar correspondência, retorna erro de "Comando não reconhecido".

---

## 2. Comandos Globais e de Sistema

O arquivo `src/services/webhook.js` intercepta mensagens antes de chegarem aos handlers de negócio. Estes comandos funcionam em qualquer momento, exceto durante o registro inicial (`handleUser`).

### Comandos de Controle

* **`/comandos`**
    * **Fluxo:**
        1.  Carrega a sessão do usuário (`loadSession`).
        2.  Salva a sessão (garantindo consistência).
        3.  Gera uma lista dinâmica baseada no manifesto + comandos de ajuda.
    * **Retorno:** Envia a lista de comandos disponíveis para o usuário.

* **`/ajuda`**
    * **Fluxo:** Ainda não implementado.
    * **Retorno:** Envia texto instruindo o uso de `/comandos` ou `/encerrar`.

* **`/encerrar`**
    * **Fluxo Crítico:**
        1.  Chama `loadSession(env, userId, true)` com a flag `restart=true`.
        2.  Isso **reseta** o objeto de sessão para os valores padrão (`proces: ''`, `state: ''`).
        3.  Salva a sessão limpa no KV.
    * **Retorno:** Mensagem "Encerrado!" e sugestão de listar comandos.

---

## 3. Fluxo de Decisão Binária (`yesOrNo`)

Utilizado para confirmações críticas (Salvar/Editar dados). Localizado em `src/services/webhook.js`.

* **Entradas Aceitas:** `/SIM` e `/NAO` (Case Insensitive).
* **Fluxo `/SIM`**:
    1.  **Verifica Tipo de Operação:** Se a tabela alvo for `config`, tenta realizar um `dataUpdate` (SQL UPDATE).
    2.  **Operação Padrão:** Se não for config ou update falhar, realiza um `dataSave` (SQL INSERT).
    3.  **Pós-Execução:** Reseta a sessão (`loadSession(..., true)`) e pergunta o próximo passo.
* **Fluxo `/NAO`**:
    1.  **Cancelamento:** Reseta imediatamente a sessão.
    2.  **Retorno:** Pergunta se deseja encerrar ou reiniciar o processo anterior.
* **Erro de Input:** Qualquer outra resposta gera o aviso: "Responda com /SIM ou /NAO para confirmar.".

---

## 4. Resumo do Ciclo de Vida da Requisição

1.  **Entrada (`worker.js`):**
    * Recebe `fetch event`.
    * Verifica Tokens de Segurança (`X-Telegram-Bot-Api-Secret-Token`).
    * **Auth Check:** Se não existe usuário MASTER no banco, desvia para `handleUser` (Fluxo de Registro).

2.  **Webhook (`webhook.js`):**
    * Verifica se o usuário comum tem cadastro (`dataExist`).
    * Carrega a Sessão (`KV`).
    * Verifica **Comandos Globais** (`/encerrar`, `/comandos`).

3.  **Dispatcher (`commands.js`):**
    * Se não for global, verifica se é um comando de negócio (`/linksfera`).
    * Se o usuário já estiver preso em um fluxo (`SESSION.proces`), mantém ele no handler ativo.

4.  **Execução:**
    * O Handler específico processa a lógica e retorna o resultado.

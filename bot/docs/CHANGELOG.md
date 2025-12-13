# CHANGELOG.md: Histórico de Alterações

### Versão 1.0.0 (Data do Deploy Inicial)

#### A. Tarefas de Implementação e Configuração (Base do Projeto)

* **Implementação em Cloudflare (WIP):** Setup do Bot para utilização com o código refatorado, incluindo planos para testes de confiabilidade, verificação de respostas e retornos, e correção de redundâncias não tratadas.
* **Configuração de API (configBot - Concluído):**
    * Configuração de `.env` concluída.
    * Configuração de leitura e definição das *enviroments* concluída.
    * Utilização das variáveis com definição de Defaults concluída.
* **Chamadas GED Imagens (WIP):** Organização das chamadas para o GED de imagens (configuração de variáveis, salvamento e exibição de imagens para o cliente).

#### B. Melhorias Arquiteturais e Correções (Refatoração Final)

* **Arquitetura:** Implementação da arquitetura **modular** baseada em Cloudflare Workers (D1 + KV).
* **Segurança:** Módulo de hashing de PINs migrado para o padrão **PBKDF2** (maior segurança).
* **Fluxo de Trabalho:** Adicionada a função de **Máquina de Estados Profundos** (`templateCatalog01.js`) para gerenciar `/index` e `/catalogo`.
* **Funcionalidade:** Implementado o fluxo de registro Master com geração de PUK.
* **Correção Crítica:** Corrigida a lógica de injeção de **`chatId`** em todas as funções de I/O (`sendMessage`, `dados`, `image`), resolvendo bugs de escopo e redundância.
* **Mídia:** Implementação de **validação dinâmica de `mimeType`** para uploads de mídia.
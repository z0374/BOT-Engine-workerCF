# 📘 Guia de Contribuição: BOT-Engine-workerCF

Agradecemos o seu interesse em colaborar com o projeto. Para manter a robustez técnica e a integridade da arquitetura, solicitamos que todas as contribuições sigam as diretrizes estabelecidas neste documento, com especial atenção ao desenvolvimento de **Módulos de Extensão**.

---

## 1. Diretrizes de Arquitetura e Padrões de Desenvolvimento

Para garantir a manutenibilidade do ecossistema, o projeto adota o princípio da separação de interesses (*Separation of Concerns*).

* **Módulos de Extensão:** Componentes externos (ex: `templateCatalog01.js`) atuam como extensões funcionais. É imperativo que a lógica de negócio contida nestes módulos permaneça rigorosamente isolada do núcleo operacional (*engine*).
* **Abstração de I/O:** É vedada a implementação de lógica de Entrada/Saída diretamente nos **Módulos de Extensão**. Utilize exclusivamente as camadas de serviço da *engine* para operações de mensageria ou persistência de dados.
* **Protocolo de Injeção de Contexto:** Como requisito mandatório para a execução no ambiente *Cloudflare Workers*, todas as funções de serviço devem receber por injeção os parâmetros `chatId`, `userId` e `env`.
* **Segurança e Criptografia:** Toda manipulação de credenciais deve ser intermediada pelo módulo de criptografia nativo (implementado via **PBKDF2**). É estritamente proibido o tráfego ou armazenamento de PINs e segredos em texto plano (*plain text*).
* **Consistência da Máquina de Estados:** A navegação do usuário deve ser gerida através do sistema de estados. A aderência às convenções de nomenclatura é crucial para evitar colisões no roteamento do `webhook.js`.

---

## 2. Padronização de Nomenclatura (State Management)

Para assegurar a unicidade dos estados entre múltiplos módulos, adote o padrão semântico: `acao_entidade_contexto`.

### Exemplos de Nomenclatura Técnica:
* `waiting_name_product`: Aguarda entrada de string para identificação de produto.
* `waiting_color_catalog`: Aguarda definição de parâmetro hexadecimal para identidade visual.
* `confirm_delete_item`: Estado de interrupção para validação de exclusão de registro.
* `editing_user_permissions`: Fluxo transacional para alteração de privilégios de acesso.
* `register_credentials_master`: Estado reservado para o provisionamento do administrador global.

---

## 3. Protocolo de Submissão

O fluxo de trabalho segue o modelo *Gitflow* simplificado:

1.  **Fork:** Realize a bifurcação do repositório oficial.
2.  **Branching:** Normalize a criação de branches de funcionalidade (*feature branches*) a partir da branch `develop`.
3.  **Desenvolvimento:** Implemente a melhoria ou o novo **Módulo de Extensão** respeitando os *linters* e padrões citados.
4.  **Validação de Fluxo:** Certifique-se de que os gatilhos de sessão (`session.proces` e `session.state`) possuam condições de terminação claras (entrada, processamento e saída).
5.  **Pull Request (PR):** Submeta a solicitação de mesclagem exclusivamente para a branch `develop`. A branch `main` é destinada apenas a versões estáveis em ambiente de produção.

---


# CONTRIBUTING.md: Guia para Colaboradores

Agradecemos seu interesse em contribuir para o **Gerenciador de Sites Chatbot**.

### 1. Padrões de Código

* **Modularidade:** Mantenha a separação de responsabilidades. Não adicione lógica de I/O em `templateCatalog01.js`. Injete `chatId`, `userId`, e `env` explicitamente nas funções de serviço.
* **Segurança:** Utilize sempre o **PBKDF2** para manipulação de senhas. **NUNCA** armazene senhas ou PINs em texto simples.
* **Consistência de Estado:** Mantenha a convenção de nomenclatura de estados (ex: `waiting_name_configuracao`) para compatibilidade com o sistema de roteamento.

### 2. Processo de Submissão

1.  **Fork:** Faça um fork do repositório.
2.  **Branch:** Crie um branch a partir do branch **`develop`**.
3.  **Implementação:** Implemente as correções ou novas funcionalidades.
4.  **Testes:** Garanta que todos os fluxos de estado relacionados ao seu código foram testados.
5.  **Pull Request:** Submeta seu Pull Request para o branch **`develop`**. O `main` é reservado para releases estáveis.

---

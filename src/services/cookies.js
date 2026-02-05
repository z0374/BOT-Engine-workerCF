// Função principal para gerenciar cookies, suportando os modos "save" (salvar) e "recovery" (recuperar).
function getCookies(mode, request, chatId = null) {
  // Inicia a estrutura switch para processar os diferentes modos de operação.
  switch (mode) {
    // --- Modo 'save': Criar o cabeçalho Set-Cookie ---
    case "save":
      // O modo 'save' requer um chatId para ser armazenado no cookie.
      if (!chatId) {
        // Se o chatId não for fornecido, lança um erro.
        throw new Error("chatId é obrigatório para salvar cookies.");
      }

      // Cria o objeto de cabeçalho (header) Set-Cookie.
      // O cookie 'chatId' é configurado com:
      // - Path=/: Disponível para todos os caminhos do domínio.
      // - HttpOnly: Impede acesso via JavaScript (mitiga XSS).
      // - Secure: Só é enviado por HTTPS.
      // - SameSite=Strict: Protege contra CSRF, limitando o envio a requisições do mesmo site.
      return {
        "Set-Cookie": `chatId=${chatId}; Path=/; HttpOnly; Secure; SameSite=Strict`
      };

    // --- Modo 'recovery': Recuperar cookies da requisição ---
    case "recovery":
      // Obtém a string completa do cabeçalho 'Cookie' da requisição. Se não existir, usa uma string vazia.
      const cookieHeader = request.headers.get("Cookie") || "";
      // Processa a string de cookies para criar um objeto chave-valor.
      const cookies = Object.fromEntries(
        // Divide o cabeçalho por ponto-e-vírgula (;) e itera sobre cada par.
        cookieHeader.split(";").map(c => {
          // Remove espaços em branco do início/fim de cada par.
          // Divide o par 'chave=valor' pelo primeiro '='.
          const [key, ...v] = c.trim().split("=");
          // Decodifica o valor (v.join("=") junta partes se o valor continha '=').
          // Retorna o par [chave, valor decodificado].
          return [key, decodeURIComponent(v.join("="))];
        })
      );
      // Retorna o objeto contendo todos os cookies encontrados.
      return cookies;

    // --- Modo default: Lidar com modos não suportados ---
    default:
      // Se um modo diferente de 'save' ou 'recovery' for fornecido, lança um erro.
      throw new Error(`Modo inválido: ${mode}`);
  }
}

export{getCookies}
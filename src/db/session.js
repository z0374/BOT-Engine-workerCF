// Função assíncrona para carregar o estado da sessão de um usuário.
// Recebe o ambiente do worker (env) e o identificador único do usuário (userId).
async function loadSession(env, userId, restart = false) {
  // Acessa o namespace KV 'sessionState' (definido no wrangler.toml)
  // e utiliza o userId como chave para tentar obter o estado da sessão armazenado.
  const state = await env.session.get(userId);  
  // Verifica se o estado (state) foi retornado (ou seja, não é null ou undefined).
  // Se sim, faz o parsing (conversão) da string JSON para um objeto JavaScript e o retorna.
  // Caso contrário, retorna um objeto padrão inicializado com valores vazios.
  if (state && restart === false) {
    return JSON.parse(state);
  }
  // Se restart é true ou state não existe, retorna objeto padrão
  return {
    proces: '',
    pin: 'naoDefinido',
    state: '',
    titulo: '',
    texto: '',
    data: {},
    list: [],
    procesCont: 0
  };
}

// Função assíncrona para salvar o estado atual da sessão de um usuário.
// Recebe o ambiente do worker (env), o identificador do usuário (userId) e o objeto de estado (state).
async function saveSession(env, userId, state) {
  // Acessa o namespace KV 'sessionState'.
  // Armazena o 'state' serializado (convertido) para uma string JSON, 
  // usando o userId como a chave no armazenamento KV.
  // Se 'state' for null, o KV armazenará a string "null", limpando efetivamente o estado anterior.
  await env.session.put(userId, JSON.stringify(state));
}

export { loadSession, saveSession }
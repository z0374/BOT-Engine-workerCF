// Função assíncrona para carregar o estado da sessão de um usuário.
// Recebe o ambiente do worker (env) e o identificador único do usuário (userId).
async function loadUserState(env, userId) {
  // Acessa o namespace KV 'sessionState' (definido no wrangler.toml)
  // e utiliza o userId como chave para tentar obter o estado da sessão armazenado.
  const state = await env.sessionState.get(userId);  
  // Verifica se o estado (state) foi retornado (ou seja, não é null ou undefined).
  // Se sim, faz o parsing (conversão) da string JSON para um objeto JavaScript e o retorna.
  // Caso contrário, retorna null, indicando que não há estado de sessão ativo.
  return state ? JSON.parse(state) : null;
}

// Função assíncrona para salvar o estado atual da sessão de um usuário.
// Recebe o ambiente do worker (env), o identificador do usuário (userId) e o objeto de estado (state).
async function saveUserState(env, userId, state) {
  // Acessa o namespace KV 'sessionState'.
  // Armazena o 'state' serializado (convertido) para uma string JSON, 
  // usando o userId como a chave no armazenamento KV.
  // Se 'state' for null, o KV armazenará a string "null", limpando efetivamente o estado anterior.
  await env.sessionState.put(userId, JSON.stringify(state));
}

export { loadUserState, saveUserState }
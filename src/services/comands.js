import { commands_manifest } from '../../commands.manifest.js';
import { normalize } from '../utils/formatters';
import { sendMessage } from '../utils/message.js';

// Cache global de módulos carregados
const moduleCache = {};

async function comands(messageText, userState, userId, chatId, userName, update, request, env) {
// Timeout padrão para execução do comando (em ms)
const COMMAND_TIMEOUT = 5000;
const ENGINE_GLOBAL_DIR = "../../../";
  const normalizedMessage = normalize(messageText);

  // procura o comando correspondente no manifesto
  const cmd = commands_manifest.find(c => normalize(c.name) === normalizedMessage);

  if (!cmd) {
    await sendMessage(
      `Comando "${messageText}" não reconhecido. Use /comandos para ver a lista de comandos disponíveis.`,
      chatId,
      env
    );
    return null;
  }

  try {
    // lazy-load com cache
    let mod;
    if (moduleCache[cmd.name]) {
      mod = moduleCache[cmd.name];
    } else {
      const modulePath = new URL(cmd.path, ENGINE_GLOBAL_DIR).href;
      mod = await import(modulePath);
      moduleCache[cmd.name] = mod;
    }

    const handler = mod[cmd.handlerExport];

    if (typeof handler !== 'function') {
      console.warn(`Comando "${cmd.name}" carregado, mas handler "${cmd.handlerExport}" não é uma função.`);
      await sendMessage(`O comando "${cmd.name}" ainda não está implementado corretamente.`, chatId, env);
      return null;
    }

    // Executa o handler com timeout
    const result = await Promise.race([
      handler(userState, messageText, userId, chatId, userName, update, env),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Tempo limite de execução do comando "${cmd.name}" excedido.`)), COMMAND_TIMEOUT)
      )
    ]);

    return result;

  } catch (err) {
    console.error(`Erro ao carregar ou executar o comando "${cmd.name}":`, err);
    await sendMessage(`Ocorreu um erro ao executar o comando "${cmd.name}". Tente novamente mais tarde.`, chatId, env);
    return null;
  }
}

export { comands };

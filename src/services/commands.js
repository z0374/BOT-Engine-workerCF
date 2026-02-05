import { normalize } from '../utils/formatters.js';
import { sendMessage } from '../utils/message.js';

import * as COMMANDS from '../../commands.index.js';

const commands_manifest = [
  {
    name: 'linksfera',
    handler: COMMANDS.linksfera
  },
  {
    name: 'catalogo',
    handler: COMMANDS.templateCatalog01
  }
];

async function comand(messageText, SESSION, userId, chatId, userName, update, env) {
  const COMMAND_TIMEOUT = 15000;
  const cmd = commands_manifest.find(
    c =>
      normalize(c.name) === normalize(messageText) ||
      normalize(c.name) === normalize(SESSION.proces)
  );

  if (!cmd) {
    await sendMessage(
      `Comando "${messageText}" não reconhecido. Use /comandos para ver a lista de comandos disponíveis.`,
      chatId,
      env
    );
    return null;
  }

  try {
    const handler = cmd.handler;

    const result = await Promise.race([
      handler(SESSION, messageText, userId, chatId, userName, update, env),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(
            new Error(`Tempo limite de execução do comando "${cmd.name}" excedido.`)
          ),
          COMMAND_TIMEOUT
        )
      )
    ]);

    return result;

  } catch (err) {
    console.error(`Erro ao executar o comando "${cmd.name}":`, err);
    await sendMessage(
      `Ocorreu um erro ao executar o comando "${cmd.name}". Tente novamente mais tarde.`,
      chatId,
      env
    );
    return null;
  }
}

export { comand, commands_manifest };

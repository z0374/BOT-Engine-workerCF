import { normalize } from '../utils/formatters.js';
import { sendMessage } from '../utils/message.js';

// commands.registry.js

import { linksfera } from '../../../comands/linksfera/linksfera.js';
import { templateCatalog01 } from '../../../comands/templateCatalog01/templateCatalog01.js';

const commands_manifest = [
  {
    name: 'linksfera',
    handler: linksfera
  },
  {
    name: 'catalogo',
    handler: templateCatalog01
  }
];

async function comands(messageText, userState, userId, chatId, userName, update, env) {
  const COMMAND_TIMEOUT = 5000;
  const normalizedMessage = normalize(messageText);

  const cmd = commands_manifest.find(
    c => normalize(c.name) === normalizedMessage
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
      handler(userState, messageText, userId, chatId, userName, update, env),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Tempo limite de execução do comando "${cmd.name}" excedido.`)),
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

export { comands, commands_manifest };

import { sendCallBackMessage } from "../utils/message.js";

// Função assíncrona para salvar dados no banco de dados D1 (SQLite).
// Recebe o conteúdo a ser salvo (content), os detalhes da tabela (tabela), o ambiente do worker (env) e o ID do chat para callbacks (chatId).
async function dataSave(content, tabela, env, chatId) { 
  // Atribui a instância do banco de dados D1 do ambiente à variável local _data.
  const _data = env.Data;

  try {
    // Inicia um bloco try-catch para lidar com erros de banco de dados e lógica.
    
    // Verifica se os parâmetros de tabela são válidos (se o nome da tabela e as colunas foram fornecidas).
    if (!tabela || !tabela[0] || !tabela[1] || Object.keys(tabela[1]).length === 0) {
      // Define a mensagem de erro para dados ou tabela inválidos.
      const mensagem = 'Dados ou tabela inválidos.';
      // Envia a mensagem de erro de volta para o chat do usuário.
      await sendCallBackMessage(mensagem, chatId, env); 
      // Retorna uma resposta HTTP 400 (Bad Request).
      return new Response(mensagem, { status: 400 });
    }

    // Consulta o esquema do SQLite para verificar se a tabela já existe.
    const tableExists = await _data.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`
    ).bind(tabela[0]).all();

    // Se a tabela não existir (nenhum resultado retornado), entra no bloco para criá-la.
    if (tableExists.results.length === 0) {
      try {
        // Tenta criar a tabela.
        
        // Formata a string de colunas, garantindo que cada coluna seja do tipo TEXT e envolta em aspas duplas.
        const colunas = tabela[1].split(',').map(coluna => `"${coluna.trim()}" TEXT`).join(", ");

        // Cria e executa a query SQL para criar a tabela, incluindo um ID de auto-incremento.
        await _data.prepare(`
          CREATE TABLE "${tabela[0]}" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ${colunas}
          );
        `).run();

        // Envia uma mensagem de sucesso no chat informando que a tabela foi criada.
        await sendCallBackMessage(`Tabela "${tabela[0]}" criada com sucesso.`, chatId, env); 
      } catch (error) {
        // Se houver erro na criação da tabela.
        const mensagemErro = `Erro ao criar a tabela ${tabela[0]}.`;
        // Loga o erro no console do worker.
        console.error(mensagemErro, error);
        // Envia a mensagem de erro detalhada de volta para o chat.
        await sendCallBackMessage(`${mensagemErro} - ${error.message}`, chatId, env); 
        // Retorna uma resposta HTTP 500 (Internal Server Error).
        return new Response(`${mensagemErro} - ${error.message}`, { status: 500 });
      }
    }

    // Cria a string de placeholders '?' para a inserção (um para cada valor em 'content').
    const valores = content.map(() => '?').join(", ");
    // Verifica se o número de valores (`content.length`) corresponde ao número de colunas a serem inseridas.
    if (content.length !== tabela[1].split(',').length) {
      // Define a mensagem de erro para disparidade entre valores e colunas.
      const mensagem = 'Número de valores e colunas não batem.';
      // Envia a mensagem de erro de volta para o chat.
      await sendCallBackMessage(mensagem, chatId, env); 
      // Retorna uma resposta HTTP 400 (Bad Request).
      return new Response(mensagem, { status: 400 });
    }

    // Monta a consulta SQL de inserção (INSERT INTO).
    const query = `INSERT INTO ${tabela[0]} (${tabela[1]}) VALUES (${valores})`;

    // Executa a inserção dos dados usando bind (para passar os valores de forma segura).
    await _data.prepare(query).bind(...content).run();

    // Define a mensagem de sucesso.
    const sucesso = 'Salvo com sucesso!';
    // Envia a mensagem de sucesso de volta para o chat.
    await sendCallBackMessage(sucesso, chatId, env); 
    // Recupera o ID da última linha inserida.
    const lastInsertId = await _data.prepare("SELECT last_insert_rowid() AS id").first();
    // Retorna o ID inserido como string.
    return lastInsertId.id.toString();

  } catch (error) {
    // Captura qualquer erro ocorrido durante a operação de salvamento.
    const mensagem = 'Erro ao salvar dados no banco de dados';
    // Loga o erro completo para depuração.
    console.error(error);
    // Envia a mensagem de erro detalhada de volta para o chat.
    await sendCallBackMessage(`${mensagem} - ${error.message}`, chatId, env); 
    // Retorna uma resposta HTTP 422 (Unprocessable Entity).
    return new Response(mensagem, { status: 422 });
  }
}

async function dataUpdate(content, tabela, chatId, env) {
  const _data = env.Data;
  try {
    const nomeTabela = tabela[0];
    const colunasRaw = tabela[1];
    
    // 1. Verifica existência da tabela
    const tableExists = await _data.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?;`).bind(nomeTabela).all();
    if (tableExists.results.length === 0) return 0;

    // 2. Separa as colunas e os valores destinados ao SET
    const colunas = colunasRaw.split(',').map(c => c.trim());
    
    // Pegamos apenas os valores que correspondem às colunas (do início do array)
    const valoresParaSet = content.slice(0, colunas.length);
    
    // 3. Define o critério do WHERE (sempre o último elemento do content)
    const valorFiltro = content[content.length - 1];
    const campoFiltro = Number.isInteger(Number(valorFiltro)) ? 'id' : 'type';
    const identificadorVal = campoFiltro === 'id' ? Number(valorFiltro) : valorFiltro;

    // 4. Monta a Query
    const setParts = colunas.map(coluna => `${coluna} = ?`).join(', ');
    const query = `UPDATE ${nomeTabela} SET ${setParts} WHERE ${campoFiltro} = ?`;

    // 5. Executa o Bind unindo os valores do SET + o valor do WHERE
    const stmt = _data.prepare(query).bind(...valoresParaSet, identificadorVal);
    const result = await stmt.run();

    if (result.meta.changes !== 0) {
      await sendCallBackMessage('Dados atualizados com sucesso!', chatId, env);
    }

    return result.meta.changes;

  } catch (error) {
    await sendCallBackMessage("Erro ao fazer o update:\n" + error.message, chatId, env);
    return 0;
  }
}

async function dataDelete(tabela, identificador, chatId, env) {
  const _data = env.Data;
  try {
    const nomeTabela = tabela;

    // 1. Verifica se a tabela existe
    const tableExists = await _data.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`
    ).bind(nomeTabela).all();

    if (tableExists.results.length === 0) {
      return 0;
    }

    // 2. Define se a busca é por ID (número) ou TYPE (texto)
    const campoFiltro = Number.isInteger(Number(identificador)) ? 'id' : 'type';
    const valorFiltro = campoFiltro === 'id' ? Number(identificador) : identificador;

    // =================================================================================
    // NOVO BLOCO: Verificar se existem imagens para excluir no GDrive ANTES do DELETE
    // =================================================================================
    
    // Busca os registros que serão afetados pelo delete
    const querySelect = `SELECT * FROM ${nomeTabela} WHERE ${campoFiltro} = ?`;
    const registrosParaDeletar = await _data.prepare(querySelect).bind(valorFiltro).all();

    // Itera sobre os resultados (caso seja uma exclusão por 'type', pode haver vários)
    if (registrosParaDeletar.results && registrosParaDeletar.results.length > 0) {
        for (const registro of registrosParaDeletar.results) {
            // Verifica se o tipo é imagem
            if (registro.type === 'img') {
                const fileId = registro.data.trim();
                
                if (fileId) {
                    await sendCallBackMessage(`🗑️ Excluindo imagem do GDrive...`, chatId, env);
                    // Chama a função de exclusão do GDrive
                    await deleteFileGdrive(fileId, env, chatId);
                }
            }
        }
    }
    // =================================================================================

    // 3. Monta e executa a query de DELETE (Agora é seguro apagar do banco)
    const query = `DELETE FROM ${nomeTabela} WHERE ${campoFiltro} = ?`;
    const result = await _data.prepare(query).bind(valorFiltro).run();

    // 4. Feedback de sucesso
    if (result.meta.changes !== 0) {
      // await sendCallBackMessage('Registro removido com sucesso!', chatId, env);
      // Comentei a msg acima pois o templateCatalog01 já envia feedbacks, mas pode descomentar se quiser.
    } else {
      await sendCallBackMessage('Nenhum registro encontrado para excluir.', chatId, env);
    }

    return result.meta.changes;

  } catch (error) {
    await sendCallBackMessage("Erro ao excluir dados:\n" + error.message, chatId, env);
    return 0;
  }
}

// Função assíncrona para verificar a existência de uma tabela ou de dados específicos.
// Recebe o nome da tabela (table), os dados a serem buscados (data, opcional, padrão: objeto vazio), e o ambiente do worker (env).
async function dataExist(table, data = {}, env, chatId) {
  const _data = env.Data;
  // Retorna falso se o nome da tabela for inválido ou não for uma string.
  if (!table || typeof table !== 'string') return false;

  try {
    // Inicia um bloco try-catch para lidar com erros de acesso ao banco de dados.
    
    // Verifica se a tabela existe consultando o esquema do SQLite (`sqlite_master`).
    const tableExists = await env.Data.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`
    ).bind(table).first();

    // Se a tabela não existir, retorna false.
    if (!tableExists) return false;

    // Se não houver dados específicos para buscar (objeto 'data' vazio),
    // apenas a existência da tabela é suficiente, então retorna true.
    if (!data || Object.keys(data).length === 0) return true;

    // -- Se houver dados (data) --
    
    // Obtém as chaves do objeto 'data' (nomes das colunas).
    const keys = Object.keys(data);
    // Cria a cláusula WHERE da consulta, mapeando cada chave para 'key = ?' e unindo com ' AND '.
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    // Obtém os valores correspondentes às chaves para serem usados no binding.
    const values = keys.map(key => data[key]);

    // Monta a query para selecionar 1 (para eficiência) na tabela com a cláusula WHERE.
    const query = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
    // Executa a consulta, passando os valores para o binding.
    const result = await env.Data.prepare(query).bind(...values).first();

    // Retorna true se um resultado for encontrado (o objeto não é null/undefined), ou false se não.
    return !!result; 
  } catch (err) {
    // Em caso de erro na execução da consulta (ex.: problema de permissão), retorna false.
    return false; 
  }
}

/**
 * Recupera dados de uma tabela do Cloudflare D1, com validações e segurança.
 *
 * @param {string} table - Nome da tabela
 * @param {object} data - Filtros (par chave/valor)
 * @param {object} env - Ambiente do Worker (env.Data)
 * @param {number|string|null} chatId - Opcional, apenas para logging
 *
 * @returns {object} {
 *   success: boolean,
 *   data: array|object|null,
 *   error: string|null
 * }
 */
async function dataRead(table, data = {}, env) {
  try {
    // 1 — Validar nome da tabela
    if (!table || typeof table !== "string") {
      console.error(`Nome da tabela (${table}) inválido.`);
      return [];
    }

    // 2 — Verificar se a tabela existe no D1
    const tableCheck = await env.Data
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
      .bind(table)
      .first();

    if (!tableCheck) {
      console.error(`A tabela ${table} não existe.`);
      return [];
    }

    let whereClause = "";
    let values = [];

    // 3 — Intervalo de IDs
    if (
      Array.isArray(data?.interval) &&
      data.interval.length === 2
    ) {
      whereClause = "id BETWEEN ? AND ?";
      values = [
        Number(data.interval[0]),
        Number(data.interval[1])
      ];
    }
    // 4 — Filtros normais (type, id, etc)
    else if (data && typeof data === "object" && Object.keys(data).length) {
      const keys = Object.keys(data);

      whereClause = keys
        .map(key => `${key} = ?`)
        .join(" AND ");

      values = keys.map(key => data[key]);
    }

    // 5 — Montar query (se whereClause vazio → traz tudo)
    const query = `
      SELECT *, COUNT(*) OVER() AS total FROM ${table} ${whereClause ? "WHERE " + whereClause : ""} ORDER BY id ASC`;

    const result = await env.Data
      .prepare(query)
      .bind(...values)
      .all();

    if (!result || !result.results.length) {
      return [];
    }

    // Se tiver apenas um registro, retorna o objeto direto
    if (result.results.length === 1) {
      return result.results[0];
    }

    return result.results;

  } catch (err) {
    console.error("Erro ao consultar D1:", err);
    return [];
  }
}


/**
 * Conta registros de uma tabela do Cloudflare D1, com validações e segurança.
 *
 * @param {string} table - Nome da tabela
 * @param {object} data - Filtros (par chave/valor) ou { interval: [begin, end] }
 * @param {object} env - Ambiente do Worker (env.Data)
 *
 * @returns {number} total de registros
 */
async function dataCount(table, data = {}, env) {
  try {
    // 1 — Validar nome da tabela
    if (!table || typeof table !== "string") {
      console.error(`Nome da tabela (${table}) inválido.`);
      return 0;
    }

    // 2 — Verificar se a tabela existe no D1
    const tableCheck = await env.Data
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
      .bind(table)
      .first();

    if (!tableCheck) {
      console.error(`A tabela ${table} não existe.`);
      return 0;
    }

    let whereClause = "";
    let values = [];

    // 3 — Intervalo de IDs
    if (
      Array.isArray(data?.interval) &&
      data.interval.length === 2
    ) {
      whereClause = "id BETWEEN ? AND ?";
      values = [
        Number(data.interval[0]),
        Number(data.interval[1])
      ];
    }
    // 4 — Filtros normais
    else if (data && typeof data === "object" && Object.keys(data).length) {
      const keys = Object.keys(data);

      whereClause = keys
        .map(key => `${key} = ?`)
        .join(" AND ");

      values = keys.map(key => data[key]);
    }

    // 5 — Montar query
    const query = `
      SELECT COUNT(*) AS total
      FROM ${table}
      ${whereClause ? "WHERE " + whereClause : ""}
    `;

    const result = await env.Data
      .prepare(query)
      .bind(...values)
      .first();

    return result?.total ?? 0;

  } catch (err) {
    console.error("Erro ao contar dados no D1:", err);
    return 0;
  }
}


export{ dataSave, dataRead, dataUpdate, dataDelete, dataExist, dataCount }
import { sendCallBackMessage, sendMessage } from "../utils/message.js";

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
            const tableExists = await _data.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?;`).bind(tabela[0]).all();
              // Se a tabela não existir, cria a tabela
              if (tableExists.results.length === 0) {  // Verifica se a tabela existe
                  return 0;
              }
            const campo = Number.isInteger(Number(content[1])) ? 'id' : 'type';
            const identificadorVal = campo === 'id' ? Number(content[1]) : content[1];

            const data = content[0];
            const colunas = tabela[1].split(',').map(c => c.trim());
            const nomeTabela = tabela[0];

            if (data.length !== colunas.length) {
              throw new Error('Quantidade de colunas e valores não coincide.');
            }

            const setParts = colunas.map(coluna => `${coluna} = ?`).join(', ');
            const query = `
              UPDATE ${nomeTabela}
              SET ${setParts}
              WHERE ${campo} = ?
            `;

            const stmt = _data.prepare(query).bind(...data, identificadorVal);
            const result = await stmt.run();

            if (result.meta.changes !== 0) {
              await sendCallBackMessage('Dados atualizados com sucesso!', chatId, env);
            }

            return result.meta.changes;

          } catch (error) {
            await sendCallBackMessage("Erro ao fazer o update:\n" + error, chatId, env);
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
      
      console.error(`"Nome da tabela (${table}) inválido.`);
      return [];
      };

    // 2 — Verificar se a tabela existe no D1
    const tableCheck = await env.Data
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
      .bind(table)
      .first();

    if (!tableCheck) {
      console.error(`A Tabela ${table} não existe.`);
      return [];
    }

    // 3 — Se não houver filtros, retorna todos os registros
    if (!data || Object.keys(data).length === 0) {
      const result = await env.Data.prepare(`SELECT * FROM ${table}`).all();

      return result.results || [];
    }

    // 4 — Montar cláusula WHERE usando .bind() (seguro)
    const keys = Object.keys(data);
    const whereClause = keys.map(key => `${key} = ?`).join(" AND ");
    const values = keys.map(key => data[key]);

    // 5 — Montar a query final
    const query = `SELECT * FROM ${table} WHERE ${whereClause}`;

    const statement = env.Data.prepare(query).bind(...values);
    const result = await statement.all();

    // Nenhum resultado
    if (!result || result.results.length === 0) {
      console.error(`Dados inexistentes na tabela ${table}.`);
      return [];
    }

    if(result.results.length < 2) return result.results[0];

    // 6 — Retorno com sucesso e dados encontrados
    return result.results;

  } catch (err) {
    return `Erro ao consultar D1: ${err}`;
  }
}

/**
 * Exclui linhas de uma tabela no Cloudflare D1 e retorna os dados excluídos
 * @param {string} table - Nome da tabela
 * @param {object} data - Ex: { id: 10 } ou { email: "teste@email.com" }
 * @param {object} env - env com a instância do D1
 */
async function dataDelete(table, data = {}, env) {
  if (!table) {
    throw new Error("Tabela não informada");
  }
  const _data = env.Data;

  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new Error("É necessário informar ao menos uma condição para exclusão");
  }

  // Monta WHERE: coluna1 = ? AND coluna2 = ?
  const whereClause = keys.map(key => `${key} = ?`).join(" AND ");
  const values = keys.map(key => data[key]);

  // ADIÇÃO: "RETURNING *" faz o SQLite devolver as linhas que acabou de apagar
  const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;

  // MUDANÇA: Usamos .all() em vez de .run() para capturar os dados retornados
  const result = await _data
    .prepare(sql)
    .bind(...values)
    .all();

  return {
    success: true,
    // O número de linhas afetadas vem em result.meta.changes
    changes: result.meta?.changes || 0,
    // Os dados das linhas apagadas vêm em result.results
    rows: result.results || [] 
  };
}


export{ dataSave, dataUpdate, dataExist, dataRead, dataDelete }
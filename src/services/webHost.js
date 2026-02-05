// Localização: /assets/js/bot/src/services/webHost.js

import { downloadGdrive } from "./gDrive.js"; // ❗ CORREÇÃO: Importação necessária

//Função que trata requisição do servidor web.
async function handleJson(request, env) {
  const url = new URL(request.url);
  const type = url.searchParams.get("tipo");
  const id = url.searchParams.get("id");
  const tabela = url.searchParams.get("tbl");
  const authHeader = request.headers.get("Authorization");
  const origin = request.headers.get("Referer") || request.headers.get("Origin");
  const pageToken = request.headers.get('X-Page-Token');

  const tokensPage = env.tokenSite;
  const [ALLOWED_ORIGIN, VALID_PAGE_TOKEN, AUTH_TOKEN] = tokensPage.split(',');

  if (origin !== ALLOWED_ORIGIN) {
    return new Response("Domínio não autorizado: " + origin, { status: 403 });
  }

  if (authHeader !== AUTH_TOKEN) {
    return new Response("Envio não autorizado", { status: 403 });
  }

  if (pageToken !== VALID_PAGE_TOKEN) {
    return new Response("Token de página inválido", { status: 403 });
  }

  try {
    let query = `SELECT data, type FROM ${tabela}`;
    const conditions = [];
    const binds = [];

    if (type) {
      conditions.push("type = ?");
      binds.push(type);
    }

    if (id) {
      conditions.push("id = ?");
      binds.push(parseInt(id));
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id DESC";

    const result = await env.Data.prepare(query).bind(...binds).all();
    const rows = result.results;

    if (rows.length === 0) {
      return new Response("Nenhum dado encontrado com os critérios fornecidos", { status: 404 });
    }

    // 🖼 Se for imagem, retorna arquivo binário real
    if (type === "img" || (rows[0]?.type === "img" && !type)) {
      try {
        const row = rows[0]; // Apenas o primeiro arquivo
        const file = await downloadGdrive(row.data, env); // Agora downloadGdrive está definido

        return new Response(file.buffer, {
          status: 200,
          headers: {
            "Content-Type": file.mimeType,
            "Content-Disposition": `inline; filename="${file.name}"`
          }
        });
      } catch (err) {
        console.error("Erro ao baixar imagem:", err.message);
        return new Response("Erro ao baixar imagem: " + err.message, { status: 500 });
      }
    }

    // 📝 Se não for imagem, retorna lista em texto plano
    const datas = rows.map(r => r.data).join("\[|]");
    return new Response(datas, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (error) {
    return new Response("Erro ao consultar a base de dados: " + error.stack, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

export{ handleJson }
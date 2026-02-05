import { loadSession, saveSession } from "../db/session.js";
import { sendMessage, sendCallBackMessage } from "../utils/message.js"; // funções de envio de mensagens e mídia
import { normalize } from "../utils/formatters.js";
import { dataExist, dataSave, dataUpdate } from "../db/D1.js";
import { comand, commands_manifest } from "./commands.js";

async function handleRequest(request, env) {
    // Aguarda 1 segundo antes de começar.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const url = new URL(request.url) || null;
    let update;

    // 1. Extração da Requisição
    try {
        update = await request.json();
    } catch (e) {
        return new Response("OK", { status: 200 });
    }

    if (!url) { return new Response("URL inexistente", { status: 500 }); }
    if (!update.message) return new Response('OK', { status: 200 });

    try {
        // 2. Extração de Dados Essenciais
        const chatId = Number(update.message.chat.id);
        const userId = Number(update.message.from.id);
        const userName = String(update.message.from.first_name + ' ' + (update.message.from.last_name || ''));

        // 3. Autorização
        const userAuth = await dataExist("users", { chatId: chatId }, env);
        if (!userAuth) {
            await sendMessage('Consulte o proprietário do BOT para poder usa-lo!', chatId, env);
            return new Response('Não autorizado', { status: 403 });
        }

        let messageText;

        // 4. Determinação do Conteúdo (Mídia ou Texto)
        if (update.message.document) { messageText = update.message.document?.file_id; }
        else if (update.message.photo) { messageText = update.message.photo[update.message.photo.length - 1].file_id; }
        else if (update.message.video) { messageText = update.message.video.file_id; }
        else { messageText = String(update.message.text || ''); }

        //await sendCallBackMessage(messageText, chatId, env);

        // 5. Carregamento do Estado e Verificação de Cadastro
        let SESSION = await loadSession(env, userId, false);
        await saveSession(env, userId, SESSION);
        if (normalize(messageText) == normalize('encerrar')) {
            SESSION = await loadSession(env, userId, true);
            await saveSession(env, userId, SESSION);
            await sendMessage('Encerrado!\n /comandos', chatId, env);
            return new Response('Encerrado!', { status: 200 });

        }

        // 7. Processamento de Comandos de Nível Superior (Switch principal)
        switch (normalize(messageText)) {

            case normalize('comandos'):
                try {
                    SESSION = await loadSession(env, userId, true);
                    await saveSession(env, userId, SESSION);
                    const secComands = commands_manifest.map(v => `/${v.name}`);
                    const list = [
                        "/comandos - Lista de comandos do bot.",
                        "/ajuda - Ajuda do bot.",
                        "/encerrar - Encerra precocemente qualquer tarefa do bot.",
                        ...secComands
                    ].join('\n');
                    await sendMessage(list, chatId, env);
                    return new Response('Lista de comandos enviada!', { status: 200 });
                } catch (error) {
                    const message = "Erro ao listar comandos: " + error.stack;
                    await sendCallBackMessage(message, chatId, env);
                    return new Response(message, { status: 500 });
                }


            case normalize('ajuda'):
                await sendMessage("Ajuda\n\nUtilize os seguintes comandos:\n/comandos - Lista de todos os comandos disponíveis\n/encerrar - Encerra o processo atual", chatId, env);
                return new Response('Mensagem de ajuda enviada!', { status: 200 });

            default:// Se não for comando e não tiver estado ativo (caiu do if), envia mensagem de erro.
                try {
                    const result = await comand(messageText, SESSION, userId, chatId, userName, update, env);
                    if (!result) {
                        await sendMessage('Comando não reconhecido. Use /comandos para começar.', chatId, env);
                        return new Response('Nenhum processo iniciado', { status: 200 });
                    }
                } catch (error) {
                    const message = "Erro ao processar comando ou estado do usuário: " + error.stack;
                    await sendCallBackMessage(message, chatId, env);
                }
                return new Response('Processo finalizado!', { status: 200 });

        }


        /* // 8. DELEGAÇÃO DO FLUXO DE ESTADOS (Para estados que não são comandos de nível superior)
         if(session.proces){
             const result = await comand(messageText, session, userId, chatId, userName, update, env);
                 if(!result){
                     await sendMessage('Comando não reconhecido. Use /comandos para começar.', chatId, env); 
                 return new Response('Nenhum processo iniciado');
                 }
                 return new Response("OK", {status:200})
               }*/

    } catch (error) {
        // 9. TRATAMENTO DE ERRO GLOBAL
        console.error("Erro GLOBAL no webhook:", error.stack);
        return new Response(`Erro GLOBAL: ${error.message}`, { status: 500 });
    }
}

async function yesOrNo(content, tabela, userId, chatId, SESSION, messageText, env) {
    let mensagem = '';
    const proces = SESSION.proces;

    switch (messageText.toUpperCase()) {
        case '/SIM':
            try {
                // Tenta fazer um UPDATE se for uma tabela de configuração ('config').
                if (tabela[0] === 'config') {

                    const update = await dataUpdate([[content[0], content[1]], content[1]], tabela, chatId, env);

                    if (update !== 0) {

                        SESSION = await loadSession(env, userId, true);
                        await saveSession(env, userId, SESSION);
                        mensagem = 'Dados atualizados com sucesso!';
                        await sendMessage('Deseja /encerrar ? ou /' + proces + ' ?', chatId, env);
                        break;
                    }
                }
                // Se não for update (ou falhar/não for 'config'), tenta salvar (INSERT).
                await dataSave(content, tabela, env, chatId);
                SESSION = await loadSession(env, userId, true);
                await saveSession(env, userId, SESSION);
                mensagem = 'Salvo com sucesso!';
                await sendMessage('Deseja /encerrar ? ou /' + proces + ' ?', chatId, env);
                break;

            } catch (error) {
                // Em caso de erro, notifica o usuário via callback.
                await sendCallBackMessage('Erro ao salvar dados: ' + error, chatId, env);
                return new Response('Erro ao salvar dados', { status: 500 });
            }

        case '/NAO':
            // Reinicia o fluxo: volta para o estado de seção inicial.
            SESSION = await loadSession(env, userId, true);
            await saveSession(env, userId, SESSION);
            await sendMessage('Deseja /encerrar ? ou /' + proces + ' ?', chatId, env);
            break;

        default:
            await sendMessage("Responda com /SIM ou /NAO para confirmar.", chatId, env);
                        return new Response("Resposta inválida", { status: 200 });
            break;
    }

    // Persiste o estado modificado (limpo ou reiniciado).
    await saveSession(env, userId, SESSION);
    return new Response(mensagem, { status: 200 });
}

export { handleRequest, yesOrNo }
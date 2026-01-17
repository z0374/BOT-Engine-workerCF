import { loadUserState, saveUserState } from "../db/session.js";
import { sendMessage, sendCallBackMessage } from "../utils/message.js"; // funções de envio de mensagens e mídia
import { normalize } from "../utils/formatters.js";
import { dataExist, dataSave, dataUpdate } from "../db/D1.js";
import { comand, commands_manifest } from "./commands.js";

async function handleRequest(request, env) {  
    // Aguarda 1 segundo antes de começar.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const url = new URL(request.url)|| null;
    let update;
    
    // 1. Extração da Requisição
    try {
        update = await request.json();
    } catch (e) {
        return new Response("OK", { status: 200 });
    }

    if (!url) { return new Response("URL inexistente", { status: 500 }); }
    if (!update.message) return new Response('OK', { status: 200 });

    try{
        // 2. Extração de Dados Essenciais
        const chatId = Number(update.message.chat.id);
        const userId = Number(update.message.from.id);
        const userName = String(update.message.from.first_name + ' ' + (update.message.from.last_name || ''));
        
        // 3. Autorização
        const userAuth = await dataExist("users", { chatId: chatId }, env);
        if(!userAuth){
            await sendMessage('Consulte o proprietário do BOT para poder usa-lo!', chatId, env); 
            return new Response('Não autorizado', { status: 403 });
        }

        let messageText;
        
        // 4. Determinação do Conteúdo (Mídia ou Texto)
        if(update.message.document) { messageText = update.message.document?.file_id; } 
        else if (update.message.photo) { messageText = update.message.photo[update.message.photo.length - 1].file_id; } 
        else if (update.message.video) { messageText = update.message.video.file_id; } 
        else { messageText = String(update.message.text || ''); }

//await sendCallBackMessage(messageText, chatId, env);

        // 5. Carregamento do Estado e Verificação de Cadastro
        let userState = await loadUserState(env, userId);

        // 6. Inicialização/Normalização do Estado
        if (!userState) {
            userState = {
              proces: '',
              pin:'naoDefinido',
              state: String('').toLowerCase(),
              titulo: String(''),
              texto: String(''),
              select: [],
              procesCont:0 };
        }

        if(normalize(messageText) == normalize('encerrar')){
                userState = null;
                await saveUserState(env, userId, userState);
                await sendMessage('Encerrado!\n /comandos', chatId, env);
                return new Response('Encerrado!',{ status: 200 });

        }
        // 8. DELEGAÇÃO DO FLUXO DE ESTADOS (Para estados que não são comandos de nível superior)
        if(userState.proces){
            const result = await comand(messageText, userState, userId, chatId, userName, update, env);
                if(!result){
                    await sendMessage('Comando não reconhecido. Use /comandos para começar.', chatId, env); 
                return new Response('Nenhum processo iniciado');
                }
                return new Response("OK", {status:200})
              }
        
             
        

        // 7. Processamento de Comandos de Nível Superior (Switch principal)

        switch(normalize(messageText)){

            case normalize('comandos'):
                userState = null;
                await saveUserState(env, userId, userState);
                const secComands = commands_manifest.map(v => `/${v.name}`);
                const list = [
                "/comandos - Lista de comandos do bot.",
                "/ajuda - Ajuda do bot.",
                "/encerrar - Encerra precocemente qualquer tarefa do bot.",
                ...secComands
                ].join('\n');
                await sendMessage(list, chatId, env);
                return new Response('Lista de comandos enviada!',{status:200});

            case normalize('ajuda'):
                return await sendMessage("Ajuda", chatId, env);;
                break;

            default:// Se não for comando e não tiver estado ativo (caiu do if), envia mensagem de erro.
                const result = await comand(messageText, userState, userId, chatId, userName, update, env);
                if(!result){
                    await sendMessage('Comando não reconhecido. Use /comandos para começar.', chatId, env); 
                return new Response('Nenhum processo iniciado',{status:200});
                }
                return new Response("OK", {status:200})
              }

    } catch (error) {
        // 9. TRATAMENTO DE ERRO GLOBAL
            await sendCallBackMessage(`Erro na requisição WEBHOOK: (webhook.js) ${error.stack}`, chat, env);
        
        return new Response(`Erro: ${error.message}`, {status:200});
    }
}

async function yesOrNo(content, tabela, userId, chatId, userState, messageText, env) { 
    let mensagem = '';

    switch (messageText.toUpperCase()) {
        case '/SIM':
            try {
                const proces = userState.proces;
                // Tenta fazer um UPDATE se for uma tabela de configuração ('config').
                if (tabela[0] === 'config') {
                    
                    const update = await dataUpdate(content, tabela, chatId, env); 
        
                    if (update !== 0) {
                        
                        userState = null;
                        mensagem = 'Dados atualizados com sucesso!';
                        await sendMessage('Deseja /encerrar ? ou /' + proces + ' ?', chatId, env);
                        break;
                    }
                }
                // Se não for update (ou falhar/não for 'config'), tenta salvar (INSERT).
                await dataSave(content, tabela, env, chatId);
                userState = null;
                
                mensagem = 'Salvo com sucesso!';
                await sendMessage('Deseja /encerrar ? ou /' + proces + ' ?', chatId, env);
                break;
        
            } catch (error) {
                // Em caso de erro, notifica o usuário via callback.
                await sendCallBackMessage('Erro ao salvar dados: ' + error, chatId, env);
                return new Response('Erro ao salvar', { status: 500 });
            }
        
        case '/NAO':
            // Reinicia o fluxo: volta para o estado de seção inicial.
            const stateParts = userState.state.split('_');
            // Reconstroi o estado da seção (ex: waiting_confirm_configuracao -> waiting_section_configuracao).
            userState.state = 'waiting_section_' + stateParts[stateParts.length - 1];
            await saveUserState(env, userId, userState);
            userState.select = [];
            await sendMessage('Deseja /encerrar ? ou /reiniciar ?', chatId, env);
            break;
        
        default:
            mensagem = 'Comando não reconhecido.';
            break;
    }
    
    // Persiste o estado modificado (limpo ou reiniciado).
    await saveUserState(env, userId, userState);
    return new Response(mensagem, { status: 200 });
}

export{ handleRequest, yesOrNo }
import { loadSession, saveSession } from "../db/session.js";
import { sendCallBackMessage, deleteMessage } from "../utils/message.js";
import { generatePUK, hashPassword, verifyPassword } from "../utils/cryptography.js";
import { dataSave } from "../db/D1.js"; // Assumindo que esta função está disponível

// ❗ CONSTANTE DE SEGURANÇA: Número recomendado de iterações para PBKDF2.
const PBKDF2_ITERATIONS = 100000; 


//Função que abre as configurações de usuário do bot.
async function handleUser(request, env) {
  // Aguarda 3 segundos antes de processar (simulando delay, por exemplo)
  await new Promise(resolve => setTimeout(resolve, 3000)); 

  const url = new URL(request.url); // Captura a URL da requisição

  if (!url) { 
    return new Response("URL inexistente", { status: 500 }); 
  }

  try {
      
    const update = await request.json();

    const chatId = Number(update.message.chat.id); // ID do chat (número)
    const userId = Number(update.message.from.id); // ID do usuário (número)
    const userName = String(update.message.from.first_name + ' ' + (update.message.from.last_name || '')); // Nome completo do usuário
    let messageText = String(update.message.text || ''); // Texto da mensagem recebida

    let SESSION = await loadSession(env, userId, false); // Carrega o estado atual do usuário
if(!SESSION){
  await sendCallBackMessage(`Erro ao gerar userSESSION.`, chatId, env);
  return new Response('Erro ao gerar userSESSION',{status:200});
}
    // Define processo padrão se ainda não estiver definido
    if (SESSION.proces === '') {
      SESSION.proces = 'register_masterUser';
      SESSION.state = 'register_credentials_master_user';
    }

    // Processo de registro do usuário master
    if (SESSION.proces == 'register_masterUser') {
      
      switch (SESSION.state.toUpperCase()) {

        case 'REGISTER_CREDENTIALS_MASTER_USER':
          SESSION.procesCont = 0;
          SESSION.state = 'REGISTER_PIN_USER';
          await saveSession(env, userId, SESSION);
          await sendCallBackMessage(`Prazer em conhecê-lo Sr. ${userName},\nPor gentileza, informe um PIN de pelo menos 6 dígitos:`, chatId, env);
          return new Response('OK',{status:200});
          break;

        case 'REGISTER_PIN_USER':
          if (messageText.length < 6) {
            await sendCallBackMessage(`Sr. ${userName},\nO PIN precisa ter ao menos 6 dígitos. Você informou apenas ${messageText.length}.`, chatId, env);
            return new Response('OK',{status:200});
            break;
          }
          SESSION.procesCont = 0;
          // Hashing seguro com PBKDF2 (armazena salt$hash em SESSION.texto)
          SESSION.texto = await hashPassword(messageText, PBKDF2_ITERATIONS); 
          SESSION.state = 'register_confirm_user';
          await saveSession(env, userId, SESSION);
          await sendCallBackMessage(`Certo Sr. ${userName},\nAgora digite novamente o PIN para confirmar:`, chatId, env);
          return new Response('OK',{status:200});
              break;

        case 'REGISTER_CONFIRM_USER':
          // ❗ CORREÇÃO: Garante 3 falhas totais antes de resetar.
          if (SESSION.procesCont >= 3) {
            SESSION = await loadSession(env, userId, true);
            await saveSession(env, userId, SESSION);
            await sendCallBackMessage(`O Sr. errou a confirmação 3 vezes. Reiniciaremos o processo! /OK`, chatId, env);
            return new Response('OK',{status:200});
            break;
          } 
          
          // Verificação segura com verifyPassword (usa o salt$hash armazenado)
          const isValidPin = await verifyPassword(messageText, SESSION.texto, PBKDF2_ITERATIONS);

          if (!isValidPin) {
              SESSION.procesCont++;
              await saveSession(env, userId, SESSION);
              await sendCallBackMessage(`Sr. ${userName},\nOs PINs não correspondem. Tente novamente.`, chatId, env);
              return new Response('OK',{status:200});
              break;
            }

          // Confirmação correta
          SESSION.procesCont = 0;
          SESSION.titulo = chatId;
          
          // Hashing final do userData (userId + chatId + PIN) para o DB
          const secureUserData = String(userId) + String(chatId) + messageText;
          SESSION.texto = await hashPassword(secureUserData, PBKDF2_ITERATIONS); 


          // PUK function remains the same
          const puk = generatePUK(); 
          const delPUK = (await sendCallBackMessage(`⚠️ ATENÇÃO: Seu PUK é -| ${puk} |-.\nNÃO PERCA nem COMPARTILHE este código. Ele será necessário para redefinir ou desbloquear seu PIN.\nESTA MENSAGEM SERÁ APAGADA EM 15 segundos!`, chatId, env)).result.message_id;

            try {
              // dataSave call: [userData (hash), chatId, tipo], [tabela, colunas], env, chatId
              const result = await dataSave([SESSION.texto, SESSION.titulo, 'MASTER'], ['users', 'userData, chatId, tipo'], env, chatId);
              
              // ❗ CORREÇÃO: Verifica se o resultado é truthy (o ID inserido, ex: "1"), tornando o teste mais robusto.
              if(result){ 
                  // Restaura a mensagem de sucesso completa.
                  await sendCallBackMessage(`Parabéns Sr. ${userName},\nUsuário **MASTER** criado com sucesso!\n/comandos - /encerrar`, chatId, env);
              } else {
                  // Se dataSave falhar, ele deve retornar 0 ou lançar um erro, mas adicionamos essa checagem de fallback.
                  throw new Error("A inserção no D1 falhou silenciosamente.");
              }
            } catch (error) {
              // ❗ CORREÇÃO: Notifica o usuário com o erro específico do banco de dados para debugging.
              const errorDetails = error.message || error;
              console.error("D1 SAVE ERROR:", errorDetails);
              await sendCallBackMessage(`ERRO CRÍTICO no banco de dados. Falha ao salvar usuário Master: ${errorDetails}`, chatId, env);
            }
              
          SESSION = await loadSession(env, userId, true);
          await saveSession(env, userId, SESSION); // Limpa estado do usuário

          

          await new Promise(resolve => setTimeout(resolve, 15000)); // Aguarda 15s
          await deleteMessage(delPUK, chatId, env); // Apaga a mensagem com o PUK
          return new Response('OK',{status:200});
          break;

      }

    }

      return new Response('OK!',{status:200});

  } catch (error) {

      const mensagem = `Erro: ${error.message}`;

      return new Response(mensagem, {status:200});

  }

}

async function recUser(update, env) {
    const data = env.Data;
    
    const userId = Number(update.message.from.id); // Inferencia userId
    const chatId = Number(update.message.chat.id); // Captura chatId para callback
    const userName = String(update.message.from.first_name + ' ' + (update.message.from.last_name || ''));

    try {
      // Consulta SQL para buscar dados do usuário com base no ID
      // Usa a tabela 'users' (Master/Auth) e busca pelo ID do usuário.
      const result = await data.prepare('SELECT * FROM users WHERE id = ?').bind(userId).all() || null; 
  
      // Se o resultado não retornar nada, inicia o fluxo de cadastro.
      if (result.results.length === 0) {
        // Define o estado inicial para o cadastro.
        await saveSession(env, userId, {proces: 'register_masterUser', state: 'REGISTER_CREDENTIALS_MASTER_USER'}) 
        await sendCallBackMessage(`Olá sr.${userName} Vamos cadastra-lo no nosso banco de usuários!\nInforme seu nome completo.:`, chatId, env);
        return null; // Retorna null para sinalizar que o cadastro foi iniciado.
      }
  
      // Retorna os dados do usuário encontrado
      return result.results[0]; 

    } catch (error) {
      console.error('Erro ao recuperar dados do usuário:', error.message);
      await sendCallBackMessage(`Erro ao recuperar dados do usuário: ${error.message}`, chatId, env);
      return { error: error.message }; 
    }
  }

  export{ handleUser, recUser }
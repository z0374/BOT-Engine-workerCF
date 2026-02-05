/**
 * Converte quebras de linha (line breaks) de texto simples 
 * para a entidade HTML de quebra de linha (&#10;).
 * Útil para preservar a formatação em mensagens HTML do Telegram ou armazenamento.
 * @param {string} texto O texto de entrada com quebras de linha.
 * @returns {Promise<string>} Texto com quebras de linha substituídas por '&#10;'.
 */
function brMap(texto) {
  return texto.replace(/\r?\n/g, '&#10;');
}

/**
 * Formata um valor numérico (ou string que representa um número) para o padrão monetário brasileiro (BRL).
 * @param {(string|number)} valor O valor a ser formatado.
 * @returns {string} O valor formatado como "R$ X.XXX,XX".
 */
function BRL(valor) {
  if (!valor) return 'R$ 0,00';

  // Substitui vírgula por ponto para conversão numérica (se o input for string)
  let numero = Number(valor.replace(',', '.'));

  // Se não for um número válido, retorna R$ 0,00
  if (isNaN(numero)) return 'R$ 0,00';

  // Formata como moeda BRL com duas casas decimais
  const valorFormatado = numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return valorFormatado;
}


/**
 * Normaliza uma string para torná-la adequada para uso como ID, chave ou nome de arquivo.
 * Converte para minúsculas, remove acentos, substitui espaços por underscores e remove barras.
 * @param {string} str A string de entrada.
 * @returns {Promise<string>} A string normalizada.
 */
function normalize(str) {
  if (typeof str !== "string") return "";

  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "_")           // Substitui espaços por "_"
    .replace(/\//g, "");            // Remove barras
}


function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Insere caracteres invisíveis (\u200B) para impedir que o Telegram
 * transforme textos em links, e-mails ou domínios clicáveis.
 * * @param {string} text - O texto original.
 * @returns {string} - O texto "quebrado" visualmente.
 */
function disableHyperlinks(text) {
    if (!text || typeof text !== 'string') return text || "";

    return text
        // 1. Quebra HTTP/HTTPS: Insere invisível após o primeiro 'h'
        // Ex: https:// -> h[zero]ttps://
        .replace(/(h)(ttps?:\/\/)/gi, '$1\u200B$2')

        // 2. Quebra E-mails: Insere invisível após o '@'
        // Ex: contato@email.com -> contato@[zero]email.com
        .replace(/(@)/g, '$1\u200B')

        // 3. Quebra Domínios (site.com): Insere invisível ANTES do ponto
        // Regex: Pega uma letra/número, seguido de ponto, seguido de 2+ letras (ex: .com, .br)
        // Ex: google.com -> google[zero].com
        .replace(/([a-z0-9])\.([a-z]{2,})/gi, '$1\u200B.$2');
}

export{brMap, BRL, normalize, escapeHTML, disableHyperlinks}
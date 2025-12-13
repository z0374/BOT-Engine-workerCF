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
  console.log(str);
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos (diacríticos)
    .replace(/\s+/g, "_") // Substitui espaços por "_"
    .replace(/\//g, ""); // Remove barras
}

export{brMap, BRL, normalize}
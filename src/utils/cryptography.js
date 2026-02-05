// -------------------------------------------------------------------------
// Funções Auxiliares de Codificação (para PBKDF2)
// -------------------------------------------------------------------------

// Converte ArrayBuffer para string hexadecimal (Hex)
function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Converte string hexadecimal (Hex) para ArrayBuffer
function hexToArrayBuffer(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return new Uint8Array(bytes).buffer;
}

/**
 * Núcleo da PBKDF2: Deriva a chave (hash) usando PBKDF2.
 * @param {string} password A senha em texto puro.
 * @param {ArrayBuffer} saltBuffer O salt (16 bytes).
 * @param {number} iterations O número de iterações do PBKDF2.
 * @returns {Promise<ArrayBuffer>} O hash derivado.
 */
async function deriveKey(password, saltBuffer, iterations) {
    const encoder = new TextEncoder();
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw', 
        encoder.encode(password), 
        { name: 'PBKDF2' }, 
        false, 
        ['deriveBits']
    );

    const keyHashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        256 // 256 bits de saída para SHA-256
    );
    return keyHashBuffer;
}

// -------------------------------------------------------------------------
// 1. Função para Geração de PUK (Mantida)
// -------------------------------------------------------------------------

function generatePUK() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$&*';
  const shuffled = chars.split('').sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6).join('');
}


// -------------------------------------------------------------------------
// 2. Função para Hashing Seguro (PBKDF2)
// -------------------------------------------------------------------------

/**
 * Gera um hash seguro da senha usando PBKDF2 com SHA-256 e um salt aleatório.
 * O salt e o hash são retornados em formato hexadecimal e combinados como salt$hash.
 * @param {string} password A senha em texto puro.
 * @param {number} iterations O número de iterações do PBKDF2 (deve ser alto, ex: 100000).
 * @returns {Promise<string>} O salt e o hash combinados em formato hexadecimal (salt$hash).
 */
async function hashPassword(password, iterations) {
    if (!iterations || iterations < 10000) {
        // Exige um mínimo seguro de 10000 iterações.
        throw new Error("O número de iterações deve ser especificado e maior que 10000 para segurança.");
    }
    
    // Geração de Salt aleatório (16 bytes = 128 bits)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derivação da chave (Hashing)
    const keyHashBuffer = await deriveKey(password, salt.buffer, iterations);

    // Codificação e Combinação
    const saltHex = arrayBufferToHex(salt.buffer);
    const hashHex = arrayBufferToHex(keyHashBuffer);

    // Formato de armazenamento seguro: salt$hash
    return `${saltHex}$${hashHex}`;
}

// -------------------------------------------------------------------------
// 3. Função para Verificação Segura (PBKDF2)
// -------------------------------------------------------------------------

/**
 * Verifica se uma senha corresponde a um hash armazenado.
 * @param {string} password A senha em texto puro fornecida pelo usuário.
 * @param {string} storedHashAndSalt O hash e salt armazenados no formato salt$hash.
 * @param {number} iterations O número de iterações original usado no hashing.
 * @returns {Promise<boolean>} True se a senha for válida, False caso contrário.
 */
async function verifyPassword(password, storedHashAndSalt, iterations) {
    const parts = storedHashAndSalt.split('$');
    if (parts.length !== 2) {
        return false;
    }
    const [saltHex, storedHashHex] = parts;

    // Re-derivação da chave (Hashing) usando o salt armazenado
    const derivedHashBuffer = await deriveKey(password, hexToArrayBuffer(saltHex), iterations);
    
    // 2. Comparação segura (Timing-Attack Resistant)
    
    const a = new Uint8Array(derivedHashBuffer);
    const b = new Uint8Array(hexToArrayBuffer(storedHashHex));

    // Compara ArrayBuffers/Uint8Arrays de forma segura (resistente a timing attacks)
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    
    let diff = 0;
    for (let i = 0; i < a.byteLength; i++) {
        // XOR para acumular diferenças
        diff |= a[i] ^ b[i]; 
    }
    
    // Retorna true se não houver diferenças (diff === 0)
    return diff === 0;
}

// -------------------------------------------------------------------------

export { generatePUK, hashPassword, verifyPassword };
# MIMETYPES.md: Regras de Mídia e Requisitos de Formato

O bot atualmente é estritamente focado em **Imagens**. Outros formatos de mídia ainda não possuem suporte completo na camada de entrega (`webHost`).

### 🚫 Formatos Não Suportados (Ainda não implementados)

O sistema rejeitará ou não processará corretamente:
* **Vídeos** (MP4, AVI, MOV, etc.) - *Upload permitido, mas sem suporte de exibição no site.*
* **Documentos** (PDF, DOC, DOCX, TXT) - *Bloqueados no upload.*
* **Áudios** (MP3, OGG, WAV).

---

### ✅ Formatos Aceitos

O módulo `/config/mimeType.js` e o validador em `src/utils/arquives.js` garantem suporte oficial apenas para:

| Formato | MIME Type | Notas |
| :--- | :--- | :--- |
| **PNG** | `image/png` | Recomendado para imagens com fundo transparente. |
| **JPEG/JPG** | `image/jpeg`, `image/jpg` | Padrão para fotos de produtos. |
| **WebP** | `image/webp` | Formato moderno, mais leve e rápido. |
| **GIF** | `image/gif` | Aceito para pequenas animações. |
| **SVG** | `image/svg+xml` | Vetorial (Ideal para logomarcas). |

### ⚠️ Restrições de Upload

* **Tamanho Máximo:** 3MB por arquivo.
* **Validação:** O bot verifica o `MIME Type` real do arquivo antes de enviar para o Google Drive.

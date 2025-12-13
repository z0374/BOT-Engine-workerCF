# MIMETYPES.md: Regras de Mídia e Requisitos de Formato

O bot impõe limites de tamanho e validação de tipo de arquivo durante o upload (`arquives.js`).

### Restrições de Tamanho

* **Imagens:** Tamanho máximo de **3MB**. Arquivos maiores serão rejeitados.

### Formatos de Mídia Aceitos

O módulo `/config/mimeType.js` define os formatos aceitos:

| Formato | MIME Type | Notas |
| :--- | :--- | :--- |
| PNG | `image/png` | Padrão aceito. |
| JPEG/JPG | `image/jpeg`, `image/jpg` | Padrão aceito. |
| WebP | `image/webp` | Formato moderno de imagem aceito. |
| GIF | `image/gif` | Aceito. |
| Vídeo | `video/*` | Aceito (sujeito aos limites de API e validação de `mimeType`). |

---

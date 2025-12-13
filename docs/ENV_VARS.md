
## 📄 ENV\_VARS.md

```markdown
# ENV_VARS.md: Detalhamento das Variáveis de Ambiente

Estas variáveis são mandatórias e devem ser configuradas no `wrangler.toml` para o Worker.

### A. Variáveis de Autorização e Comunicação

| Variável | Formato | Notas |
| :--- | :--- | :--- |
| `bot_Token` | `TOKEN,CHAT_ID` | **TOKEN:** Token principal do bot. **CHAT_ID:** ID do chat Master/Admin (para autorização e logs de segurança). |
| `tokens_G` | `CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, DRIVE_FOLDER_ID` | Credenciais da API do Google Drive (GED). O `DRIVE_FOLDER_ID` aponta para a pasta de destino dos uploads. |
| `tokenSite` | `ALLOWED_ORIGIN, VALID_PAGE_TOKEN, AUTH_TOKEN` | Chaves de autorização para o Frontend: **ALLOWED\_ORIGIN** (URL base do site que pode solicitar dataExist). |

### B. Parâmetros de Segurança

| Parâmetro | Valor Configurado | Nível de Segurança |
| :--- | :--- | :--- |
| **Iterações PBKDF2** | **900** | **⚠️ ALERTA DE SEGURANÇA:** O valor de 900 iterações é **muito baixo** e compromete a segurança contra ataques modernos de força bruta. É altamente recomendado aumentar para um valor de 100.000 ou superior. |
| **PUK** | N/A (Gerado no runtime) | Usado exclusivamente para a redefinição de PIN. |

---
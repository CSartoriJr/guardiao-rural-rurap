
# Guardião Rural - Comandos Essenciais

## Aplicar Configuração de CORS

Para corrigir o erro de upload de imagens (CORS), execute o seguinte comando no seu terminal. Ele aplica as regras corretas ao seu bucket do Firebase Storage.

```bash
gsutil cors set cors.json gs://agriassist-k8tg6.appspot.com
```

---
Este projeto foi gerado pelo Firebase Studio.

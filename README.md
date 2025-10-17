
# Guardião Rural - Comandos Essenciais

## **AÇÃO NECESSÁRIA:** Aplicar Configuração de CORS

Para corrigir o erro de upload e visualização de imagens (`net::ERR_BLOCKED_BY_ORB`), você **precisa** executar o seguinte comando no seu terminal. 

Este comando aplica as regras definidas no arquivo `cors.json` ao seu bucket do Firebase Storage, autorizando o seu aplicativo a interagir com ele. **Esta ação é necessária apenas uma vez.**

```bash
gsutil cors set cors.json gs://agriassist-k8tg6.firebasestorage.app
```

---
Este projeto foi gerado pelo Firebase Studio.

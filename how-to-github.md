# Como Fazer Backup do Guardião Rural no Seu Repositório GitHub

Siga estes passos no terminal do Firebase Studio para enviar seu código para o repositório: `https://github.com/CSartoriJr/guardiao-rural-rurap`

---

## Passo 1: Inicialize o Repositório Local
Se você ainda não iniciou o Git nesta pasta, execute:
```bash
git init
```

## Passo 2: Adicione os Arquivos
Adicione todos os arquivos. O arquivo `.gitignore` que criamos garantirá que apenas o código necessário seja enviado.
```bash
git add .
```

## Passo 3: Salve a Versão (Commit)
Crie um ponto de salvamento com uma mensagem descritiva:
```bash
git commit -m "Backup do Guardião Rural - Versão Atual"
```

## Passo 4: Conecte ao Seu Repositório Específico
Como o repositório já existe, execute o comando abaixo para conectá-lo. 
*Nota: Se o terminal disser que 'origin' já existe, use o segundo comando.*

```bash
git remote add origin https://github.com/CSartoriJr/guardiao-rural-rurap.git
```
*Se der erro de "already exists":*
```bash
git remote set-url origin https://github.com/CSartoriJr/guardiao-rural-rurap.git
```

## Passo 5: Envie o Código
Agora, envie o código para a branch principal (geralmente chamada de `main` ou `master`):
```bash
git push -u origin main
```
*(Se sua branch se chamar master, use `git push -u origin master`)*

---

## Dicas de Segurança
- **Arquivo .env**: Suas chaves de API e segredos estão no arquivo `.env`. Graças ao `.gitignore`, eles **não** serão enviados ao GitHub, mantendo seu projeto seguro.
- **Sincronização**: Sempre que fizer mudanças importantes e quiser atualizar o backup, basta rodar:
  1. `git add .`
  2. `git commit -m "Descrição da mudança"`
  3. `git push`

# Como Fazer Backup do Seu Projeto no GitHub

Este guia fornece os passos para enviar seu projeto do Firebase Studio para um repositório no GitHub.

## Pré-requisitos

1.  **Conta no GitHub:** Você precisa ter uma conta no [GitHub](https://github.com).
2.  **Git instalado:** O Git precisa estar instalado no ambiente onde você está rodando o projeto. No Firebase Studio, o Git já vem instalado.

---

## Passo 1: Inicialize o Repositório Git

Se o seu projeto ainda não é um repositório Git, abra um terminal na pasta raiz do seu projeto e execute o comando:

```bash
git init
```

Isso criará uma pasta oculta `.git` que rastreará as mudanças no seu código.

---

## Passo 2: Adicione os Arquivos

Adicione todos os arquivos do seu projeto à área de "staging" do Git. Esta área prepara os arquivos para serem salvos em um "commit".

```bash
git add .
```

O `.` significa "todos os arquivos e pastas a partir do diretório atual".

---

## Passo 3: Faça o Primeiro Commit

Um "commit" é como um ponto de salvamento na história do seu projeto. Salve os arquivos que você adicionou com uma mensagem descritiva.

```bash
git commit -m "Commit inicial do projeto"
```

---

## Passo 4: Crie um Novo Repositório no GitHub

1.  Vá para o [GitHub](https://github.com) e faça login.
2.  Clique no ícone de `+` no canto superior direito e selecione **"New repository"**.
3.  Dê um nome ao seu repositório (ex: `meu-app-guardiao-rural`).
4.  Você pode adicionar uma descrição (opcional).
5.  Escolha se o repositório será **Público** (qualquer pessoa pode ver) ou **Privado** (só você e quem você permitir podem ver). Para um backup de projeto, **Privado** é geralmente a melhor escolha.
6.  **Não** marque as opções "Add a README file", "Add .gitignore", ou "Choose a license", pois seu projeto já possui esses arquivos.
7.  Clique em **"Create repository"**.

---

## Passo 5: Conecte seu Projeto Local ao GitHub

O GitHub mostrará uma página com alguns comandos. Você precisará do URL do seu novo repositório, que se parece com `https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git`.

No seu terminal, execute o comando abaixo para conectar seu projeto local ao repositório remoto que você acabou de criar. Substitua o URL pelo URL do seu repositório.

```bash
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
```

Isso diz ao Git que existe um destino remoto chamado `origin` no URL fornecido.

---

## Passo 6: Verifique o Nome da Branch Principal

Por padrão, o Git pode criar a branch principal com o nome `master` ou `main`. Verifique o nome da sua com o comando:
```bash
git branch
```
A branch atual estará marcada com um asterisco (`*`).

---

## Passo 7: Envie seu Código para o GitHub

Finalmente, envie ("push") seu commit para o repositório no GitHub. Se sua branch for `main`, use:

```bash
git push -u origin main
```

Se sua branch for `master`, use:

```bash
git push -u origin master
```

O Git pode pedir seu nome de usuário e senha (ou um token de acesso pessoal) do GitHub para autenticar.

---

## Solução de Problemas

### Erro: `remote origin already exists`

Se você receber esta mensagem de erro ao executar o comando `git remote add origin ...`, significa que seu projeto já tem um "remoto" configurado com o nome `origin`.

Para corrigir, em vez de adicionar um novo, você pode simplesmente **atualizar o endereço (URL)** do remoto existente com o seguinte comando:

```bash
git remote set-url origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
```

Depois de executar este comando, continue para o **Passo 7** para enviar seu código.

---

Pronto! Atualize a página do seu repositório no GitHub e você verá todos os seus arquivos lá. A partir de agora, para salvar novas alterações, você só precisará executar:

```bash
git add .
git commit -m "Sua mensagem de alteração"
git push
```

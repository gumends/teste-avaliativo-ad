# Teste Avaliativo

### Instruções

Para iniciar o projeto, siga as etapas abaixo:

### 1. Instalação do Node.js

Execute o comando abaixo para instalar as dependências do projeto:

```bash
npm install
```

### 2. Configuração do Ambiente
Crie um arquivo .env a partir do modelo fornecido:

```bash
cp example.env .env
```
Após criar o arquivo .env basta inserir as respectivas informações solicitadas através do example.env

### 3. Execução do Arquivo
Escolha uma das opções a seguir para gerar a saída desejada:

Para gerar um arquivo XLSX:
```bash
node "Nome Do Arquivo"
```

Para gerar um arquivo JSON:
```bash
node "Nome Do Arquivo" -d
```

Para listar informações apenas no console:
```bash
node "Nome Do Arquivo" -l
```

## Sugestão
Se desejar abrir o arquivo XLSX diretamente no Visual Studio Code, você pode usar a extensão Excel Viewer.

Para instalar, clique no link abaixo ou pesquise diretamente no VSCode:

https://marketplace.visualstudio.com/items?itemName=GrapeCity.gc-excelviewer


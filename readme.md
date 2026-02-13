Com certeza! Abaixo apresento uma documentação técnica completa, estruturada e profissional para o **Orius Tools API**.

Você pode copiar este conteúdo diretamente para o seu arquivo `README.md`. Ele cobre desde a arquitetura até os detalhes dos contratos de interface (endpoints), ideal para a equipe de desenvolvimento e para manutenção futura.

---

# 🛠️ Orius Tools API

> **Versão:** 1.0.0
> **Equipe:** Suporte Técnico Orius
> **Status:** Em Produção

A **Orius Tools API** é um microserviço de *backoffice* desenvolvido para auxiliar na conversão, extração de dados e validação de documentos cartorários. A ferramenta atua como um hub central de processamento para arquivos oriundos do **SEE (Sistema Extrajudicial Eletrônico)**, tabelas oficiais de emolumentos e declarações fiscais (DOI).

---

## 📑 Índice

1. [Requisitos do Sistema](https://www.google.com/search?q=%23-requisitos-do-sistema)
* [Funcionais](https://www.google.com/search?q=%23-requisitos-funcionais)
* [Não Funcionais](https://www.google.com/search?q=%23-requisitos-n%C3%A3o-funcionais)


2. [Stack Tecnológico](https://www.google.com/search?q=%23-stack-tecnol%C3%B3gico)
3. [Instalação e Configuração](https://www.google.com/search?q=%23-instala%C3%A7%C3%A3o-e-configura%C3%A7%C3%A3o)
* [Dependências de Sistema (Poppler)](https://www.google.com/search?q=%23-depend%C3%AAncia-cr%C3%ADtica-poppler)
* [Rodando Localmente](https://www.google.com/search?q=%23-rodando-localmente)
* [Rodando com Docker](https://www.google.com/search?q=%23-rodando-com-docker)


4. [Documentação da API (Endpoints)](https://www.google.com/search?q=%23-documenta%C3%A7%C3%A3o-da-api-endpoints)
5. [Estrutura do Projeto](https://www.google.com/search?q=%23-estrutura-do-projeto)

---

## 📋 Requisitos do Sistema

### ✅ Requisitos Funcionais

O sistema deve ser capaz de:

1. **Converter Receitas do SEE (PDF Imagem):** Receber arquivos digitalizados, aplicar OCR e extrair códigos de atos e valores monetários.
2. **Processar Guias de Sistema (PDF Texto):** Ler arquivos vetoriais, identificar tabelas de atos e extrair totais financeiros do rodapé.
3. **Converter Tabela de Emolumentos (Excel):** Transformar a planilha oficial (.xlsx) em JSON, aplicando regras de negócio para atos de Protesto e faixas de valores.
4. **Processar Guias de Arrecadação (CSV):** Ler arquivos CSV exportados, identificar decêndios (datas), somar totais e extrair colunas ocultas de fundos (Funemp/Funcomp).
5. **Validar e Corrigir DOI (JSON):** Receber arquivos JSON da DOI, corrigir tipagem de dados (casting), validar estrutura (Schema 2020-12) e aplicar regras de negócio brasileiras (CPF, CNPJ, CIB, participações).

### 🛡️ Requisitos Não Funcionais

1. **Interoperabilidade:** A API deve rodar tanto em ambiente Windows (Desenvolvimento) quanto Linux (Produção/Docker).
2. **Performance:** O processamento de arquivos grandes (OCR ou Excel) deve ser assíncrono e gerenciar limpeza de arquivos temporários para não lotar o disco.
3. **Documentação:** Deve fornecer interface interativa (Swagger) para testes.
4. **Robustez:** Deve tratar erros de *encoding* (UTF-8/Latin1) e *BOM* (Byte Order Mark) automaticamente.

---

## 💻 Stack Tecnológico

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Uploads:** Multer
* **Manipulação de PDF:** Poppler Utils (`pdftoppm`, `pdftotext`)
* **OCR:** Tesseract.js
* **Planilhas (Excel/CSV):** SheetJS (xlsx)
* **Validação JSON:** AJV (Another JSON Schema Validator) + AJV Formats
* **Containerização:** Docker

---

## 🚀 Instalação e Configuração

### ⚠️ Dependência Crítica: Poppler

Para manipular PDFs, o sistema operacional precisa das bibliotecas do **Poppler**.

* **Linux (Produção/Docker):**
```bash
sudo apt-get update && sudo apt-get install -y poppler-utils

```


* **Windows (Local):**
1. Baixe o binário do Poppler (ex: Release-24.02.0-0).
2. Extraia em `C:\poppler`.
3. Adicione `C:\poppler\Library\bin` às Variáveis de Ambiente (PATH).



### 🏃 Rodando Localmente

1. Clone o repositório e instale as dependências:
```bash
git clone https://seu-repo/orius-tools.git
cd orius-tools
npm install

```


2. Certifique-se de que os arquivos de referência (`schema.json`, `codigo-descricao...json`) estão na raiz.
3. Inicie o servidor:
```bash
npm start

```


*Acesse: `http://localhost:3000*`

### 🐳 Rodando com Docker

O projeto possui um `Dockerfile` otimizado que já instala o Node.js e o Poppler.

```bash
# Construir Imagem
docker build -t orius-tools .

# Rodar Container
docker run -p 3000:3000 orius-tools

```

---

## 🔌 Documentação da API (Endpoints)

Documentação interativa disponível em: **`http://localhost:3000/api-docs`**

### 1. Converter Receita SEE (OCR)

Processa arquivos escaneados (imagem) para extração de dados.

* **Endpoint:** `POST /api/converter/receita-see`
* **Body (Multipart):** `pdf` (Arquivo .pdf)
* **Resposta de Sucesso:**
```json
{
  "success": true,
  "origem": "receita_see",
  "total_registros": 5,
  "registros": [
    {
      "codigo": 1234,
      "tipo_ato": "1234 - Certidão...",
      "valor_emolumento": 50.00,
      ...
    }
  ]
}

```



### 2. Converter Guia Sistema (Texto)

Processa guias geradas internamente (vetoriais).

* **Endpoint:** `POST /api/converter/guia-sistema`
* **Body (Multipart):** `pdf` (Arquivo .pdf)
* **Resposta de Sucesso:**
```json
{
  "success": true,
  "origem": "guia_sistema",
  "resumo": {
    "valor_guia": 150.00,
    "valor_total_emolumentos": 100.00,
    ...
  },
  "registros": [...]
}

```



### 3. Converter Tabela de Emolumentos (Excel)

Converte a planilha oficial para JSON de sistema.

* **Endpoint:** `POST /api/converter/tabela-emolumentos`
* **Body (Multipart):** `file` (Arquivo .xlsx)
* **Regras de Negócio:** Identifica automaticamente o sistema (Notas, Protesto, etc.) e calcula faixas de valores para atos de protesto.

### 4. Converter Guia CSV (Arrecadação)

Processa o CSV exportado do SEE, unificando dados de itens e arrecadação.

* **Endpoint:** `POST /api/converter/guia-csv`
* **Body (Multipart):** `file` (Arquivo .csv)
* **Funcionalidades:**
* Calcula automaticamente o **Decêndio**, Mês e Ano baseados nas datas dos registros.
* Extrai colunas "ocultas" de Funemp e Funcomp.


* **Resposta de Sucesso:**
```json
{
  "success": true,
  "resumo": {
    "decendio": "1º Decêndio",
    "mes_referencia": 2,
    "ano_referencia": 2026,
    "valor_guia": 489.43,
    "quantidade_total_atos": 26,
    "valor_total_funemp": 10.08,
    ...
  },
  "registros": [...]
}

```



### 5. Validar e Corrigir DOI (JSON)

Validador completo para Declaração sobre Operações Imobiliárias.

* **Endpoint:** `POST /api/converter/doi`
* **Body (Multipart):** `file` (Arquivo .json)
* **Processamento:**
1. **Correção:** Remove BOM do Windows e converte tipos (ex: `"100.00"` -> `100.00`, `"true"` -> `true`).
2. **Schema:** Valida contra o `schema.json` oficial (Draft 2020-12).
3. **Negócio:** Valida CPF, CNPJ, CIB, Datas futuras e Soma de Participações (99-100%).


* **Resposta (Erro de Validação):**
```json
{
  "success": true,
  "is_valid": false,
  "total_errors": 1,
  "errors": [
    {
      "tipo": "NEGOCIO",
      "mensagem": "Soma das participações deve estar entre 99% e 100%.",
      "localizacao": {
        "declaracao_index": 0,
        "grupo": "adquirentes",
        "campo": "participacao"
      },
      "valor_encontrado": "50%"
    }
  ],
  "data": { ...JSON corrigido... }
}

```



---

## 📂 Estrutura do Projeto

```text
orius-tools/
├── src/
│   ├── config/           # Configurações (Swagger)
│   ├── controllers/      # Controladores das rotas
│   ├── middlewares/      # Upload e validações
│   ├── routes/           # Definição de endpoints
│   ├── services/         # Lógica de Negócio (Core)
│   │   ├── ocrService.js       # Tesseract + PDFtoPPM
│   │   ├── textService.js      # PDFtoText + Regex
│   │   ├── excelService.js     # SheetJS (Tabela Emolumentos)
│   │   ├── csvService.js       # Parser CSV + Lógica Decêndio
│   │   └── doiService.js       # Validador AJV + Regras de Negócio
│   ├── utils/            # Helpers (Formatadores)
│   └── server.js         # Entry Point
├── schema.json           # Schema oficial da DOI
├── Dockerfile            # Configuração de container
└── README.md             # Esta documentação

```
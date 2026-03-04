# Usa a imagem oficial do Node.js 20 baseada em Debian
FROM node:20

# Evita prompts interativos durante a instalação
ENV DEBIAN_FRONTEND=noninteractive

# Instala as dependências do sistema necessárias para os serviços
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Poppler: Fornece pdftoppm e pdftotext
    poppler-utils \
    # LibreOffice: Para conversão de RTF para HTML
    libreoffice \
    # Tesseract: Motor de OCR e dados da língua portuguesa
    tesseract-ocr \
    tesseract-ocr-por \
    # Fontes básicas para renderização
    fonts-liberation \
    # Limpeza
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do Node.js (incluindo tesseract.js e sequelize)
RUN npm install

# Copia todo o código fonte
COPY . .

# Cria a pasta de uploads conforme definido no seu middleware
RUN mkdir -p uploads && chmod 777 uploads

# Expõe a porta que a API utiliza
EXPOSE 3000

# Comando corrigido: utiliza o script definido no seu package.json
CMD ["npm", "start"]
# Usa uma imagem leve do Node.js 20 (baseada em Debian)
FROM node:20-slim

# 1. Instala as dependências do sistema (Poppler e dependências para o Tesseract)
# O apt-get install poppler-utils instala o pdftoppm e o pdftotext
RUN apt-get update && \
    apt-get install -y poppler-utils \
    libgconf-2-4 \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Define o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copia os arquivos de dependência
COPY package*.json ./

# 4. Instala as dependências do Node.js
RUN npm install --production

# 5. Copia o restante do código fonte
COPY . .

# 6. Cria a pasta de uploads para garantir que existe
RUN mkdir -p src/uploads

# 7. Expõe a porta que a API usa
EXPOSE 3000

# 8. Comando para iniciar a aplicação
CMD ["npm", "start"]
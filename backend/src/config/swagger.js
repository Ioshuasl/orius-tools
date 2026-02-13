import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orius Tools API',
      version: '1.0.0',
      description: 'API de ferramentas para conversão e conferência de documentos cartorários (PDF, Excel, CSV).',
      contact: {
        name: 'Suporte Orius',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local',
      },
      // Você pode adicionar a URL de produção aqui depois
      // { url: 'https://api.orius.tec.br', description: 'Produção' }
    ],
  },
  // Caminho onde estão os arquivos com as anotações (comentários) da documentação
  apis: ['./src/routes/*.js'], 
};

export const swaggerSpec = swaggerJsdoc(options);
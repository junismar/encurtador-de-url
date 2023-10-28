const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Encurtador de URL API',
    version: '1.0.0',
    description: 'Documentação da API para o encurtador de URL',
  },
  servers: [
    {
      url: 'http://localhost:3000', // Substitua pela URL do seu servidor em produção
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['**/*EncurtadorUrl.js'], // Substitua pelo caminho dos seus arquivos de rota
};

module.exports = swaggerJSDoc(options);

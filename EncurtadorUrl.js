const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig.js');
// Rota para acessar a documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'junismaralves',
    password: '123456',
    database: 'encurtadorurl'
});

db.connect(err => {
    if (err) throw err;
    console.log('Conexão com o banco de dados estabelecida.');
});

function generateShortURL() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const urlLength  = 10; // Tamanho desejado para a URL curta

    let url_curta = '';

    for (let i = 0; i < urlLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        url_curta += characters.charAt(randomIndex);
    }
    return url_curta;
}

/**
 * @swagger
 * /encurtar:
 *   post:
 *     summary: Rota para encurtar uma URL.
 *     tags:
 *       - URL
 *     description: Encurte uma URL e a persista no banco de dados.
 *     requestBody:
 *       description: Dados de entrada para encurtar uma URL.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               url_original:
 *                 type: string
 *             required:
 *               - url_original
 *     responses:
 *       200:
 *         description: URL encurtada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 url_curta:
 *                   type: string
 *       400:
 *         description: Valor inválido para url_original.
 */
app.post('/encurtar', (req, res) => {
    const { url_original } = req.body;

    // Verifica se a url_original é válida
    if (!url_original) {
        res.status(400).json({ error: 'Valor inválido para url_original' });
        return;
    }

    // Gera uma url_curta
    const url_curta = generateShortURL();

    const query = 'INSERT INTO url (url_original, url_curta) VALUES (?, ?)';
    db.query(query, [url_original, url_curta], (err, result) => {
        if (err) throw err;
        res.json({ url_curta });
    });
});

/**
 * @swagger
 * /url/{id}:
 *   get:
 *     summary: Rota para retornar a URL original com base no ID.
 *     tags:
 *       - URL
 *     description: Retorna a URL original com base no ID fornecido.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: URL original encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 url_original:
 *                   type: string
 *       404:
 *         description: URL não encontrada.
 */
app.get('/url/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT url_original FROM url WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.json({ url_original: result[0].url_original });
        } else {
            res.status(404).json({ error: 'URL não encontrada.' });
        }
    });
});

/**
 * @swagger
 * /urls/{data}:
 *   get:
 *     summary: Rota para retornar todas as URLs encurtadas em uma data específica.
 *     tags:
 *       - URL
 *     description: Retorna todas as URLs encurtadas criadas em uma data específica.
 *     parameters:
 *       - in: path
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: URLs encontradas com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   url_original:
 *                     type: string
 */
// Rota para retornar todas as URLs encurtadas em uma data específica Exemplo: "26/10/2023"
app.get('/urls/:data', (req, res) => {
    const data = req.params.data;    
    const query = 'SELECT * FROM url WHERE DATE(data_criacao) = STR_TO_DATE(?, "%d/%m/%Y")';

    db.query(query, [data], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

/**
 * @swagger
 * /{url_curta}:
 *   get:
 *     summary: Rota para redirecionar para a URL original com base no encurtamento.
 *     tags:
 *       - URL
 *     description: Redireciona o usuário para a URL original com base no encurtamento fornecido.
 *     parameters:
 *       - in: path
 *         name: url_curta
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       301:
 *         description: Redirecionamento permanente para a URL original.
 *       400:
 *         description: URL curta inválida.
 *       404:
 *         description: URL encurtada não encontrada.
 */
app.get('/:url_curta', (req, res) => {
    const url_curta = req.params.url_curta;
    const query = 'SELECT url_original FROM url WHERE url_curta = ?';
    db.query(query, [url_curta], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro interno do servidor.' });
            return;
        }
        
        if (result.length > 0) {
            // Redirecionar para a URL original
            const url_original = result[0].url_original;
            
            // Certifique-se de que não estamos redirecionando para a própria URL curta
            if (url_original !== req.originalUrl) {
                res.redirect(301, url_original); // Redirecionamento permanente
            } else {
                res.status(400).json({ error: 'URL curta inválida.' });
            }
        } else {
            res.status(404).json({ error: 'URL encurtada não encontrada.' });
        }
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor está executando na porta ${port}`);
});
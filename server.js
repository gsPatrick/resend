const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Inicializar Resend com a chave da API
const resend = new Resend(process.env.RESEND_API_KEY);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para envio de email de contato
app.post('/send-contact-email', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validação básica
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios: name, email, subject, message'
      });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    // Template HTML do email
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Mensagem de Contato</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .field {
            margin-bottom: 15px;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            margin-top: 5px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 3px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Nova Mensagem de Contato</h2>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="label">Nome:</div>
            <div class="value">${name}</div>
          </div>
          
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${email}</div>
          </div>
          
          <div class="field">
            <div class="label">Assunto:</div>
            <div class="value">${subject}</div>
          </div>
          
          <div class="field">
            <div class="label">Mensagem:</div>
            <div class="value">${message.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        
        <div class="footer">
          Email enviado automaticamente pelo sistema de contato
        </div>
      </body>
      </html>
    `;

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'contato@seudominio.com',
      to: process.env.TO_EMAIL || 'contato@seudominio.com',
      subject: `[CONTATO] ${subject}`,
      html: htmlTemplate,
      reply_to: email
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao enviar email'
      });
    }

    res.json({
      success: true,
      message: 'Email enviado com sucesso!',
      emailId: data.id
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Email API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota para teste (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.get('/test', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste da API de Email</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          form { background: #f4f4f4; padding: 20px; border-radius: 5px; }
          input, textarea { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; }
          button { background: #007cba; color: white; padding: 12px 20px; border: none; border-radius: 3px; cursor: pointer; }
          button:hover { background: #005a87; }
        </style>
      </head>
      <body>
        <h2>Teste da API de Email</h2>
        <form action="/send-contact-email" method="POST">
          <input type="text" name="name" placeholder="Seu nome" required>
          <input type="email" name="email" placeholder="Seu email" required>
          <input type="text" name="subject" placeholder="Assunto" required>
          <textarea name="message" rows="5" placeholder="Sua mensagem" required></textarea>
          <button type="submit">Enviar Email</button>
        </form>
      </body>
      </html>
    `);
  });
}

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📧 API de email pronta para uso`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🧪 Teste disponível em: http://localhost:${port}/test`);
  }
});

module.exports = app;
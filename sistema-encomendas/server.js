const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const app = express();
const adapter = new FileSync('db.json');
const db = low(adapter);

// Configuração inicial do banco de dados
db.defaults({ clientes: [], encomendas: [] }).write();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- ROTA DE BACKUP ---
app.get('/api/backup', (req, res) => {
  res.download(path.join(__dirname, 'db.json'), `backup-encomendas-${Date.now()}.json`);
});

// --- ROTAS DE CLIENTES ---
app.get('/api/clientes', (req, res) => {
  const clientes = db.get('clientes').value();
  res.json(clientes);
});

app.post('/api/clientes', (req, res) => {
  const { nome, whatsapp, aniversario } = req.body;
  const novoCliente = { 
    id: Date.now().toString(), 
    nome, 
    whatsapp, 
    aniversario: aniversario || '' 
  };
  db.get('clientes').push(novoCliente).write();
  res.json(novoCliente);
});

app.delete('/api/clientes/:id', (req, res) => {
  const { id } = req.params;
  db.get('clientes').remove({ id }).write();
  res.json({ success: true });
});

// --- ROTAS DE ENCOMENDAS ---
app.get('/api/encomendas', (req, res) => {
  const encomendas = db.get('encomendas').value();
  res.json(encomendas);
});

app.post('/api/encomendas', (req, res) => {
  const { clienteId, itens, dataEntrada, dataEntrega, statusPagamento } = req.body;
  const novaEncomenda = {
    id: Date.now().toString(),
    clienteId,
    itens: itens || [], 
    dataEntrada,
    dataEntrega,
    statusPagamento: statusPagamento || 'Pendente',
    concluida: false
  };
  db.get('encomendas').push(novaEncomenda).write();
  res.json(novaEncomenda);
});

app.patch('/api/encomendas/:id/toggle', (req, res) => {
  const { id } = req.params;
  const encomenda = db.get('encomendas').find({ id }).value();
  if (encomenda) {
    db.get('encomendas').find({ id }).assign({ concluida: !encomenda.concluida }).write();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Encomenda não encontrada' });
  }
});

app.delete('/api/encomendas/:id', (req, res) => {
  const { id } = req.params;
  db.get('encomendas').remove({ id }).write();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
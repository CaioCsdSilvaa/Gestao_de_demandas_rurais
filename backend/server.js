
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const banco = new Database("desafios.db");

// Em produção, coloque esse segredo em uma variável de ambiente.
const SEGREDO = process.env.JWT_SECRET || "segredo-local-do-projeto";

app.use(cors());
app.use(express.json());

// Cria as tabelas automaticamente.
banco.exec(`
  CREATE TABLE IF NOT EXISTS associacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requisicoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    contato TEXT NOT NULL,
    caf TEXT,
    necessidade TEXT NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT DEFAULT 'Pendente',
    data TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Cadastro de associação.
app.post("/api/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha || senha.length < 6) {
    return res.status(400).json({
      erro: "Informe nome, e-mail e senha de pelo menos 6 caracteres."
    });
  }

  try {
    const senhaProtegida = await bcrypt.hash(senha, 10);

    banco.prepare(
      "INSERT INTO associacoes (nome, email, senha) VALUES (?, ?, ?)"
    ).run(nome.trim(), email.trim().toLowerCase(), senhaProtegida);

    res.status(201).json({ mensagem: "Associação cadastrada!" });
  } catch {
    res.status(409).json({ erro: "Este e-mail já está cadastrado." });
  }
});

// Login exclusivo das associações.
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  const associacao = banco.prepare(
    "SELECT * FROM associacoes WHERE email = ?"
  ).get((email || "").trim().toLowerCase());

  if (!associacao || !(await bcrypt.compare(senha || "", associacao.senha))) {
    return res.status(401).json({ erro: "E-mail ou senha incorretos." });
  }

  const token = jwt.sign(
    { id: associacao.id },
    SEGREDO,
    { expiresIn: "2h" }
  );

  res.json({
    token,
    nome: associacao.nome
  });
});

// Verifica se quem acessa o gerenciamento está autenticado.
function protegerAssociacao(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  try {
    req.associacao = jwt.verify(token, SEGREDO);
    next();
  } catch {
    res.status(401).json({ erro: "Faça login como associação." });
  }
}

// Agricultores podem enviar requisições sem conta.
app.post("/api/requisicoes", (req, res) => {
  const { nome, contato, caf, necessidade, descricao } = req.body;

  if (!nome || !contato || !necessidade || !descricao) {
    return res.status(400).json({
      erro: "Preencha nome, contato, necessidade e descrição."
    });
  }

  const resultado = banco.prepare(`
    INSERT INTO requisicoes (nome, contato, caf, necessidade, descricao)
    VALUES (?, ?, ?, ?, ?)
  `).run(nome, contato, caf || "", necessidade, descricao);

  res.status(201).json({
    mensagem: "Requisição registrada!",
    id: resultado.lastInsertRowid
  });
});

// SOMENTE associações autenticadas podem consultar os pedidos.
app.get("/api/requisicoes", protegerAssociacao, (req, res) => {
  const requisicoes = banco.prepare(
    "SELECT * FROM requisicoes ORDER BY id DESC"
  ).all();

  res.json(requisicoes);
});

// Atualização de status também exige autenticação.
app.patch("/api/requisicoes/:id", protegerAssociacao, (req, res) => {
  const { status } = req.body;
  const permitidos = ["Pendente", "Em análise", "Concluída"];

  if (!permitidos.includes(status)) {
    return res.status(400).json({ erro: "Status inválido." });
  }

  const resultado = banco.prepare(
    "UPDATE requisicoes SET status = ? WHERE id = ?"
  ).run(status, req.params.id);

  if (resultado.changes === 0) {
    return res.status(404).json({ erro: "Requisição não encontrada." });
  }

  res.json({ mensagem: "Status atualizado!" });
});

app.listen(3001, () => {
  console.log("Backend rodando em http://localhost:3001");
});

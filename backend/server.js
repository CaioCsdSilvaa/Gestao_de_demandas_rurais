
/*
  IMPORTAÇÃO DAS BIBLIOTECAS
*/

const express = require("express"); 
const cors = require("cors"); 
const Database = require("better-sqlite3"); // Permite trabalhar com o banco SQLite.
const bcrypt = require("bcryptjs"); // Protege senhas usando hash.       (essas dua são as mais importantes)
const jwt = require("jsonwebtoken");


/*
  CONFIGURAÇÃO INICIAL DO SERVIDOR E DO BANCO
*/


const app = express();
const banco = new Database("desafios.db");

// Chave que é utilizada para assinar e verificar os tokens JWT.
const SEGREDO = process.env.JWT_SECRET || "segredo-local-do-projeto";

/*
  MIDDLEWARES (pelo que entendi, são funções que são executadas antes das rotas)
*/

// Permite requisições vindas do frontend.
app.use(cors());
app.use(express.json());

/*
  CRIAÇÃO DAS TABELAS
*/

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

// CADASTRO DE ASSOCIAÇÃO

// Esta rota recebe nome, e-mail e senha do frontend.
app.post("/api/cadastro", async (req, res) => {

  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha || senha.length < 6) {

    // 400 pois delimita valores inválidos.
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

// LOGIN DA ASSOCIAÇÃO

app.post("/api/login", async (req, res) => {

  const { email, senha } = req.body;

  const associacao = banco.prepare(
    "SELECT * FROM associacoes WHERE email = ?"
  ).get((email || "").trim().toLowerCase());

  if (!associacao || !(await bcrypt.compare(senha || "", associacao.senha))) {

    // 401 significa que a autenticação não foi autorizada.
    return res.status(401).json({ erro: "E-mail ou senha incorretos." });
  }

  // Cria um token JWT contendo o ID da associação.
  // O token expira em duas horas.
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

// MIDDLEWARE DE AUTENTICAÇÃO

// Esta função protege as rotas que exigem login.
function protegerAssociacao(req, res, next) {

  const token = (req.headers.authorization || "").replace("Bearer ", "");

  try {

    req.associacao = jwt.verify(token, SEGREDO);

    next();

  } catch {

    return res.status(401).json({
      erro: "Faça login como associação."
    });
  }
}

// ENVIO DE REQUISIÇÕES PELOS AGRICULTORES

// Os agricultores podem enviar pedidos sem criar uma conta.
app.post("/api/requisicoes", (req, res) => {
  const { nome, contato, caf, necessidade, descricao } = req.body;

  // O campo caf é opcional. (importanter lembrar disso)
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

// LISTAGEM DE REQUISIÇÕES

// GET consulta dados.
app.get("/api/requisicoes", protegerAssociacao, (req, res) => {

  const requisicoes = banco.prepare(
    "SELECT * FROM requisicoes ORDER BY id DESC"
  ).all();

  res.json(requisicoes);
});

// ATUALIZAÇÃO DO STATUS

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

  // Confirma que a atualização ocorreu.
  res.json({ mensagem: "Status atualizado!" });
});

// INICIALIZAÇÃO DO SERVIDOR

app.listen(3001, () => {
  console.log("Backend rodando em http://localhost:3001");
});

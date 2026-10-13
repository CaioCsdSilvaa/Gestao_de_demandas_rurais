
/*
  IMPORTAÇÃO DAS BIBLIOTECAS

  require() carrega bibliotecas que instalamos no projeto.
  Cada biblioteca tem uma responsabilidade específica.
*/

const express = require("express"); // Cria o servidor e define as rotas da API.
const cors = require("cors"); // Permite que o React acesse o backend.
const Database = require("better-sqlite3"); // Permite trabalhar com o banco SQLite.
const bcrypt = require("bcryptjs"); // Protege senhas usando hash.
const jwt = require("jsonwebtoken"); // Cria e verifica tokens de autenticação.


/*
  CONFIGURAÇÃO INICIAL DO SERVIDOR E DO BANCO
*/

// Cria a aplicação Express.
const app = express();

// Abre o banco de dados desafios.db.
// Se o arquivo não existir, o SQLite poderá criá-lo.
const banco = new Database("desafios.db");

// Chave utilizada para assinar e verificar os tokens JWT.
// Em produção, deve ser configurada por uma variável de ambiente.
const SEGREDO = process.env.JWT_SECRET || "segredo-local-do-projeto";


/*
  MIDDLEWARES

  Middlewares são funções executadas durante o processamento
  das requisições, antes de chegar à rota.
*/

// Permite requisições vindas do frontend.
app.use(cors());

// Permite que o servidor interprete o corpo das requisições em JSON.
app.use(express.json());


/*
  CRIAÇÃO DAS TABELAS

  O SQL abaixo cria as tabelas caso ainda não existam.
  Isso permite iniciar o sistema sem criar as tabelas manualmente.
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

/*
  SIGNIFICADO DAS PRINCIPAIS REGRAS SQL:

  PRIMARY KEY: identifica unicamente cada registro.
  AUTOINCREMENT: gera um ID numérico automaticamente.
  NOT NULL: impede que o campo fique sem valor.
  UNIQUE: impede valores duplicados, como e-mails repetidos.
  DEFAULT: define um valor padrão quando nenhum é informado.
*/


// ======================================================
// CADASTRO DE ASSOCIAÇÃO
// ======================================================

// POST é utilizado para enviar dados e criar um registro.
// Esta rota recebe nome, e-mail e senha do frontend.
app.post("/api/cadastro", async (req, res) => {

  // Extrai os dados enviados no corpo da requisição.
  const { nome, email, senha } = req.body;

  // Valida os campos obrigatórios e o tamanho mínimo da senha.
  if (!nome || !email || !senha || senha.length < 6) {

    // 400 significa que os dados enviados são inválidos.
    return res.status(400).json({
      erro: "Informe nome, e-mail e senha de pelo menos 6 caracteres."
    });
  }

  try {

    // Gera um hash da senha com custo 10.
    // A senha original não é armazenada diretamente no banco.
    const senhaProtegida = await bcrypt.hash(senha, 10);

    // Prepara e executa um INSERT para salvar a associação.
    // Os ? são parâmetros preenchidos com os valores abaixo.
    // Isso ajuda a evitar ataques de SQL Injection.
    banco.prepare(
      "INSERT INTO associacoes (nome, email, senha) VALUES (?, ?, ?)"
    ).run(nome.trim(), email.trim().toLowerCase(), senhaProtegida);

    // 201 significa que um registro foi criado com sucesso.
    res.status(201).json({ mensagem: "Associação cadastrada!" });

  } catch {

    // Se ocorrer um erro, o sistema informa que o e-mail já existe.
    // Atenção: neste código, outros erros de banco também cairiam aqui.
    res.status(409).json({ erro: "Este e-mail já está cadastrado." });
  }
});


// ======================================================
// LOGIN DA ASSOCIAÇÃO
// ======================================================

// POST /api/login recebe as credenciais da associação.
app.post("/api/login", async (req, res) => {

  const { email, senha } = req.body;

  // SELECT procura a associação pelo e-mail informado.
  // get() retorna o primeiro registro encontrado, ou undefined.
  const associacao = banco.prepare(
    "SELECT * FROM associacoes WHERE email = ?"
  ).get((email || "").trim().toLowerCase());

  // Verifica se a associação existe e se a senha confere com o hash.
  // bcrypt.compare() não compara a senha com o hash usando igualdade simples.
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

  // Retorna o token e o nome para o frontend.
  // A senha ou o hash não são enviados na resposta.
  res.json({
    token,
    nome: associacao.nome
  });
});


// ======================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ======================================================

// Esta função protege as rotas que exigem login.
function protegerAssociacao(req, res, next) {

  // Procura o token no cabeçalho Authorization.
  // O formato esperado é: Bearer TOKEN.
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  try {

    // Verifica a assinatura e a validade do token.
    // Se estiver válido, guarda os dados do token em req.associacao.
    req.associacao = jwt.verify(token, SEGREDO);

    // next() permite continuar até a próxima função da rota.
    next();

  } catch {

    // Token ausente, inválido ou expirado: acesso negado.
    return res.status(401).json({
      erro: "Faça login como associação."
    });
  }
}


// ======================================================
// ENVIO DE REQUISIÇÕES PELOS AGRICULTORES
// ======================================================

// Os agricultores podem enviar pedidos sem criar uma conta.
app.post("/api/requisicoes", (req, res) => {

  // Extrai os dados do formulário enviado pelo frontend.
  const { nome, contato, caf, necessidade, descricao } = req.body;

  // Confere se todos os campos obrigatórios foram preenchidos.
  // O campo caf é opcional.
  if (!nome || !contato || !necessidade || !descricao) {
    return res.status(400).json({
      erro: "Preencha nome, contato, necessidade e descrição."
    });
  }

  // INSERT INTO insere uma nova requisição no banco.
  // O status e a data recebem os valores padrão definidos na tabela.
  const resultado = banco.prepare(`
    INSERT INTO requisicoes (nome, contato, caf, necessidade, descricao)
    VALUES (?, ?, ?, ?, ?)
  `).run(nome, contato, caf || "", necessidade, descricao);

  // Retorna uma mensagem e o ID gerado para a nova requisição.
  res.status(201).json({
    mensagem: "Requisição registrada!",
    id: resultado.lastInsertRowid
  });
});


// ======================================================
// LISTAGEM DE REQUISIÇÕES
// ======================================================

// GET consulta dados.
// O middleware exige um token válido antes de executar a consulta.
app.get("/api/requisicoes", protegerAssociacao, (req, res) => {

  // SELECT * busca todas as colunas de todas as requisições.
  // ORDER BY id DESC coloca as mais recentes primeiro.
  const requisicoes = banco.prepare(
    "SELECT * FROM requisicoes ORDER BY id DESC"
  ).all();

  // Envia a lista em formato JSON para o frontend.
  res.json(requisicoes);
});


// ======================================================
// ATUALIZAÇÃO DO STATUS
// ======================================================

// PATCH altera parcialmente um registro existente.
// O middleware exige que a associação esteja autenticada.
app.patch("/api/requisicoes/:id", protegerAssociacao, (req, res) => {

  // Recebe o novo status enviado no corpo da requisição.
  const { status } = req.body;

  // Lista de valores permitidos para evitar estados inválidos.
  const permitidos = ["Pendente", "Em análise", "Concluída"];

  // Se o status não estiver na lista, interrompe a operação.
  if (!permitidos.includes(status)) {
    return res.status(400).json({ erro: "Status inválido." });
  }

  // UPDATE altera o status do registro cujo ID está na URL.
  // req.params.id recupera o valor de :id.
  const resultado = banco.prepare(
    "UPDATE requisicoes SET status = ? WHERE id = ?"
  ).run(status, req.params.id);

  // changes indica quantas linhas foram alteradas.
  // Se for zero, nenhum registro foi encontrado para atualização.
  if (resultado.changes === 0) {
    return res.status(404).json({ erro: "Requisição não encontrada." });
  }

  // Confirma que a atualização ocorreu.
  res.json({ mensagem: "Status atualizado!" });
});


// ======================================================
// INICIALIZAÇÃO DO SERVIDOR
// ======================================================

// Faz o backend começar a escutar requisições na porta 3001.
app.listen(3001, () => {
  console.log("Backend rodando em http://localhost:3001");
});

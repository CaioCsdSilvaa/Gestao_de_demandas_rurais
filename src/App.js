
import { useState } from "react";
import "./App.css";

const API = "http://localhost:3001/api";

function App() {
  const [tela, setTela] = useState("login");
  const [agricultor, setAgricultor] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [contato, setContato] = useState("");
  const [caf, setCaf] = useState("");
  const [necessidade, setNecessidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [token, setToken] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function enviar(url, dados, metodo = "POST") {
    const resposta = await fetch(API + url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.erro || "Ocorreu um erro.");
    }

    return resultado;
  }

  async function entrar(e) {
    e.preventDefault();

    if (agricultor) {
      setTela("problema");
      setMensagem("");
      return;
    }

    try {
      const resultado = await enviar("/login", { email, senha });

      setToken(resultado.token);
      setNome(resultado.nome);

      // Só entra no gerenciamento depois de autenticar.
      const resposta = await fetch(API + "/requisicoes", {
        headers: { Authorization: "Bearer " + resultado.token },
      });

      if (!resposta.ok) throw new Error("Não foi possível carregar os pedidos.");

      setPedidos(await resposta.json());
      setTela("gerenciamento");
      setMensagem("");
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  async function cadastrar(e) {
    e.preventDefault();

    try {
      await enviar("/cadastro", { nome, email, senha });
      setMensagem("Cadastro realizado! Entre com seu e-mail e senha.");
      setTela("login");
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  async function enviarPedido(e) {
    e.preventDefault();

    try {
      await enviar("/requisicoes", {
        nome,
        contato,
        caf,
        necessidade,
        descricao,
      });

      setMensagem("Requisição enviada com sucesso!");
      setNome("");
      setEmail("");
      setContato("");
      setCaf("");
      setNecessidade("");
      setDescricao("");
      setTela("confirmacao");
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  async function atualizarStatus(id, status) {
    try {
      await enviar("/requisicoes/" + id, { status }, "PATCH");

      setPedidos(
        pedidos.map((pedido) =>
          pedido.id === id ? { ...pedido, status } : pedido
        )
      );
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  function sair() {
    setToken("");
    setPedidos([]);
    setEmail("");
    setSenha("");
    setAgricultor(false);
    setMensagem("");
    setTela("login");
  }

  return (
    <main className={"pagina " + tela}>
      {tela === "login" && (
        <section className="caixa">
          <div className="logo"><span></span><span></span></div>

          <form onSubmit={entrar}>
            <input
              type="email"
              placeholder="Email da associação"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!agricultor}
              disabled={agricultor}
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required={!agricultor}
              disabled={agricultor}
            />

            {mensagem && <p>{mensagem}</p>}
            <button>Entrar</button>

            <button
              type="button"
              onClick={() => {
                setAgricultor(false);
                setMensagem("");
                setTela("problema");
              }}
            >
              Sou agricultor
            </button>

            
          </form>

          <button className="link" onClick={() => {
            setMensagem("");
            setTela("cadastro");
          }}>
            Não tem cadastro? Crie um
          </button>
        </section>
      )}

      {tela === "cadastro" && (
        <section className="caixa">
          <div className="logo"><span></span><span></span></div>
          <h3>Novo cadastro</h3>

          <form onSubmit={cadastrar}>
            <input
              placeholder="Nome da associação"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email da associação"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Crie uma senha (mínimo 6 caracteres)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
            {mensagem && <p>{mensagem}</p>}
            <button>Criar conta</button>
          </form>

          <button className="link" onClick={() => {
            setMensagem("");
            setTela("login");
          }}>
            Voltar ao login
          </button>
        </section>
      )}

      {tela === "problema" && (
        <section className="caixa problema">
          
          <h3>Solicitação</h3>

          <form onSubmit={enviarPedido}>
            <label>Nome do proprietário:</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />

            <label>Email:</label>
            <input value={contato} onChange={(e) => setContato(e.target.value)} required />

            <label>CAF:</label>
            <input value={caf} onChange={(e) => setCaf(e.target.value)} />

            <label>Requisição:</label>
            <select value={necessidade} onChange={(e) => setNecessidade(e.target.value)} required>
              <option value="">Selecione</option>
              <option>Água</option>
              <option>Infraestrutura</option>
              <option>Equipamentos</option>
              <option>Assistência técnica</option>
              <option>Transporte</option>
              <option>Outro</option>
            </select>

            <label>Descrição:</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua solicitação com detalhes."
              required
            />

            {mensagem && <p>{mensagem}</p>}
            <button>Enviar</button>

            <button type="button" onClick={() => {
              setMensagem("");
              setAgricultor(false);
              setEmail("");
              setSenha("");
              setTela("login");
            }}>
              Retomar
            </button>

          </form>
        </section>
      )}

      {tela === "confirmacao" && (
        <section className="caixa">
          <h2>Em breve entraremos em contato.</h2>
          <p>{mensagem}</p>
          <button onClick={() => {
            setMensagem("");
            setTela("problema");
          }}>
            Enviar outra
          </button>

          <button onClick={() => {
            setMensagem("");
            setTela("login");
          }}>
            Retomar
          </button>
        </section>
      )}

      {tela === "gerenciamento" && (
        <section className="painel">
          <h1>Lista de requisições:</h1>
          <p>Associação: {nome}</p>

          <div className="catalogo">
            {pedidos.map((pedido) => (
              <article className="cartao" key={pedido.id}>
                <h3>{pedido.nome}</h3>
                <p><b>Contato:</b> {pedido.contato}</p>
                <p><b>CAF:</b> {pedido.caf || "Não informado"}</p>
                <p><b>Tipo:</b> {pedido.necessidade}</p>
                <p><b>Descrição:</b> {pedido.descricao}</p>

                <label>Status:</label>
                <select
                  value={pedido.status}
                  onChange={(e) => atualizarStatus(pedido.id, e.target.value)}
                >
                  <option>Pendente</option>
                  <option>Em análise</option>
                  <option>Concluída</option>
                </select>
              </article>
            ))}

            {pedidos.length === 0 && <p>Nenhuma requisição cadastrada.</p>}
          </div>

          <button onClick={sair}>Sair</button>
        </section>
      )}
    </main>
  );
}

export default App;

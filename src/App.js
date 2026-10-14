import { useState } from "react";
import "./App.css";

import { enviar, buscarRequisicoes } from "./services/api";

import Login from "./components/Login";
import Cadastro from "./components/Cadastro";
import FormularioRequisicao from "./components/FormularioRequisicao";
import Confirmacao from "./components/Confirmacao";
import Gerenciamento from "./components/Gerenciamento";

function App() {
  // Controla qual tela será exibida.
  const [tela, setTela] = useState("login");

  // Dados dos formulários.
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [contato, setContato] = useState("");
  const [caf, setCaf] = useState("");
  const [necessidade, setNecessidade] = useState("");
  const [descricao, setDescricao] = useState("");

  // Dados da associação e das requisições.
  const [pedidos, setPedidos] = useState([]);
  const [token, setToken] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Navega entre as telas e limpa mensagens antigas.
  function mudarTela(novaTela) {
    setMensagem("");
    setTela(novaTela);
  }

  // Login da associação.
  async function entrar(e) {
    e.preventDefault();

    try {
      const resultado = await enviar("/login", {
        email,
        senha,
      });

      const requisicoes = await buscarRequisicoes(
        resultado.token
      );

      setToken(resultado.token);
      setNome(resultado.nome);
      setPedidos(requisicoes);
      setMensagem("");
      setTela("gerenciamento");
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  // Cadastro da associação.
  async function cadastrar(e) {
    e.preventDefault();

    try {
      await enviar("/cadastro", {
        nome,
        email,
        senha,
      });

      setMensagem(
        "Cadastro realizado! Entre com seu e-mail e senha."
      );
      setTela("login");
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  // Envio de uma requisição pelo agricultor.
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

  // Atualiza o status de uma requisição.
  async function atualizarStatus(id, status) {
    try {
      await enviar(
        "/requisicoes/" + id,
        { status },
        "PATCH",
        token
      );

      setPedidos((listaAtual) =>
        listaAtual.map((pedido) =>
          pedido.id === id
            ? { ...pedido, status }
            : pedido
        )
      );
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  // Encerra a sessão da associação.
  function sair() {
    setToken("");
    setPedidos([]);
    setEmail("");
    setSenha("");
    setMensagem("");
    setTela("login");
  }

  // Renderização dos módulos.
  return (
    <main className={"pagina " + tela}>
      {tela === "login" && (
        <Login
          email={email}
          setEmail={setEmail}
          senha={senha}
          setSenha={setSenha}
          mensagem={mensagem}
          entrar={entrar}
          mudarTela={mudarTela}
        />
      )}

      {tela === "cadastro" && (
        <Cadastro
          nome={nome}
          setNome={setNome}
          email={email}
          setEmail={setEmail}
          senha={senha}
          setSenha={setSenha}
          mensagem={mensagem}
          cadastrar={cadastrar}
          mudarTela={mudarTela}
        />
      )}

      {tela === "problema" && (
        <FormularioRequisicao
          nome={nome}
          setNome={setNome}
          contato={contato}
          setContato={setContato}
          caf={caf}
          setCaf={setCaf}
          necessidade={necessidade}
          setNecessidade={setNecessidade}
          descricao={descricao}
          setDescricao={setDescricao}
          mensagem={mensagem}
          enviarPedido={enviarPedido}
          mudarTela={mudarTela}
        />
      )}

      {tela === "confirmacao" && (
        <Confirmacao
          mensagem={mensagem}
          mudarTela={mudarTela}
        />
      )}

      {tela === "gerenciamento" && (
        <Gerenciamento
          nome={nome}
          pedidos={pedidos}
          atualizarStatus={atualizarStatus}
          sair={sair}
        />
      )}
    </main>
  );
}

export default App;

import "../App.css";

function Login({
  email,
  setEmail,
  senha,
  setSenha,
  mensagem,
  setMensagem,
  entrar,
  mudarTela,
}) {
  return (
    <section className="caixa">
      <div className="logo">
        <span></span>
        <span></span>
      </div>

      <form onSubmit={entrar}>
        <input
          type="email"
          placeholder="Email da associação"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {mensagem && <p>{mensagem}</p>}

        <button type="submit">Entrar</button>

        <button
          type="button"
          onClick={() => mudarTela("problema")}
        >
          Sou agricultor
        </button>
      </form>

      <button
        type="button"
        className="link"
        onClick={() => mudarTela("cadastro")}
      >
        Não tem cadastro? Crie um
      </button>
    </section>
  );
}

export default Login;

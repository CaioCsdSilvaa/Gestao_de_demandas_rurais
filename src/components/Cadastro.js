
import "../App.css";

function Cadastro({
  nome,
  setNome,
  email,
  setEmail,
  senha,
  setSenha,
  mensagem,
  cadastrar,
  mudarTela,
}) {
  return (
    <section className="caixa">
      <div className="logo">
        <span></span>
        <span></span>
      </div>

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

        <button type="submit">Criar conta</button>
      </form>

      <button
        type="button"
        className="link"
        onClick={() => mudarTela("login")}
      >
        Voltar ao login
      </button>
    </section>
  );
}

export default Cadastro;

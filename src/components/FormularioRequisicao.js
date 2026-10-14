
import "../App.css";

function FormularioRequisicao({
  nome,
  setNome,
  contato,
  setContato,
  caf,
  setCaf,
  necessidade,
  setNecessidade,
  descricao,
  setDescricao,
  mensagem,
  enviarPedido,
  mudarTela,
}) {
  return (
    <section className="caixa problema">
      <h3>Solicitação</h3>

      <form onSubmit={enviarPedido}>
        <label>Nome do proprietário:</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        <label>Email:</label>
        <input
          type="email"
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          required
        />

        <label>CAF:</label>
        <input
          value={caf}
          onChange={(e) => setCaf(e.target.value)}
        />

        <label>Requisição:</label>
        <select
          value={necessidade}
          onChange={(e) => setNecessidade(e.target.value)}
          required
        >
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

        <button type="submit">Enviar</button>

        <button
          type="button"
          onClick={() => mudarTela("login")}
        >
          Retomar
        </button>
      </form>
    </section>
  );
}

export default FormularioRequisicao;

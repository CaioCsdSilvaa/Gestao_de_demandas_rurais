
import "../App.css";

function CardRequisicao({ pedido, atualizarStatus }) {
  return (
    <article className="cartao">
      <h3>{pedido.nome}</h3>

      <p>
        <b>Contato:</b> {pedido.contato}
      </p>

      <p>
        <b>CAF:</b> {pedido.caf || "Não informado"}
      </p>

      <p>
        <b>Tipo:</b> {pedido.necessidade}
      </p>

      <p>
        <b>Descrição:</b> {pedido.descricao}
      </p>

      <label>Status:</label>

      <select
        value={pedido.status}
        onChange={(e) =>
          atualizarStatus(pedido.id, e.target.value)
        }
      >
        <option>Pendente</option>
        <option>Em análise</option>
        <option>Concluída</option>
      </select>
    </article>
  );
}

export default CardRequisicao;

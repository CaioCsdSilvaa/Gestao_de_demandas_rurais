
import "../App.css";
import CardRequisicao from "./CardRequisicao";

function Gerenciamento({
  nome,
  pedidos,
  atualizarStatus,
  sair,
}) {
  return (
    <section className="painel">
      <h1>Lista de requisições:</h1>
      <p>Associação: {nome}</p>

      <div className="catalogo">
        {pedidos.map((pedido) => (
          <CardRequisicao
            key={pedido.id}
            pedido={pedido}
            atualizarStatus={atualizarStatus}
          />
        ))}

        {pedidos.length === 0 && (
          <p>Nenhuma requisição cadastrada.</p>
        )}
      </div>

      <button type="button" onClick={sair}>
        Sair
      </button>
    </section>
  );
}

export default Gerenciamento;

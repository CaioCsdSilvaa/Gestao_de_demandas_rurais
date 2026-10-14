
import "../App.css";

function Confirmacao({ mensagem, mudarTela }) {
  return (
    <section className="caixa">
      <h2>Em breve entraremos em contato.</h2>
      <p>{mensagem}</p>

      <button
        type="button"
        onClick={() => mudarTela("problema")}
      >
        Enviar outra
      </button>

      <button
        type="button"
        onClick={() => mudarTela("login")}
      >
        Retomar
      </button>
    </section>
  );
}

export default Confirmacao;

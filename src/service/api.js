
const API = "http://localhost:3001/api";

// Função genérica para enviar dados ao backend.
export async function enviar(url, dados, metodo = "POST", token = "") {
  const resposta = await fetch(API + url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",

      // Se houver token, envia no cabeçalho de autenticação.
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  // Transforma erros HTTP em erros que o React pode capturar.
  if (!resposta.ok) {
    throw new Error(resultado.erro || "Ocorreu um erro.");
  }

  return resultado;
}

// Busca a lista de requisições da associação autenticada.
export async function buscarRequisicoes(token) {
  const resposta = await fetch(API + "/requisicoes", {
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  if (!resposta.ok) {
    throw new Error("Não foi possível carregar os pedidos.");
  }

  return await resposta.json();
}

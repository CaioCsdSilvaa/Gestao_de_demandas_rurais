const API = "http://localhost:3001/api";

// Envia dados para o backend.
export async function enviar(url, dados, metodo = "POST", token = "") {
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

// Busca todas as requisições cadastradas.
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
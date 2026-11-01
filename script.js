"use strict";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const produtos = window.PRODUTOS;
const chaveCarrinho = "ponto-encontro-carrinho";
const produtosEl = document.querySelector("#produtos");
const dialogo = document.querySelector("#carrinho");
let carrinho = carregarCarrinho();

function carregarCarrinho() {
  try {
    const salvo = JSON.parse(localStorage.getItem(chaveCarrinho) || "[]");
    return Array.isArray(salvo) ? salvo.filter((item) => produtos.some((produto) => produto.id === item.id) && Number.isInteger(item.quantidade) && item.quantidade > 0) : [];
  } catch {
    return [];
  }
}

function salvarCarrinho() {
  localStorage.setItem(chaveCarrinho, JSON.stringify(carrinho));
}

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]);
}

function renderizarProdutos() {
  const termo = document.querySelector("#busca").value.trim().toLocaleLowerCase("pt-BR");
  const categoria = document.querySelector("#categoria").value;
  const ordem = document.querySelector("#ordenacao").value;
  const lista = produtos.filter((produto) => `${produto.nome} ${produto.descricao}`.toLocaleLowerCase("pt-BR").includes(termo) && (!categoria || produto.tags.includes(categoria)));
  lista.sort((a, b) => ordem === "menor-preco" ? a.preco - b.preco : ordem === "maior-preco" ? b.preco - a.preco : ordem === "avaliacao" ? b.avaliacao - a.avaliacao : b.data.localeCompare(a.data));
  produtosEl.innerHTML = lista.map((produto) => `
    <article class="card">
      <a class="imagem-link" href="${escapar(produto.imagem)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir foto de ${escapar(produto.nome)}"><img src="${escapar(produto.imagem)}" alt="${escapar(produto.alt)}" width="720" height="480" loading="lazy"></a>
      <div class="card-conteudo">
        <div class="etiquetas">${produto.tags.map((tag) => `<span class="categoria-produto">${escapar(tag)}</span>`).join("")}</div>
        <h3>${escapar(produto.nome)}</h3>
        <p class="descricao">${escapar(produto.descricao)}</p>
        <p class="autor">${escapar(produto.autor)} · ${new Date(`${produto.data}T12:00:00`).toLocaleDateString("pt-BR")}</p>
        <div class="preco-avaliacao">
          <strong class="preco">${moeda.format(produto.preco)}</strong>
          <span class="avaliacao" role="img" aria-label="Avaliação ${produto.avaliacao.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} de 5">
            <span aria-hidden="true">${"★".repeat(Math.round(produto.avaliacao))}${"☆".repeat(5 - Math.round(produto.avaliacao))}</span>
            <span aria-hidden="true">${produto.avaliacao.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span>
          </span>
        </div>
        <button class="botao botao-principal adicionar" type="button" data-adicionar="${produto.id}">Adicionar ao carrinho</button>
      </div>
    </article>`).join("");
  document.querySelector("#contador-resultados").textContent = `${lista.length} ${lista.length === 1 ? "item" : "itens"}`;
  document.querySelector("#sem-resultados").hidden = lista.length > 0;
}

function totais() {
  const subtotal = carrinho.reduce((soma, item) => soma + produtos.find((produto) => produto.id === item.id).preco * item.quantidade, 0);
  const temPerecivel = carrinho.some((item) => produtos.find((produto) => produto.id === item.id).perecivel);
  const entrega = document.querySelector("#tipo-entrega").value === "delivery" && temPerecivel ? 2.5 : 0;
  return { subtotal, entrega, total: subtotal + entrega };
}

function renderizarCarrinho() {
  const lista = document.querySelector("#itens-carrinho");
  lista.innerHTML = carrinho.map((item) => {
    const produto = produtos.find((linha) => linha.id === item.id);
    return `<li class="item-carrinho">
      <a class="imagem-link" href="${escapar(produto.imagem)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir foto de ${escapar(produto.nome)}"><img src="${escapar(produto.imagem)}" alt="" width="72" height="72"></a>
      <div class="item-detalhes"><strong>${escapar(produto.nome)}</strong><span>${moeda.format(produto.preco)} cada</span></div>
      <div class="quantidade">
        <button type="button" aria-label="Diminuir ${escapar(produto.nome)}" data-mudar="-1" data-id="${item.id}">−</button>
        <span>${item.quantidade}</span>
        <button type="button" aria-label="Aumentar ${escapar(produto.nome)}" data-mudar="1" data-id="${item.id}">+</button>
      </div>
      <button class="remover" type="button" data-remover="${item.id}">Remover</button>
    </li>`;
  }).join("");
  const valores = totais();
  document.querySelector("#contador-carrinho").textContent = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  document.querySelector("#subtotal").textContent = moeda.format(valores.subtotal);
  document.querySelector("#entrega").textContent = moeda.format(valores.entrega);
  document.querySelector("#total").textContent = moeda.format(valores.total);
  document.querySelector("#carrinho-vazio").hidden = carrinho.length > 0;
  document.querySelector("#finalizar").disabled = carrinho.length === 0;
}

function mostrarMensagem(texto) {
  const mensagem = document.querySelector("#mensagem");
  mensagem.textContent = texto;
  mensagem.classList.add("visivel");
  window.setTimeout(() => mensagem.classList.remove("visivel"), 2400);
}

document.querySelector("#categoria").innerHTML += [...new Set(produtos.flatMap((produto) => produto.tags))].sort().map((categoria) => `<option value="${escapar(categoria)}">${escapar(categoria)}</option>`).join("");
document.querySelectorAll("#busca, #categoria, #ordenacao").forEach((campo) => campo.addEventListener(campo.id === "busca" ? "input" : "change", renderizarProdutos));
document.querySelector("#abrir-carrinho").addEventListener("click", () => dialogo.showModal());
document.querySelector("#fechar-carrinho").addEventListener("click", () => dialogo.close());
dialogo.addEventListener("click", (evento) => {
  const caixa = dialogo.getBoundingClientRect();
  if (evento.clientX < caixa.left || evento.clientX > caixa.right || evento.clientY < caixa.top || evento.clientY > caixa.bottom) dialogo.close();
});
document.querySelector("#tipo-entrega").addEventListener("change", renderizarCarrinho);
document.addEventListener("click", (evento) => {
  const adicionar = evento.target.closest("[data-adicionar]");
  const mudar = evento.target.closest("[data-mudar]");
  const remover = evento.target.closest("[data-remover]");
  if (adicionar) {
    const atual = carrinho.find((item) => item.id === adicionar.dataset.adicionar);
    if (atual) atual.quantidade += 1;
    else carrinho.push({ id: adicionar.dataset.adicionar, quantidade: 1 });
    mostrarMensagem("Item adicionado ao carrinho.");
  } else if (mudar) {
    const item = carrinho.find((linha) => linha.id === mudar.dataset.id);
    item.quantidade += Number(mudar.dataset.mudar);
    if (item.quantidade < 1) carrinho = carrinho.filter((linha) => linha !== item);
  } else if (remover) {
    carrinho = carrinho.filter((item) => item.id !== remover.dataset.remover);
  } else {
    return;
  }
  salvarCarrinho();
  renderizarCarrinho();
});
document.querySelector("#finalizar").addEventListener("click", () => {
  if (!carrinho.length) return;
  carrinho = [];
  salvarCarrinho();
  renderizarCarrinho();
  dialogo.close();
  mostrarMensagem("Pedido registrado neste navegador.");
});
document.querySelector("#form-contato").addEventListener("submit", (evento) => {
  evento.preventDefault();
  evento.currentTarget.reset();
  mostrarMensagem("Mensagem registrada.");
});
document.querySelector("#form-newsletter").addEventListener("submit", (evento) => {
  evento.preventDefault();
  localStorage.setItem("ponto-encontro-interesse", evento.currentTarget.email.value);
  evento.currentTarget.reset();
  mostrarMensagem("Interesse registrado neste navegador.");
});
document.querySelector("#tema").addEventListener("click", (evento) => {
  const escuro = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = escuro ? "dark" : "light";
  evento.currentTarget.textContent = escuro ? "Tema claro" : "Tema escuro";
  evento.currentTarget.setAttribute("aria-pressed", String(escuro));
  localStorage.setItem("ponto-encontro-tema", document.documentElement.dataset.theme);
});
const tema = localStorage.getItem("ponto-encontro-tema") || "light";
document.documentElement.dataset.theme = tema;
document.querySelector("#tema").textContent = tema === "dark" ? "Tema claro" : "Tema escuro";
document.querySelector("#tema").setAttribute("aria-pressed", String(tema === "dark"));
renderizarProdutos();
renderizarCarrinho();

const CONFIG = {
  nomeEmpresa: "BrunoJato",
  whatsappDono: "5594991014378",
  senhaAdmin: "1234",
  chaveStorage: "brunojato_agendamentos_v2"
};

const SERVICOS = [
  { nome: "Lavagem simples", descricao: "Lavagem externa rápida para manutenção.", preco: 40, duracao: "40 min" },
  { nome: "Lavagem completa", descricao: "Externa, interna, painel e tapetes.", preco: 70, duracao: "1h" },
  { nome: "Lavagem premium c/ cera", descricao: "Limpeza completa + cera protetora.", preco: 110, duracao: "1h30" },
  { nome: "Higienização interna", descricao: "Limpeza profunda de bancos e carpetes.", preco: 160, duracao: "2h" },
  { nome: "Polimento técnico", descricao: "Correção estética da pintura.", preco: 280, duracao: "3h" }
];

const app = {
  getEl: id => document.getElementById(id),

  moeda: valor => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),

  toast: (msg, type="info") => {
    const el = document.getElementById("toast");
    const msgEl = document.getElementById("toastMsg");
    const iconEl = document.querySelector(".toast-icon");
    
    let iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    if(type === 'success') {
      iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke="#00e396"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    }
    
    iconEl.innerHTML = iconSvg;
    msgEl.textContent = msg;
    
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 4000);
  },

  getAgendamentos: () => JSON.parse(localStorage.getItem(CONFIG.chaveStorage) || "[]"),
  
  salvarAgendamentos: lista => localStorage.setItem(CONFIG.chaveStorage, JSON.stringify(lista)),

  init: () => {
    app.popularServicos();
    const hoje = new Date().toISOString().split("T")[0];
    const dataInput = app.getEl("data");
    if(dataInput) dataInput.min = hoje;
  },

  popularServicos: () => {
    const select = app.getEl("servico");
    select.innerHTML = '<option value="" disabled selected hidden></option>' + SERVICOS.map((s, i) =>
      `<option value="${i}">${s.nome} - ${app.moeda(s.preco)}</option>`
    ).join("");

    app.getEl("listaServicos").innerHTML = SERVICOS.map(s => `
      <div class="service-item">
        <div>
          <div class="service-title">${s.nome}</div>
          <div class="service-desc">${s.descricao}</div>
          <div class="service-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${s.duracao}
          </div>
        </div>
        <div class="service-price">${app.moeda(s.preco)}</div>
      </div>
    `).join("");
  },

  trocarTela: tela => {
    app.getEl("viewCliente").classList.toggle("active", tela === "cliente");
    app.getEl("viewAdmin").classList.toggle("active", tela === "admin");
    app.getEl("tabCliente").classList.toggle("active", tela === "cliente");
    app.getEl("tabAdmin").classList.toggle("active", tela === "admin");
    window.scrollTo({ top: document.querySelector(".main-container").offsetTop - 100, behavior: "smooth" });
  },

  rolarServicos: () => {
    app.trocarTela("cliente");
    setTimeout(() => app.getEl("servicosBox").scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  },

  atualizarResumo: () => {
    const index = app.getEl("servico").value;
    if (index === "") {
      app.getEl("resumoValor").innerHTML = '<span class="muted">Selecione um serviço para calcular os valores.</span>';
      return;
    }
    const s = SERVICOS[Number(index)];
    const entrada = s.preco * 0.5;
    const restante = s.preco - entrada;
    
    app.getEl("resumoValor").innerHTML = `
      <div class="summary-line"><span>Serviço</span><strong>${s.nome}</strong></div>
      <div class="summary-line"><span>Valor Total</span><strong>${app.moeda(s.preco)}</strong></div>
      <div class="summary-line"><span>Sinal (50%)</span><strong>${app.moeda(entrada)}</strong></div>
      <div class="summary-line summary-highlight"><span>Restante na entrega</span><strong>${app.moeda(restante)}</strong></div>
    `;
  },

  validarHorario: (data, hora) => {
    const lista = app.getAgendamentos();
    return !lista.some(a => a.data === data && a.hora === hora && ["pendente", "aprovado"].includes(a.status));
  },

  criarAgendamento: e => {
    e.preventDefault();
    const servicoIndex = app.getEl("servico").value;
    if(servicoIndex === "") return app.toast("Selecione um serviço.", "error");
    
    const s = SERVICOS[Number(servicoIndex)];
    const data = app.getEl("data").value;
    const hora = app.getEl("hora").value;

    if (!app.validarHorario(data, hora)) {
      return app.toast("Horário indisponível ou aguardando aprovação.", "error");
    }

    const agendamento = {
      id: Date.now(),
      nome: app.getEl("nome").value.trim(),
      whatsapp: app.getEl("whatsapp").value.trim(),
      tipoVeiculo: app.getEl("tipoVeiculo").value,
      veiculo: app.getEl("veiculo").value.trim(),
      servico: s.nome,
      preco: s.preco,
      entrada: s.preco * 0.5,
      restante: s.preco * 0.5,
      data,
      hora,
      pagamento: app.getEl("pagamento").value,
      observacoes: app.getEl("observacoes").value.trim(),
      status: "pendente",
      criadoEm: new Date().toLocaleString("pt-BR")
    };

    const lista = app.getAgendamentos();
    lista.push(agendamento);
    app.salvarAgendamentos(lista);

    const texto = `Olá, BrunoJato! Quero confirmar uma solicitação de agendamento.%0A%0A` +
      `👤 *Cliente:* ${agendamento.nome}%0A📱 *WhatsApp:* ${agendamento.whatsapp}%0A🚗 *Veículo:* ${agendamento.tipoVeiculo} - ${agendamento.veiculo}%0A` +
      `✨ *Serviço:* ${agendamento.servico}%0A📅 *Data/Hora:* ${agendamento.data.split('-').reverse().join('/')} às ${agendamento.hora}%0A` +
      `💰 *Valor Total:* ${app.moeda(agendamento.preco)}%0A💵 *Sinal (50%):* ${app.moeda(agendamento.entrada)}%0A` +
      `💳 *Previsto:* ${agendamento.pagamento}%0A📝 *Obs:* ${agendamento.observacoes || "Nenhuma"}%0A%0A_Vou enviar o comprovante do sinal logo abaixo._`;

    window.open(`https://wa.me/${CONFIG.whatsappDono}?text=${texto}`, "_blank");
    app.getEl("formAgendamento").reset();
    app.atualizarResumo();
    app.renderAdmin();
    app.toast("Solicitação criada!", "success");
  },

  entrarAdmin: () => {
    if (app.getEl("senhaAdmin").value !== CONFIG.senhaAdmin) {
      return app.toast("Senha incorreta.", "error");
    }
    app.getEl("loginAdmin").style.display = "none";
    app.getEl("dashboardAdmin").style.display = "block";
    app.renderAdmin();
    app.toast("Acesso liberado.", "success");
  },

  setStatus: (id, status) => {
    const lista = app.getAgendamentos();
    const item = lista.find(a => a.id === id);
    if (!item) return;
    item.status = status;
    item.atualizadoEm = new Date().toLocaleString("pt-BR");
    app.salvarAgendamentos(lista);
    app.renderAdmin();
    app.toast(`Status atualizado: ${status}`, "success");
  },

  chamarCliente: id => {
    const a = app.getAgendamentos().find(x => x.id === id);
    if (!a) return;
    const limpo = String(a.whatsapp || "").replace(/\D/g, "");
    const numero = limpo.startsWith("55") ? limpo : `55${limpo}`;
    
    let texto = "";
    if(a.status === "aprovado") {
      texto = `Olá ${a.nome}! Seu agendamento no BrunoJato foi *APROVADO*.%0A%0A✨ ${a.servico}%0A📅 ${a.data.split('-').reverse().join('/')} às ${a.hora}%0A💰 Restante no dia: ${app.moeda(a.restante)}.%0A%0AObrigado pela preferência!`;
    } else if (a.status === "cancelado") {
      texto = `Olá ${a.nome}. Seu agendamento no BrunoJato foi cancelado.%0AEntre em contato para reagendar.`;
    } else {
      texto = `Olá ${a.nome}! Recebemos sua solicitação no BrunoJato.%0A%0APara aprovar o agendamento, aguardamos o comprovante do sinal de ${app.moeda(a.entrada)}.%0A📅 ${a.data.split('-').reverse().join('/')} às ${a.hora}.`;
    }
    
    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
  },

  excluirAgendamento: id => {
    if (!confirm("Excluir definitivamente este registro?")) return;
    app.salvarAgendamentos(app.getAgendamentos().filter(a => a.id !== id));
    app.renderAdmin();
    app.toast("Registro excluído.", "success");
  },

  renderAdmin: () => {
    const lista = app.getAgendamentos().sort((a,b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    const busca = (app.getEl("busca")?.value || "").toLowerCase();
    const status = app.getEl("filtroStatus")?.value || "todos";
    const data = app.getEl("filtroData")?.value || "";

    const filtrada = lista.filter(a => {
      const texto = `${a.nome} ${a.whatsapp} ${a.veiculo} ${a.servico}`.toLowerCase();
      return (!busca || texto.includes(busca)) &&
             (status === "todos" || a.status === status) &&
             (!data || a.data === data);
    });

    const total = lista.length;
    const pendentes = lista.filter(a => a.status === "pendente").length;
    const aprovados = lista.filter(a => a.status === "aprovado").length;
    const receber = lista.filter(a => a.status === "aprovado").reduce((s,a) => s + Number(a.restante), 0);

    if (app.getEl("statTotal")) {
      app.getEl("statTotal").textContent = total;
      app.getEl("statPendentes").textContent = pendentes;
      app.getEl("statAprovados").textContent = aprovados;
      app.getEl("statReceber").textContent = app.moeda(receber);
    }

    const container = app.getEl("listaAgendamentos");
    if (!container) return;

    if (!filtrada.length) {
      container.innerHTML = `<div class="empty-state">Nenhum agendamento encontrado.</div>`;
      return;
    }

    container.innerHTML = filtrada.map(a => `
      <div class="appointment-card">
        <div class="apt-header">
          <div>
            <div class="apt-title">${a.nome}</div>
            <div class="apt-meta">Criado: ${a.criadoEm} ${a.atualizadoEm ? `| Modificado: ${a.atualizadoEm}` : ""}</div>
          </div>
          <span class="badge ${a.status}">${a.status}</span>
        </div>

        <div class="apt-details">
          <div><strong>WhatsApp:</strong><br>${a.whatsapp}</div>
          <div><strong>Veículo:</strong><br>${a.tipoVeiculo || "-"} / ${a.veiculo}</div>
          <div><strong>Serviço:</strong><br>${a.servico}</div>
          <div><strong>Data e Hora:</strong><br>${a.data.split('-').reverse().join('/')} às ${a.hora}</div>
          <div><strong>Valores:</strong><br>Total ${app.moeda(a.preco)} | Restante ${app.moeda(a.restante)}</div>
          <div><strong>Pgto & Obs:</strong><br>${a.pagamento} | ${a.observacoes || "-"}</div>
        </div>

        <div class="apt-actions">
          ${a.status === "pendente" ? `<button class="btn-sm-success" onclick="app.setStatus(${a.id}, 'aprovado')">Aprovar Pagamento</button>` : ""}
          ${a.status === "aprovado" ? `<button class="btn-sm-primary" onclick="app.setStatus(${a.id}, 'concluido')">Marcar Concluído</button>` : ""}
          ${a.status !== "cancelado" && a.status !== "concluido" ? `<button class="btn-sm-danger" onclick="app.setStatus(${a.id}, 'cancelado')">Cancelar</button>` : ""}
          <button class="btn-sm-warning" onclick="app.chamarCliente(${a.id})">WhatsApp Cliente</button>
          <button class="btn-outline" style="padding: 8px 16px; font-size: 13px;" onclick="app.excluirAgendamento(${a.id})">Excluir</button>
        </div>
      </div>
    `).join("");
  },

  exportarCSV: () => {
    const lista = app.getAgendamentos();
    if (!lista.length) return app.toast("Não há dados.", "error");

    const cabecalho = ["Nome", "WhatsApp", "Veículo", "Serviço", "Data", "Hora", "Total", "Entrada", "Restante", "Status", "Pagamento", "Observações"];
    const linhas = lista.map(a => [a.nome, a.whatsapp, `${a.tipoVeiculo || ""} ${a.veiculo}`, a.servico, a.data, a.hora, a.preco, a.entrada, a.restante, a.status, a.pagamento, a.observacoes]);
    const csv = [cabecalho, ...linhas].map(l => l.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brunojato-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
};

document.addEventListener("DOMContentLoaded", app.init);

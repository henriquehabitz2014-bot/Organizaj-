// ============================================================
// OrganizaJá v2 — app.js
// ============================================================

// ---- STATE ----
var estado = {
  tarefas: [],
  compras: [],
  habitos: [],
  metas: [],
  notas: [],
  transacoes: [],
  planejamento: {seg:[],ter:[],qua:[],qui:[],sex:[],sab:[],dom:[]},
  gratidao: [],
  humor: [],
  leitura: [],
  contagens: [],
  exercicios: [],
  lembretes: [],
  decisorOpcoes: [],
  revisao: {},
  frasesFav: [],
  aguaHoje: 0,
  aguaData: '',
  pomodorosHoje: 0,
  pomodorosData: '',
  pomodoroMin: 25,
  tema: 'claro',
  filtroTarefas: 'todas',
  filtroLeitura: 'todos',
  fraseAtual: 0,
  fraseAtualIdx: 0,
  // New v2 fields
  estudos: { materias: [], provas: [], trabalhos: [] },
  calView: 'mes',
  calMes: null,
  calAno: null,
  calSemanaStart: null,
  calDiaSel: null,
  calEventos: [],
  ordemTarefas: 'data',
  ordemTarefasDesc: false,
  senhas: [],
  despesas: [],
  orcamentoMes: 0,
  humorHoje: 0,
  humorData: '',
  exerciciosHoje: [],
  exerciciosData: '',
  notifConfig: {global:true, tarefas:1, provas:3, trabalhos:2, eventos:1, quietHours:{on:false, start:'22:00', end:'08:00'}},
  perfil: {nome:'', avatar:'', serie:''},
  plus: {ativo: false, expira: '', plano: '', inicio: '', cancelado: false, metodo: '', gatewayId: ''}
};

var modalCallback = null;
var pomoInterval = null;
var pomoSegundos = 25 * 60;
var pomoRodando = false;
var pomoPausa = false;
var pomoFocoMin = 25;
var pomoPausaMin = 5;
var calcValor = '0';
var calcOp = null;
var calcAnterior = null;
var calcReset = true;
var refeicoesSemana = ['seg','ter','qua','qui','sex','sab','dom'];
var refeicoesTipos = ['Café','Almoço','Lanche','Jantar'];
var calInterval = null;
var regressivaTimers = {};
var notifPermission = 'default';
var notifTimers = {};

// ---- FRASES ----
var frases = [
  {t:"A disciplina é a ponte entre objetivos e realizações.",a:"Jim Rohn"},
  {t:"O segredo de ir adiante é começar.",a:"Mark Twain"},
  {t:"Tudo parece impossível até que seja feito.",a:"Nelson Mandela"},
  {t:"A melhor hora para começar é agora.",a:"Provérbio"},
  {t:"Pequenos passos todos os dias levam a grandes resultados.",a:"Desconhecido"},
  {t:"Não espere por condições ideais. Faça com o que tem.",a:"Arthur Ashe"},
  {t:"A consistência supera o talento quando o talento não é consistente.",a:"Desconhecido"},
  {t:"Cada dia é uma nova chance de ser melhor do que ontem.",a:"Desconhecido"},
  {t:"Você não precisa ser perfeito. Precisa começar.",a:"Desconhecido"},
  {t:"A organização é a base da produtividade.",a:"Desconhecido"},
  {t:"Foque no que você pode controlar.",a:"Estoicismo"},
  {t:"O progresso, não a perfeição.",a:"Desconhecido"},
  {t:"Uma mente organizada é uma mente poderosa.",a:"Desconhecido"},
  {t:"A melhor forma de prever o futuro é criá-lo.",a:"Peter Drucker"},
  {t:"Sucesso é a soma de pequenos esforços repetidos.",a:"Robert Collier"},
  {t:"Não deixe para amanhã o que pode organizar hoje.",a:"Adaptação"},
  {t:"Simplicidade é o máximo da sofisticação.",a:"Leonardo da Vinci"},
  {t:"Planejar é poupar tempo.",a:"Desconhecido"},
  {t:"A motivação te faz começar. O hábito te faz continuar.",a:"Desconhecido"},
  {t:"A vida não acontece por acaso. Ela acontece por escolha.",a:"Desconhecido"}
];

var dicas = [
  "Divida tarefas grandes em pequenas etapas.",
  "Use Pomodoro: 25 min de foco, 5 de pausa.",
  "Revise suas metas toda semana.",
  "Anote 3 prioridades ao começar o dia.",
  "Beba água a cada Pomodoro completado.",
  "Reserve 5 min para planejar o dia seguinte.",
  "Menos apps, mais ação. Organize, não acumule.",
  "Marque tarefas como feitas ao final do dia — dá satisfação!",
  "Crie rotinas para tarefas repetitivas.",
  "Use categorias nas tarefas para se organizar melhor.",
  "Um hábito por vez. Não tude mudar tudo de uma vez.",
  "Descanse. Produtividade sem descanso vira exaustão."
];

var motivacoes = [
  "Você já fez mais do que imagina!",
  "Cada tarefa riscada é uma vitória.",
  "Se chegou até aqui, pode ir mais longe.",
  "O progresso é silencioso, mas real.",
  "Um passo de cada vez.",
  "Disciplina > Motivação.",
  "Hoje você escolhe tentar de novo."
];

var desafios = [
  "Complete 3 tarefas hoje.",
  "Faça um Pomodoro de 25 minutos.",
  "Beba 8 copos de água.",
  "Anote 1 coisa pela qual é grato.",
  "Organize sua lista de compras.",
  "Registre seus exercícios do dia.",
  "Planeie as refeições de amanhã.",
  "Faça a revisão semanal."
];

// ---- CATEGORIAS TAREFA ----
var catEmojis = {estudo:'📖',trabalho:'💼',pessoal:'🏠',saude:'💚',financas:'💰',outros:'📦'};
var catCores = {estudo:'#6c5ce7',trabalho:'#0984e3',pessoal:'#00b894',saude:'#e17055',financas:'#fdcb6e',outros:'#636e72'};

// ---- LOAD / SAVE ----
function carregarEstado() {
  try {
    var raw = localStorage.getItem('organizaja');
    if (raw) {
      var parsed = JSON.parse(raw);
      // Merge with defaults
      Object.keys(estado).forEach(function(k) {
        if (parsed[k] !== undefined) estado[k] = parsed[k];
      });
    }
  } catch(e) { console.warn('Erro ao carregar estado:', e); }

  // Migration: add missing fields
  estado.tarefas.forEach(function(t) {
    if (!t.data) t.data = '';
    if (!t.hora) t.hora = '';
    if (!t.categoria) t.categoria = '';
    if (!t.prio) t.prio = 'media';
    if (t.feito === undefined) t.feito = false;
  });
  estado.habitos.forEach(function(h) {
    if (!h.semanas) h.semanas = {};
  });
  estado.lembretes.forEach(function(l) {
    if (!l.data) l.data = '';
  });
  // Migration: metas — add new fields to existing items
  estado.metas.forEach(function(m) {
    if (!m.prazo) m.prazo = '';
    if (!m.descricao) m.descricao = '';
    if (m.progresso === undefined) m.progresso = m.feito ? 100 : 0;
    if (!m.categoria) m.categoria = 'pessoal';
    if (!m.criada) m.criada = '';
    if (!m.concluidaData) m.concluidaData = '';
    if (!m.xp) m.xp = 0;
  });
  if (!estado.metasXpTotal) estado.metasXpTotal = 0;
  if (!estado.metasStreak) estado.metasStreak = 0;
  if (!estado.metasStreakData) estado.metasStreakData = '';

  if (!estado.estudos) estado.estudos = { materias:[], provas:[], trabalhos:[] };
  if (!estado.estudos.materias) estado.estudos.materias = [];
  if (!estado.estudos.provas) estado.estudos.provas = [];
  if (!estado.estudos.trabalhos) estado.estudos.trabalhos = [];
  // Migration: add hora/conteudo to existing provas
  estado.estudos.provas.forEach(function(p) {
    if (!p.hora) p.hora = '';
    if (!p.conteudo) p.conteudo = '';
    if (p.concluido === undefined) p.concluido = false;
  });
  // Migration: add descricao/status/hora to existing trabalhos
  estado.estudos.trabalhos.forEach(function(tr) {
    if (!tr.descricao) tr.descricao = '';
    if (!tr.status) tr.status = 'pendente';
    if (!tr.hora) tr.hora = '';
    if (tr.concluido !== undefined) { delete tr.concluido; }
  });
  // Migration: add anotacoes/metaHoras to existing materias
  estado.estudos.materias.forEach(function(m) {
    if (!m.anotacoes) m.anotacoes = [];
    if (!m.metaHoras) m.metaHoras = 0;
    if (!m.id) m.id = uid();
  });
  if (!estado.calView) estado.calView = 'mes';
  if (!estado.calEventos) estado.calEventos = [];
  if (estado.calDiaSel === undefined) estado.calDiaSel = null;
  if (!estado.ordemTarefas) estado.ordemTarefas = 'data';
  if (estado.ordemTarefasDesc === undefined) estado.ordemTarefasDesc = false;
  var filtrosValidos = ['todas','hoje','amanha','semana','atrasadas','concluidas'];
  if (filtrosValidos.indexOf(estado.filtroTarefas) < 0) {
    estado.filtroTarefas = estado.filtroTarefas === 'feitas' ? 'concluidas' : 'todas';
  }
  migrarTarefas();

  // notifConfig migration
  if (!estado.notifConfig) {
    estado.notifConfig = {global:true, tarefas:1, provas:3, trabalhos:2, eventos:1, quietHours:{on:false, start:'22:00', end:'08:00'}};
  } else {
    if (estado.notifConfig.global === undefined) estado.notifConfig.global = true;
    if (estado.notifConfig.tarefas === undefined) estado.notifConfig.tarefas = 1;
    if (estado.notifConfig.provas === undefined) estado.notifConfig.provas = 3;
    if (estado.notifConfig.trabalhos === undefined) estado.notifConfig.trabalhos = 2;
    if (estado.notifConfig.eventos === undefined) estado.notifConfig.eventos = 1;
    if (!estado.notifConfig.quietHours) estado.notifConfig.quietHours = {on:false, start:'22:00', end:'08:00'};
  }

  // perfil migration
  if (!estado.perfil) estado.perfil = {nome:'', avatar:'', serie:''};
  if (estado.perfil.nome === undefined) estado.perfil.nome = '';
  if (estado.perfil.avatar === undefined) estado.perfil.avatar = '';
  if (estado.perfil.serie === undefined) estado.perfil.serie = '';

  // plus migration
  if (!estado.plus) estado.plus = {ativo: false, expira: '', plano: '', inicio: '', cancelado: false, metodo: '', gatewayId: ''};
  if (estado.plus.ativo === undefined) estado.plus.ativo = false;
  if (estado.plus.expira === undefined) estado.plus.expira = '';
  if (estado.plus.plano === undefined) estado.plus.plano = '';
  if (estado.plus.inicio === undefined) estado.plus.inicio = '';
  if (estado.plus.cancelado === undefined) estado.plus.cancelado = false;
  if (estado.plus.metodo === undefined) estado.plus.metodo = '';
  if (estado.plus.gatewayId === undefined) estado.plus.gatewayId = '';

  // per-item .lembrete migration
  var i;
  if (estado.tarefas) { for (i = 0; i < estado.tarefas.length; i++) { if (estado.tarefas[i].lembrete === undefined) estado.tarefas[i].lembrete = estado.notifConfig.tarefas; } }
  if (estado.estudos && estado.estudos.provas) { for (i = 0; i < estado.estudos.provas.length; i++) { if (estado.estudos.provas[i].lembrete === undefined) estado.estudos.provas[i].lembrete = estado.notifConfig.provas; } }
  if (estado.estudos && estado.estudos.trabalhos) { for (i = 0; i < estado.estudos.trabalhos.length; i++) { if (estado.estudos.trabalhos[i].lembrete === undefined) estado.estudos.trabalhos[i].lembrete = estado.notifConfig.trabalhos; } }
  if (estado.calEventos) { for (i = 0; i < estado.calEventos.length; i++) { if (estado.calEventos[i].lembrete === undefined) estado.calEventos[i].lembrete = estado.notifConfig.eventos; } }

  // Visit counter
  var v = parseInt(localStorage.getItem('oj_visits') || '0') + 1;
  localStorage.setItem('oj_visits', v);
  var d = new Date().toISOString().slice(0,10);
  var dv = localStorage.getItem('oj_visits_d');
  if (dv !== d) {
    var dd = parseInt(localStorage.getItem('oj_visits_d_c')||'0') + 1;
    localStorage.setItem('oj_visits_d', d);
    localStorage.setItem('oj_visits_d_c', dd);
  }
  var el = document.getElementById('visitNum');
  if (el) el.textContent = v;

  // Apoie banner
  if (localStorage.getItem('apoieBannerFechado') === 'sim') {
    var b = document.getElementById('apoieBanner');
    if (b) b.style.display = 'none';
  }

  salvarEstado();
}

function salvarEstado() {
  try {
    localStorage.setItem('organizaja', JSON.stringify(estado));
  } catch(e) { console.warn('Erro ao salvar:', e); }
}

// ---- NAVIGATION ----
var pageNames = {
  inicio:'Início', tarefas:'Tarefas', calendario:'Calendário',
  estudos:'Estudos', habitos:'Hábitos', progresso:'Meu Progresso', pomodoro:'Pomodoro',
  metas:'Metas', notas:'Notas', lembretes:'Lembretes',
  decisor:'Decisor', agua:'Água', exercicios:'Exercícios',
  humor:'Humor', gratidao:'Gratidão', refeicoes:'Refeições',
  orcamento:'Orçamento', compras:'Compras', planejamento:'Semanal',
  regressiva:'Regressiva', calculadora:'Calculadora', senhas:'Senhas',
  leitura:'Leitura', revisao:'Revisão', frases:'Frases', vida:'Painel da Vida', perfil:'Perfil',
  plus:'OrganizaJá Plus'
};

function navegarPara(pagina, btn) {
  // Close any open sheets
  fecharMoreSheet();

  // Brief page transition indicator
  var main = document.querySelector('.main-area');
  if (main) { main.style.opacity = '0.6'; main.style.transition = 'opacity .15s'; }
  setTimeout(function() { if (main) { main.style.opacity = '1'; } }, 150);

  // Switch page visibility
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('ativo'); });
  var target = document.getElementById('page-' + pagina);
  if (target) target.classList.add('ativo');

  // Update sidebar
  document.querySelectorAll('.sidebar-item').forEach(function(s) { s.classList.remove('ativo'); });
  var si = document.querySelector('.sidebar-item[data-page="' + pagina + '"]');
  if (si) si.classList.add('ativo');

  // Update bottombar
  document.querySelectorAll('.bottombar-item').forEach(function(b) { b.classList.remove('ativo'); });
  var bi = document.querySelector('.bottombar-item[data-page="' + pagina + '"]');
  if (bi) bi.classList.add('ativo');

  // Title
  var t = document.getElementById('topbarTitle');
  if (t) t.textContent = pageNames[pagina] || pagina;

  // Scroll to top of main
  var main = document.querySelector('.main-area');
  if (main) main.scrollTop = 0;
  window.scrollTo({top:0,behavior:'smooth'});

  // Render page content
  renderPage(pagina);

  // On mobile close sidebar if open
  closeSidebarOverlay();
}


// ---- THEME ----
function aplicarTema() {
  document.documentElement.setAttribute('data-tema', estado.tema);
  var btn = document.getElementById('temaBtn');
  if (btn) btn.textContent = estado.tema === 'escuro' ? '☀️' : '🌙';
}

function toggleTema() {
  estado.tema = estado.tema === 'escuro' ? 'claro' : 'escuro';
  aplicarTema();
  salvarEstado();
}

// ---- MODAL ----
function confirmar(msg, cb) {
  document.getElementById('modalMsg').textContent = msg;
  modalCallback = cb;
  document.getElementById('modalOverlay').classList.add('visivel');
}

function confirmarAcao() {
  document.getElementById('modalOverlay').classList.remove('visivel');
  if (modalCallback) modalCallback();
  modalCallback = null;
}

function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('visivel');
  modalCallback = null;
}

// ---- PIX ----
function abrirPix() {
  document.getElementById('pixModal').classList.add('ativo');
}
function fecharPix(e) {
  if (e.target === document.getElementById('pixModal')) document.getElementById('pixModal').classList.remove('ativo');
}
function fecharPixBtn() {
  document.getElementById('pixModal').classList.remove('ativo');
}
function copiarPix() {
  navigator.clipboard.writeText('henriquehabitz@gmail.com').then(function(){
    var b = document.querySelector('.pix-copiar');
    b.textContent = '✅ Copiado!';
    setTimeout(function(){ b.textContent = '📋 Copiar chave PIX'; }, 2000);
  });
}

// ---- BANNER ----
function fecharBannerApoie() {
  document.getElementById('apoieBanner').style.display = 'none';
  localStorage.setItem('apoieBannerFechado', 'sim');
}

// ---- INSTALL ----
var installPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  installPrompt = e;
  document.getElementById('instalarBanner').style.display = 'flex';
});
function instalarApp() {
  if (installPrompt) { installPrompt.prompt(); }
}

// ---- SEARCH ----
function abrirBusca() {
  document.getElementById('buscaOverlay').classList.add('visivel');
  document.getElementById('buscaInput').value = '';
  document.getElementById('buscaInput').focus();
}
function fecharBusca(e) {
  if (e.target === document.getElementById('buscaOverlay')) {
    document.getElementById('buscaOverlay').classList.remove('visivel');
  }
}
// ---- PESQUISA GLOBAL ----
var buscaScrollId = null; // id do item para scroll após navegação
var buscaHighlightTimer = null;

function buscarTudo(q) {
  var res = document.getElementById('buscaResultados');
  if (!q.trim()) { res.innerHTML = ''; return; }
  q = q.toLowerCase().trim();
  var categorias = [];

  // 1) Páginas / Ferramentas
  var paginas = [];
  Object.keys(pageNames).forEach(function(k) {
    if (pageNames[k].toLowerCase().indexOf(q) >= 0) {
      paginas.push({ slug: k, nome: pageNames[k] });
    }
  });
  var plusPages = ['plus','pomodoro','revisao','planejamento','progresso'];
  if (paginas.length) categorias.push({ icon: '🧭', titulo: 'Páginas', items: paginas.map(function(p) {
    var badge = (plusPages.indexOf(p.slug) >= 0) ? ' <span class="plus-badge-mini">PLUS</span>' : '';
    return { id: '__page__' + p.slug, texto: p.nome + badge, acao: "navegarPara('" + esc(p.slug) + "')" };
  })});

  // 2) Tarefas
  var tarefas = estado.tarefas.filter(function(t) {
    return t.texto.toLowerCase().indexOf(q) >= 0;
  });
  if (tarefas.length) categorias.push({ icon: '✅', titulo: 'Tarefas (' + tarefas.length + ')', items: tarefas.map(function(t) {
    return { id: t.id, texto: t.texto, sub: t.data ? dataLocal(t.data) : '', acao: "buscarIrPara('tarefas','" + t.id + "')" };
  })});

  // 3) Provas
  var provas = (estado.estudos && estado.estudos.provas) ? estado.estudos.provas.filter(function(p) {
    return p.texto.toLowerCase().indexOf(q) >= 0 || (p.materia && p.materia.toLowerCase().indexOf(q) >= 0) || (p.conteudo && p.conteudo.toLowerCase().indexOf(q) >= 0);
  }) : [];
  if (provas.length) categorias.push({ icon: '📝', titulo: 'Provas (' + provas.length + ')', items: provas.map(function(p) {
    return { id: p.id, texto: p.texto, sub: p.materia || '', acao: "buscarIrPara('estudos','" + p.id + "')" };
  })});

  // 4) Trabalhos
  var trabalhos = (estado.estudos && estado.estudos.trabalhos) ? estado.estudos.trabalhos.filter(function(tr) {
    return tr.texto.toLowerCase().indexOf(q) >= 0 || (tr.materia && tr.materia.toLowerCase().indexOf(q) >= 0) || (tr.descricao && tr.descricao.toLowerCase().indexOf(q) >= 0);
  }) : [];
  if (trabalhos.length) categorias.push({ icon: '📄', titulo: 'Trabalhos (' + trabalhos.length + ')', items: trabalhos.map(function(tr) {
    return { id: tr.id, texto: tr.texto, sub: tr.materia || '', acao: "buscarIrPara('estudos','" + tr.id + "')" };
  })});

  // 5) Matérias
  var materias = (estado.estudos && estado.estudos.materias) ? estado.estudos.materias.filter(function(m) {
    return m.nome.toLowerCase().indexOf(q) >= 0;
  }) : [];
  if (materias.length) categorias.push({ icon: '📚', titulo: 'Matérias (' + materias.length + ')', items: materias.map(function(m) {
    return { id: m.id, texto: m.nome, sub: '', acao: "buscarIrPara('estudos','" + m.id + "')" };
  })});

  // 6) Eventos do calendário
  var eventos = (estado.calEventos || []).filter(function(c) {
    return c.titulo.toLowerCase().indexOf(q) >= 0 || (c.descricao && c.descricao.toLowerCase().indexOf(q) >= 0) || (c.materia && c.materia.toLowerCase().indexOf(q) >= 0);
  });
  if (eventos.length) categorias.push({ icon: '📅', titulo: 'Eventos (' + eventos.length + ')', items: eventos.map(function(c) {
    return { id: c.id, texto: c.titulo, sub: c.data ? dataLocal(c.data) : '', acao: "buscarIrPara('calendario','" + c.id + "')" };
  })});

  // 7) Anotações (notas)
  var notas = estado.notas.filter(function(n) {
    return (n.titulo && n.titulo.toLowerCase().indexOf(q) >= 0) || (n.texto && n.texto.toLowerCase().indexOf(q) >= 0);
  });
  if (notas.length) categorias.push({ icon: '📝', titulo: 'Notas (' + notas.length + ')', items: notas.map(function(n) {
    return { id: n.id, texto: n.titulo || 'Sem título', sub: n.texto ? n.texto.substring(0, 50) : '', acao: "buscarIrPara('notas','" + n.id + "')" };
  })});

  // 8) Metas
  var metas = estado.metas.filter(function(m) {
    return m.texto.toLowerCase().indexOf(q) >= 0 || (m.descricao && m.descricao.toLowerCase().indexOf(q) >= 0);
  });
  if (metas.length) categorias.push({ icon: '🎯', titulo: 'Metas (' + metas.length + ')', items: metas.map(function(m) {
    return { id: m.id, texto: m.texto, sub: m.prazo ? dataLocal(m.prazo) : '', acao: "buscarIrPara('metas','" + m.id + "')" };
  })});

  // 9) Hábitos
  var habitos = estado.habitos.filter(function(h) {
    return h.nome.toLowerCase().indexOf(q) >= 0;
  });
  if (habitos.length) categorias.push({ icon: '🔄', titulo: 'Hábitos (' + habitos.length + ')', items: habitos.map(function(h) {
    return { id: h.id, texto: h.nome, sub: '', acao: "buscarIrPara('habitos','" + h.id + "')" };
  })});

  // 10) Lembretes
  var lembretes = estado.lembretes.filter(function(l) {
    return l.texto.toLowerCase().indexOf(q) >= 0;
  });
  if (lembretes.length) categorias.push({ icon: '🔔', titulo: 'Lembretes (' + lembretes.length + ')', items: lembretes.map(function(l) {
    return { id: l.id, texto: l.texto, sub: l.data ? dataLocal(l.data) : '', acao: "buscarIrPara('lembretes','" + l.id + "')" };
  })});

  // Montar HTML
  var html = '';
  if (!categorias.length) {
    html = '<div class="busca-vazio">🔍 Nenhum resultado para "' + esc(q) + '"</div>';
  } else {
    categorias.forEach(function(cat) {
      html += '<div class="busca-cat">';
      html += '<div class="busca-cat-header">' + cat.icon + ' ' + esc(cat.titulo) + '</div>';
      cat.items.forEach(function(item) {
        html += '<div class="busca-item" onclick="' + item.acao + ';fecharBusca({target:document.getElementById(\'buscaOverlay\')})">';
        html += '<div class="busca-item-texto">' + esc(item.texto) + '</div>';
        if (item.sub) html += '<small>' + esc(item.sub) + '</small>';
        html += '</div>';
      });
      html += '</div>';
    });
    var total = categorias.reduce(function(s, c) { return s + c.items.length; }, 0);
    html += '<div class="busca-total">' + total + ' resultado' + (total !== 1 ? 's' : '') + '</div>';
  }
  res.innerHTML = html;
}

function buscarIrPara(pagina, itemId) {
  buscaScrollId = itemId;
  navegarPara(pagina);
  // After page renders, try scrolling to item
  setTimeout(function() { buscaScrollEHighlight(itemId); }, 150);
}

function buscaScrollEHighlight(itemId) {
  // Scroll to element with matching id or data-id
  var el = document.getElementById(itemId) || document.querySelector('[data-id="' + itemId + '"]');
  if (!el) {
    // Try finding inside rendered cards by data-id attribute
    el = document.querySelector('[data-busca-id="' + itemId + '"]');
  }
  if (!el) {
    // Fallback: search for the item text inside cards and try matching
    // This handles cases where items don't have explicit IDs in DOM
    return;
  }
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('busca-highlight');
    if (buscaHighlightTimer) clearTimeout(buscaHighlightTimer);
    buscaHighlightTimer = setTimeout(function() {
      el.classList.remove('busca-highlight');
    }, 2500);
  }
}

// ---- SIDEBAR MOBILE TOGGLE ----
function toggleSidebar() {
  var sb = document.getElementById('sidebar');
  if (sb.classList.contains('aberto')) {
    closeSidebarOverlay();
  } else {
    sb.classList.add('aberto');
    if (!document.getElementById('sidebarOverlay')) {
      var ov = document.createElement('div');
      ov.id = 'sidebarOverlay';
      ov.className = 'sidebar-overlay';
      ov.onclick = closeSidebarOverlay;
      document.querySelector('.app-layout').appendChild(ov);
    }
    document.getElementById('sidebarOverlay').classList.add('visivel');
  }
}
function closeSidebarOverlay() {
  var sb = document.getElementById('sidebar');
  if (sb) sb.classList.remove('aberto');
  var ov = document.getElementById('sidebarOverlay');
  if (ov) ov.classList.remove('visivel');
}
function toggleSidebarTools() {
  var p = document.getElementById('sidebarTools');
  if (p) p.classList.toggle('aberto');
}

// ---- MORE SHEET (mobile) ----
function toggleMoreSheet() {
  var s = document.getElementById('moreSheet');
  if (s.classList.contains('aberto')) fecharMoreSheet();
  else s.classList.add('aberto');
}
function fecharMoreSheet() {
  var s = document.getElementById('moreSheet');
  if (s) s.classList.remove('aberto');
}

// ---- NOTIFICATIONS ----
function initNotificacoes() {
  if ('Notification' in window) {
    notifPermission = Notification.permission;
    if (notifPermission === 'default') {
      Notification.requestPermission().then(function(p) { notifPermission = p; });
    }
  }
  scheduleAllNotificacoes();
}

function isQuietHours() {
  if (!estado.notifConfig || !estado.notifConfig.quietHours || !estado.notifConfig.quietHours.on) return false;
  var qh = estado.notifConfig.quietHours;
  var agora = new Date();
  var mins = agora.getHours() * 60 + agora.getMinutes();
  var sp = qh.start.split(':');
  var sMins = parseInt(sp[0]) * 60 + parseInt(sp[1]);
  var ep = qh.end.split(':');
  var eMins = parseInt(ep[0]) * 60 + parseInt(ep[1]);
  if (sMins > eMins) {
    return (mins >= sMins || mins < eMins);
  }
  return (mins >= sMins && mins < eMins);
}

function quietHoursEndMs() {
  if (!estado.notifConfig || !estado.notifConfig.quietHours) return 0;
  var qh = estado.notifConfig.quietHours;
  var agora = new Date();
  var ep = qh.end.split(':');
  var endH = parseInt(ep[0]);
  var endM = parseInt(ep[1]);
  var end = new Date(agora);
  end.setHours(endH, endM, 0, 0);
  if (end <= agora) end.setDate(end.getDate() + 1);
  return end.getTime() - agora.getTime();
}

function notifDedup(key) {
  var last = sessionStorage.getItem('oj_notif_' + key);
  if (last && (Date.now() - parseInt(last)) < 1800000) return true; // 30min dedup
  sessionStorage.setItem('oj_notif_' + key, String(Date.now()));
  return false;
}

function enviarNotificacaoDedup(titulo, corpo, key) {
  if (notifDedup(key)) return;
  if (isQuietHours()) {
    var delay = quietHoursEndMs();
    if (delay > 0 && delay < 86400000) {
      notifTimers[key + '_qh'] = setTimeout(function() {
        enviarNotificacao(titulo, corpo);
      }, delay);
    }
    return;
  }
  enviarNotificacao(titulo, corpo);
}

function scheduleAllNotificacoes() {
  // Clear existing timers
  Object.keys(notifTimers).forEach(function(k) {
    clearTimeout(notifTimers[k]);
  });
  notifTimers = {};

  // Check global toggle
  if (!estado.notifConfig || !estado.notifConfig.global) return;

  var agora = Date.now();
  var DIA = 86400000;

  // Lembretes
  estado.lembretes.forEach(function(l) {
    if (!l.ativo) return;
    var dtStr = (l.data ? l.data + 'T' : hojeStr() + 'T') + (l.hora || '09:00');
    var dt = new Date(dtStr).getTime();
    var diff = dt - agora;
    if (diff > 0 && diff < DIA) {
      notifTimers['lembrete_' + l.id] = setTimeout(function() {
        enviarNotificacaoDedup('Lembrete', l.texto, 'lembrete_' + l.id);
      }, diff);
    }
  });

  // Tarefas with date/time
  estado.tarefas.forEach(function(t) {
    if (t.feito || !t.data || t.lembrete < 0) return;
    var dtStr = t.data + 'T' + (t.hora || '09:00');
    var dt = new Date(dtStr).getTime();
    var reminderTime = dt - (t.lembrete * DIA);
    var diff = reminderTime - agora;
    if (diff > 0 && diff < DIA * 4) {
      notifTimers['tarefa_' + t.id] = setTimeout(function() {
        enviarNotificacaoDedup('Tarefa: ' + t.texto, 'Vence ' + (t.lembrete === 0 ? 'hoje' : 'em ' + t.lembrete + ' dia(s)'), 'tarefa_' + t.id);
      }, diff);
    }
  });

  // Provas
  if (estado.estudos && estado.estudos.provas) {
    estado.estudos.provas.forEach(function(p) {
      if (!p.data || p.lembrete < 0) return;
      var dt = new Date(p.data + 'T' + (p.hora || '09:00')).getTime();
      var reminderTime = dt - (p.lembrete * DIA);
      var diff = reminderTime - agora;
      if (diff > 0 && diff < DIA * 4) {
        notifTimers['prova_' + p.id] = setTimeout(function() {
          enviarNotificacaoDedup('Prova: ' + p.texto, (p.lembrete === 0 ? 'Hoje' : 'Em ' + p.lembrete + ' dia(s)') + ' — ' + p.materia, 'prova_' + p.id);
        }, diff);
      }
    });
  }

  // Trabalhos
  if (estado.estudos && estado.estudos.trabalhos) {
    estado.estudos.trabalhos.forEach(function(tb) {
      if (!tb.data || tb.status === 'Concluído' || tb.lembrete < 0) return;
      var dt = new Date(tb.data + 'T' + (tb.hora || '23:59')).getTime();
      var reminderTime = dt - (tb.lembrete * DIA);
      var diff = reminderTime - agora;
      if (diff > 0 && diff < DIA * 4) {
        notifTimers['trabalho_' + tb.id] = setTimeout(function() {
          enviarNotificacaoDedup('Trabalho: ' + tb.texto, (tb.lembrete === 0 ? 'Vence hoje' : 'Vence em ' + tb.lembrete + ' dia(s)') + ' — ' + tb.materia, 'trabalho_' + tb.id);
        }, diff);
      }
    });
  }

  // CalEventos
  if (estado.calEventos) {
    estado.calEventos.forEach(function(ev) {
      if (!ev.data || ev.lembrete < 0) return;
      var dt = new Date(ev.data + 'T' + (ev.hora || '09:00')).getTime();
      var reminderTime = dt - (ev.lembrete * DIA);
      var diff = reminderTime - agora;
      if (diff > 0 && diff < DIA * 4) {
        notifTimers['evento_' + ev.id] = setTimeout(function() {
          enviarNotificacaoDedup('Evento: ' + ev.titulo, (ev.lembrete === 0 ? 'Hoje' : 'Em ' + ev.lembrete + ' dia(s)'), 'evento_' + ev.id);
        }, diff);
      }
    });
  }
}

function scheduleLembretes() { scheduleAllNotificacoes(); }

function enviarNotificacao(titulo, corpo) {
  if (notifPermission === 'granted') {
    new Notification(titulo, { body: corpo, icon: 'icon-192.png' });
  }
}

// ---- HELPERS ----
function hojeStr() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function dataLocal(str) {
  if (!str) return '';
  var pts = str.split('-');
  if (pts.length !== 3) return str;
  return pts[2] + '/' + pts[1] + '/' + pts[0];
}

function eAtrasada(t) {
  if (t.feito || !t.data) return false;
  var hoje = hojeStr();
  return t.data < hoje;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function esc(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function getSemanaKey() {
  var d = new Date();
  var onejan = new Date(d.getFullYear(),0,1);
  var wk = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return d.getFullYear() + '-S' + wk;
}

function getDiaSemana() {
  return new Date().getDay(); // 0=dom ... 6=sab
}

function calcularStreak(habito) {
  var streak = 0;
  var d = new Date();
  for (var i = 0; i < 365; i++) {
    var onejan = new Date(d.getFullYear(), 0, 1);
    var wk = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    var key = d.getFullYear() + '-S' + wk;
    var diaIdx = d.getDay(); // 0=dom
    var arr = habito.semanas[key];
    if (arr && arr[diaIdx]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function progressoSemanaHabito(habito) {
  var key = getSemanaKey();
  var arr = habito.semanas[key] || [false,false,false,false,false,false,false];
  var total = 0;
  arr.forEach(function(v) { if (v) total++; });
  return { feitos: total, total: 7, pct: Math.round(total/7*100) };
}

// ============================================================
// PART 2: Dashboard, Tarefas, Calendário, Estudos, Hábitos
// ============================================================

// ---- DASHBOARD ----
function renderDashboard() {
  // === SAUDAÇÃO ===
  var h = new Date().getHours();
  var greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  var nome = estado.perfil && estado.perfil.nome ? estado.perfil.nome : '';
  document.getElementById('dashGreeting').textContent = greet + (nome ? ', ' + nome : '') + '! 👋';

  // === DATA ===
  var dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var d = new Date();
  document.getElementById('dashDate').textContent = dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()];

  // === STATUS HERO ===
  var hoje = hojeStr();
  var tarefasHoje = estado.tarefas.filter(function(t){return !t.feito && t.data === hoje});
  var atrasadas = estado.tarefas.filter(eAtrasada);
  var pomos = (estado.pomodorosData === hoje) ? estado.pomodorosHoje : 0;
  var agua = (estado.aguaData === hoje) ? estado.aguaHoje : 0;

  var statusText = '';
  if (atrasadas.length > 0) {
    statusText = '<span class="dhs-alert">' + atrasadas.length + ' atrasada' + (atrasadas.length > 1 ? 's' : '') + '</span>';
  } else if (tarefasHoje.length === 0) {
    statusText = '<span class="dhs-ok">Tudo em dia ✨</span>';
  } else {
    statusText = '<span class="dhs-normal">' + tarefasHoje.length + ' tarefa' + (tarefasHoje.length > 1 ? 's' : '') + ' hoje</span>';
  }
  document.getElementById('dashHeroStatus').innerHTML = statusText;

  // === CARDS ===
  var feitasHoje = estado.tarefas.filter(function(t){return t.feito && t.data === hoje}).length;
  var cards = '';
  cards += '<div class="dash-card dc-tarefas"><span class="dc-num">' + tarefasHoje.length + '</span><span class="dc-label">Tarefas hoje</span></div>';
  if (atrasadas.length > 0) {
    cards += '<div class="dash-card dc-atrasadas"><span class="dc-num">' + atrasadas.length + '</span><span class="dc-label">Atrasadas</span></div>';
  }
  cards += '<div class="dash-card dc-feitas"><span class="dc-num">' + feitasHoje + '</span><span class="dc-label">Concluídas</span></div>';
  cards += '<div class="dash-card dc-pomo"><span class="dc-num">' + pomos + '</span><span class="dc-label">Pomodoros</span></div>';
  cards += '<div class="dash-card dc-agua"><span class="dc-num">' + agua + '/8</span><span class="dc-label">Copos de água</span></div>';
  document.getElementById('dashCards').innerHTML = cards;

  // === TAREFAS DE HOJE ===
  document.getElementById('dashTarefasCount').textContent = tarefasHoje.length ? '(' + tarefasHoje.length + ')' : '';
  var htmlTh = '';
  tarefasHoje.forEach(function(t) {
    var catE = catEmojis[t.categoria] || '';
    var prioC = t.prio === 'alta' ? 'prio-alta' : t.prio === 'baixa' ? 'prio-baixa' : '';
    htmlTh += '<div class="dash-tarefa-item ' + prioC + '">';
    htmlTh += '<div class="dt-check" onclick="dashToggleTarefa(\''+t.id+'\')">' + (t.feito ? '✅' : '⬜') + '</div>';
    htmlTh += '<div class="dt-body">';
    htmlTh += '<div class="dt-texto">' + catE + ' ' + esc(t.texto) + '</div>';
    if (t.hora) htmlTh += '<div class="dt-meta">' + t.hora + '</div>';
    htmlTh += '</div>';
    htmlTh += '</div>';
  });
  if (!htmlTh) htmlTh = '<div class="dash-empty">Nenhuma tarefa para hoje 🎉</div>';
  document.getElementById('dashTarefasHoje').innerHTML = htmlTh;

  // === ATRASADAS ===
  var atrArr = estado.tarefas.filter(eAtrasada);
  document.getElementById('dashAtrasadasCount').textContent = atrArr.length ? '(' + atrArr.length + ')' : '';
  var htmlAtr = '';
  atrArr.forEach(function(t) {
    htmlAtr += '<div class="dash-tarefa-item prio-alta">';
    htmlAtr += '<div class="dt-check" onclick="dashToggleTarefa(\''+t.id+'\')">⬜</div>';
    htmlAtr += '<div class="dt-body">';
    htmlAtr += '<div class="dt-texto">🚨 ' + esc(t.texto) + '</div>';
    htmlAtr += '<div class="dt-meta dt-meta-alert">venceu ' + dataLocal(t.data) + '</div>';
    htmlAtr += '</div>';
    htmlAtr += '</div>';
  });
  if (!htmlAtr) {
    document.getElementById('dashAtrasadasSection').style.display = 'none';
  } else {
    document.getElementById('dashAtrasadasSection').style.display = '';
    document.getElementById('dashAtrasadas').innerHTML = htmlAtr;
  }

  // === PRÓXIMA PROVA ===
  var provasFuturas = (estado.estudos && estado.estudos.provas) ? estado.estudos.provas.filter(function(p){return p.data && p.data >= hoje}).sort(function(a,b){return a.data.localeCompare(b.data)}) : [];
  var htmlProva = '';
  if (provasFuturas.length > 0) {
    var p = provasFuturas[0];
    var diasRest = Math.ceil((new Date(p.data + 'T12:00:00') - new Date()) / 86400000);
    var corMat = (estado.estudos.materias.find(function(m){return m.nome===p.materia})||{}).cor || 'var(--cor2)';
    var urgente = diasRest <= 3;
    htmlProva += '<div class="duc-evento' + (urgente ? ' duc-urgente' : '') + '" style="border-left:3px solid ' + corMat + '">';
    htmlProva += '<div class="duce-nome">' + esc(p.texto) + (p.materia ? ' <small>(' + esc(p.materia) + ')</small>' : '') + '</div>';
    if (p.hora) htmlProva += '<div class="duce-hora">🕐 ' + esc(p.hora) + '</div>';
    if (p.conteudo) htmlProva += '<div class="duce-extra">📋 ' + esc(p.conteudo) + '</div>';
    htmlProva += '<div class="duce-data' + (urgente ? ' duce-data-alert' : '') + '">em ' + diasRest + ' dia' + (diasRest !== 1 ? 's' : '') + ' · ' + dataLocal(p.data) + '</div>';
    htmlProva += '</div>';
    if (provasFuturas.length > 1) {
      htmlProva += '<div class="duc-mais">+' + (provasFuturas.length - 1) + ' mais</div>';
    }
  } else {
    htmlProva = '<div class="duc-empty">Nenhuma prova registrada</div>';
  }
  document.getElementById('dashProximaProvaBody').innerHTML = htmlProva;

  // === PRÓXIMO TRABALHO ===
  var trabsFuturos = (estado.estudos && estado.estudos.trabalhos) ? estado.estudos.trabalhos.filter(function(tr){return tr.data && tr.data >= hoje && tr.status !== 'concluido'}).sort(function(a,b){return a.data.localeCompare(b.data)}) : [];
  var htmlTrab = '';
  if (trabsFuturos.length > 0) {
    var tr = trabsFuturos[0];
    var diasTr = Math.ceil((new Date(tr.data + 'T12:00:00') - new Date()) / 86400000);
    var urgTr = diasTr <= 3;
    var corMatTr = (estado.estudos.materias.find(function(m){return m.nome===tr.materia})||{}).cor || 'var(--azul)';
    var statusIcon = statusTrabIcons[tr.status] || '⏳';
    htmlTrab += '<div class="duc-evento' + (urgTr ? ' duc-urgente' : '') + '" style="border-left:3px solid ' + corMatTr + '">';
    htmlTrab += '<div class="duce-nome">' + esc(tr.texto) + (tr.materia ? ' <small>(' + esc(tr.materia) + ')</small>' : '') + '</div>';
    htmlTrab += '<div class="duce-status">' + statusIcon + ' ' + esc(tr.status.charAt(0).toUpperCase() + tr.status.slice(1)) + '</div>';
    if (tr.descricao) htmlTrab += '<div class="duce-extra">📋 ' + esc(tr.descricao) + '</div>';
    htmlTrab += '<div class="duce-data' + (urgTr ? ' duce-data-alert' : '') + '">em ' + diasTr + ' dia' + (diasTr !== 1 ? 's' : '') + ' · ' + dataLocal(tr.data) + '</div>';
    htmlTrab += '</div>';
    if (trabsFuturos.length > 1) {
      htmlTrab += '<div class="duc-mais">+' + (trabsFuturos.length - 1) + ' mais</div>';
    }
  } else {
    htmlTrab = '<div class="duc-empty">Nenhum trabalho pendente</div>';
  }
  document.getElementById('dashProximoTrabalhoBody').innerHTML = htmlTrab;

  // === PRÓXIMO COMPROMISSO ===
  var compromissos = [];
  estado.tarefas.filter(function(t){return !t.feito && t.data && t.data >= hoje}).forEach(function(t){
    compromissos.push({texto:t.texto, data:t.data, hora:t.hora, icon:catEmojis[t.categoria]||'📌', tipo:'tarefa'});
  });
  estado.lembretes.filter(function(l){return l.ativo && l.data && l.data >= hoje}).forEach(function(l){
    compromissos.push({texto:l.texto, data:l.data, hora:l.hora, icon:'🔔', tipo:'lembrete'});
  });
  compromissos.sort(function(a,b){return (a.data+(a.hora||'')).localeCompare(b.data+(b.hora||''));});
  var htmlComp = '';
  if (compromissos.length > 0) {
    var c = compromissos[0];
    var diasC = Math.ceil((new Date(c.data) - new Date()) / 86400000);
    var labelC = diasC === 0 ? 'Hoje' : diasC === 1 ? 'Amanhã' : 'em ' + diasC + ' dias';
    htmlComp += '<div class="dash-comp-item">';
    htmlComp += '<div class="dci-icon">' + c.icon + '</div>';
    htmlComp += '<div class="dci-body">';
    htmlComp += '<div class="dci-texto">' + esc(c.texto) + '</div>';
    htmlComp += '<div class="dci-meta">' + labelC + (c.hora ? ' · ' + c.hora : '') + '</div>';
    htmlComp += '</div>';
    htmlComp += '</div>';
    if (compromissos.length > 1) {
      htmlComp += '<div class="duc-mais" onclick="navegarPara(\'calendario\')">+' + (compromissos.length - 1) + ' mais →</div>';
    }
  } else {
    htmlComp = '<div class="dash-empty">Nenhum compromisso próximo</div>';
  }
  document.getElementById('dashProximoCompromisso').innerHTML = htmlComp;

  // === HÁBITOS DE HOJE ===
  var diaIdx = getDiaSemana();
  var sk = getSemanaKey();
  var htmlHab = '';
  estado.habitos.forEach(function(h) {
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    var feito = arr[diaIdx];
    htmlHab += '<div class="dash-habito-item ' + (feito ? 'feito' : '') + '" onclick="toggleHabitoDash(\''+h.id+'\')">';
    htmlHab += '<div class="dh-check">' + (feito ? '✅' : '⬜') + '</div>';
    htmlHab += '<div class="dh-body">';
    htmlHab += '<div class="dh-texto">' + (h.emoji||'✨') + ' ' + esc(h.nome) + '</div>';
    htmlHab += '</div>';
    htmlHab += '</div>';
  });
  if (!htmlHab) htmlHab = '<div class="dash-empty">Nenhum hábito criado ainda</div>';
  document.getElementById('dashHabitosHoje').innerHTML = htmlHab;

  // === PROGRESSO DA SEMANA ===
  var sk2 = getSemanaKey();
  var semanaTotal = estado.tarefas.filter(function(t){return t.data}).length;
  var semanaFeitas = estado.tarefas.filter(function(t){return t.feito && t.data}).length;
  var semanaPct = semanaTotal ? Math.round(semanaFeitas / semanaTotal * 100) : 0;
  var habitosFeitosSemana = 0;
  var habitosTotalSemana = estado.habitos.length * 7;
  estado.habitos.forEach(function(h){
    var arr = h.semanas[sk2]||[];
    arr.forEach(function(v){if(v)habitosFeitosSemana++;});
  });
  var habPct = habitosTotalSemana ? Math.round(habitosFeitosSemana / habitosTotalSemana * 100) : 0;
  var provasFeitas = (estado.estudos && estado.estudos.provas) ? estado.estudos.provas.filter(function(p){return p.concluido}).length : 0;
  var provasTotal = (estado.estudos && estado.estudos.provas) ? estado.estudos.provas.length : 0;
  var aguaSemana = 0;
  var aguaDias = 0;
  // Simple: just show today's water
  var aguaPct = Math.round(agua / 8 * 100);

  var htmlProg = '';
  htmlProg += '<div class="dp-item">';
  htmlProg += '<div class="dp-head"><span class="dp-label">Tarefas concluídas</span><span class="dp-val">' + semanaPct + '%</span></div>';
  htmlProg += '<div class="dp-bar"><div class="dp-fill" style="width:' + semanaPct + '%"></div></div>';
  htmlProg += '</div>';
  htmlProg += '<div class="dp-item">';
  htmlProg += '<div class="dp-head"><span class="dp-label">Hábitos da semana</span><span class="dp-val">' + habPct + '%</span></div>';
  htmlProg += '<div class="dp-bar"><div class="dp-fill dp-fill-alt" style="width:' + habPct + '%"></div></div>';
  htmlProg += '</div>';
  htmlProg += '<div class="dp-item">';
  htmlProg += '<div class="dp-head"><span class="dp-label">Água hoje</span><span class="dp-val">' + agua + '/8</span></div>';
  htmlProg += '<div class="dp-bar"><div class="dp-fill dp-fill-agua" style="width:' + aguaPct + '%"></div></div>';
  htmlProg += '</div>';
  htmlProg += '<div class="dp-item">';
  htmlProg += '<div class="dp-head"><span class="dp-label">Pomodoros hoje</span><span class="dp-val">' + pomos + '</span></div>';
  htmlProg += '<div class="dp-bar"><div class="dp-fill dp-fill-pomo" style="width:' + Math.min(pomos * 20, 100) + '%"></div></div>';
  htmlProg += '</div>';
  document.getElementById('dashProgressoSemana').innerHTML = htmlProg;

  // Dicas
  novaDica(); novaMotivacao(); novoDesafio();
}

function dashToggleTarefa(id) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (t) { t.feito = !t.feito; salvarEstado(); renderDashboard(); }
}

function dashQuickProva() {
  var txt = prompt('Nome da prova:');
  if (!txt || !txt.trim()) return;
  var mat = prompt('Matéria (opcional):') || '';
  var data = prompt('Data (AAAA-MM-DD):') || '';
  estado.estudos.provas.push({texto:txt.trim(), materia:mat.trim(), data:data.trim(), id:uid()});
  salvarEstado(); renderDashboard();
}

function dashQuickTrabalho() {
  var txt = prompt('Nome do trabalho:');
  if (!txt || !txt.trim()) return;
  var mat = prompt('Matéria (opcional):') || '';
  var data = prompt('Data (AAAA-MM-DD):') || '';
  estado.estudos.trabalhos.push({texto:txt.trim(), materia:mat.trim(), data:data.trim(), id:uid()});
  salvarEstado(); renderDashboard();
}

function dashQuickTarefa() {
  var txt = prompt('Nova tarefa:');
  if (!txt || !txt.trim()) return;
  estado.tarefas.push({texto:txt.trim(), prio:'media', feito:false, id:uid(), data:hojeStr(), hora:'', categoria:''});
  salvarEstado(); renderDashboard();
}

function dashQuickEvento() {
  navegarPara('lembretes');
}

function toggleHabitoDash(id) {
  var h = estado.habitos.find(function(x){return x.id===id;});
  if (!h) return;
  var sk = getSemanaKey();
  var diaIdx = getDiaSemana();
  if (!h.semanas[sk]) h.semanas[sk] = [false,false,false,false,false,false,false];
  h.semanas[sk][diaIdx] = !h.semanas[sk][diaIdx];
  salvarEstado();
  renderDashboard();
}


function novaDica() { document.getElementById('dicaTexto').textContent = dicas[Math.floor(Math.random()*dicas.length)]; }
function novaMotivacao() { document.getElementById('motivacaoTexto').textContent = motivacoes[Math.floor(Math.random()*motivacoes.length)]; }
function novoDesafio() { document.getElementById('desafioTexto').textContent = desafios[Math.floor(Math.random()*desafios.length)]; }

// ---- TAREFAS ----
var tarefaEditId = null;
var tarefaUndo = null;
var tarefaUndoTimer = null;
var tarefasAbertas = {};
var tkPrioVal = {alta:0, media:1, baixa:2};
var tkStatusVal = {fazendo:0, pendente:1, concluida:2};
var tkStatusLabel = {pendente:'⏳ Pendente', fazendo:'🔄 Fazendo', concluida:'✅ Concluída'};
var tkPrioLabel = {alta:'🔴 Alta', media:'🟡 Média', baixa:'🟢 Baixa'};

function tkVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}

function tkSet(id, v) {
  var el = document.getElementById(id);
  if (el) el.value = v;
}

function amanhaStr() {
  var d = new Date();
  d.setDate(d.getDate() + 1);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function fimSemanaStr() {
  var d = new Date();
  var dias = 6 - d.getDay();
  if (dias < 0) dias = 0;
  d.setDate(d.getDate() + dias);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function tkNorm(t) {
  if (t.titulo && !t.texto) t.texto = t.titulo;
  if (t.descricao === undefined) t.descricao = '';
  if (t.materia === undefined) t.materia = '';
  if (t.obs === undefined) t.obs = '';
  if (!t.prio) t.prio = 'media';
  if (t.data === undefined) t.data = '';
  if (t.hora === undefined) t.hora = '';
  if (t.categoria === undefined) t.categoria = '';
  if (t.feito === undefined) t.feito = false;
  if (!t.status) t.status = t.feito ? 'concluida' : 'pendente';
  if (t.status === 'concluida') t.feito = true;
  if (t.feito && t.status !== 'concluida') t.status = 'concluida';
  if (!t.criado) t.criado = t.id || uid();
  return t;
}

function migrarTarefas() {
  estado.tarefas.forEach(tkNorm);
}

// --- Toast com desfazer ---
function tkToast(msg, comUndo) {
  var el = document.getElementById('tkToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tkToast';
    el.className = 'tk-toast';
    document.body.appendChild(el);
  }
  var html = '<span class="tk-toast-msg"></span>';
  el.innerHTML = html;
  el.querySelector('.tk-toast-msg').textContent = msg;
  if (comUndo) {
    var b = document.createElement('button');
    b.className = 'tk-toast-undo';
    b.textContent = '↩️ Desfazer';
    b.onclick = desfazerTarefa;
    el.appendChild(b);
  }
  el.classList.add('visivel');
  if (tarefaUndoTimer) clearTimeout(tarefaUndoTimer);
  tarefaUndoTimer = setTimeout(function(){
    el.classList.remove('visivel');
    tarefaUndo = null;
  }, 6000);
}

function esconderToast() {
  var el = document.getElementById('tkToast');
  if (el) el.classList.remove('visivel');
}

/* ---- GENERIC TOAST ---- */
function showToast(msg, type) {
  var el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;bottom:5.5rem;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;max-width:90vw';
    document.body.appendChild(el);
  }
  var icon = '';
  var bg = 'linear-gradient(135deg,var(--cor),var(--cor2))';
  if (type === 'success') { icon = '✅ '; bg = 'linear-gradient(135deg,var(--verde),#55efc4)'; }
  else if (type === 'error') { icon = '❌ '; bg = 'linear-gradient(135deg,var(--vermelho),#e17055)'; }
  else if (type === 'info') { icon = 'ℹ️ '; bg = 'linear-gradient(135deg,var(--azul),#74b9ff)'; }
  el.innerHTML = '<div style="display:flex;align-items:center;gap:.5rem;padding:.6rem 1.1rem;border-radius:.7rem;background:' + bg + ';color:#fff;font-size:var(--fs-base);font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);animation:plus-toast-in .4s ease,plus-toast-out .4s ease 2.6s forwards;pointer-events:auto">' + icon + esc(msg) + '</div>';
  setTimeout(function() { el.innerHTML = ''; }, 3500);
}



function desfazerTarefa() {
  if (!tarefaUndo) { tkToast('Nada para desfazer'); return; }
  var u = tarefaUndo;
  tarefaUndo = null;
  if (u.tipo === 'excluir') {
    var pos = u.pos;
    if (pos < 0 || pos > estado.tarefas.length) pos = estado.tarefas.length;
    estado.tarefas.splice(pos, 0, u.dados);
  } else if (u.tipo === 'excluirVarias') {
    estado.tarefas = u.dados.slice();
  } else if (u.tipo === 'concluir' || u.tipo === 'editar') {
    var i = -1;
    estado.tarefas.forEach(function(t, idx){ if (t.id === u.dados.id) i = idx; });
    if (i >= 0) estado.tarefas[i] = u.dados;
    else estado.tarefas.push(u.dados);
  }
  salvarEstado();
  renderTarefas();
  esconderToast();
}

// --- Criacao rapida ---
function tarefaSetDia(modo) {
  var hj = document.getElementById('tkDayHoje');
  var am = document.getElementById('tkDayAmanha');
  var sd = document.getElementById('tkDaySem');
  [hj, am, sd].forEach(function(b){ if (b) b.classList.remove('ativo'); });
  if (modo === 'hoje') { tkSet('tarefaData', hojeStr()); if (hj) hj.classList.add('ativo'); }
  else if (modo === 'amanha') { tkSet('tarefaData', amanhaStr()); if (am) am.classList.add('ativo'); }
  else if (modo === 'sem') { tkSet('tarefaData', ''); if (sd) sd.classList.add('ativo'); }
}

function toggleTarefaAvancado(forcar) {
  var box = document.getElementById('tarefaAvancado');
  var btn = document.getElementById('tkMoreBtn');
  if (!box) return;
  var abrir = forcar === true ? true : !box.classList.contains('aberto');
  box.classList.toggle('aberto', abrir);
  if (btn) btn.textContent = abrir ? '⚙️ Menos campos' : '⚙️ Mais campos';
  if (abrir) {
    atualizarMateriasTarefa();
    var d = document.getElementById('tarefaDesc');
    if (d) d.focus();
  }
}

function atualizarMateriasTarefa() {
  var dl = document.getElementById('tarefaMateriaList');
  if (!dl) return;
  var nomes = [];
  if (estado.estudos && estado.estudos.materias) {
    estado.estudos.materias.forEach(function(m){
      var n = typeof m === 'string' ? m : (m.nome || m.texto || '');
      if (n && nomes.indexOf(n) < 0) nomes.push(n);
    });
  }
  estado.tarefas.forEach(function(t){
    if (t.materia && nomes.indexOf(t.materia) < 0) nomes.push(t.materia);
  });
  var html = '';
  nomes.forEach(function(n){ html += '<option value="' + esc(n) + '"></option>'; });
  dl.innerHTML = html;
}

function tarefaQuickKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); addTarefa(); }
  else if (e.key === 'Escape') { document.getElementById('tarefaInput').value = ''; }
}

function limparFormTarefa() {
  tkSet('tarefaInput', '');
  tkSet('tarefaDesc', '');
  tkSet('tarefaMateria', '');
  tkSet('tarefaHora', '');
  tkSet('tarefaObs', '');
  tkSet('tarefaCat', '');
  tkSet('tarefaPrio', 'media');
  tkSet('tarefaStatus', 'pendente');
  tarefaSetDia('hoje');
}

function addTarefa() {
  var txt = tkVal('tarefaInput').trim();
  if (!txt) {
    var inp = document.getElementById('tarefaInput');
    if (inp) { inp.classList.add('tk-erro'); inp.focus(); setTimeout(function(){ inp.classList.remove('tk-erro'); }, 1200); }
    tkToast('Escreva um título para a tarefa');
    return;
  }
  var st = tkVal('tarefaStatus') || 'pendente';
  var nova = tkNorm({
    id: uid(),
    texto: txt,
    descricao: tkVal('tarefaDesc').trim(),
    materia: tkVal('tarefaMateria').trim(),
    data: tkVal('tarefaData') || '',
    hora: tkVal('tarefaHora') || '',
    prio: tkVal('tarefaPrio') || 'media',
    categoria: tkVal('tarefaCat') || '',
    status: st,
    obs: tkVal('tarefaObs').trim(),
    feito: st === 'concluida',
    criado: new Date().toISOString(),
    lembrete: estado.notifConfig ? estado.notifConfig.tarefas : 1
  });
  estado.tarefas.push(nova);
  salvarEstado();

  // mantem data/prioridade para criar varias em sequencia
  tkSet('tarefaInput', '');
  tkSet('tarefaDesc', '');
  tkSet('tarefaMateria', '');
  tkSet('tarefaHora', '');
  tkSet('tarefaObs', '');
  tkSet('tarefaStatus', 'pendente');
  var inp2 = document.getElementById('tarefaInput');
  if (inp2) inp2.focus();

  atualizarMateriasTarefa();
  renderTarefas();
  tarefaUndo = {tipo:'excluir', dados:nova, pos:estado.tarefas.length-1};
  tkToast('Tarefa criada ✓', true);
  registrarUsoPlus();
}

function toggleTarefa(id) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (!t) return;
  tarefaUndo = {tipo:'concluir', dados:JSON.parse(JSON.stringify(t))};
  t.feito = !t.feito;
  t.status = t.feito ? 'concluida' : 'pendente';
  t.concluidoEm = t.feito ? new Date().toISOString() : '';
  salvarEstado();
  renderTarefas();
  tkToast(t.feito ? 'Tarefa concluída 🎉' : 'Tarefa reaberta', true);
  if (t.feito) registrarUsoPlus();
}

function mudarStatusTarefa(id, st) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (!t) return;
  tarefaUndo = {tipo:'editar', dados:JSON.parse(JSON.stringify(t))};
  t.status = st;
  t.feito = st === 'concluida';
  salvarEstado();
  renderTarefas();
  tkToast('Status: ' + (tkStatusLabel[st] || st), true);
}

function delTarefa(id) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (!t) return;
  confirmar('Excluir a tarefa "' + t.texto + '"?', function(){
    var pos = -1;
    estado.tarefas.forEach(function(x, i){ if (x.id === id) pos = i; });
    var copia = JSON.parse(JSON.stringify(t));
    estado.tarefas = estado.tarefas.filter(function(x){return x.id!==id;});
    salvarEstado();
    renderTarefas();
    tarefaUndo = {tipo:'excluir', dados:copia, pos:pos};
    tkToast('Tarefa excluída', true);
  });
}

function toggleDetalheTarefa(id) {
  tarefasAbertas[id] = !tarefasAbertas[id];
  renderTarefas();
}

// --- Edicao ---
function editarTarefa(id) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (!t) return;
  tkNorm(t);
  tarefaEditId = id;
  atualizarMateriasTarefa();
  tkSet('edTarefaTitulo', t.texto || '');
  tkSet('edTarefaDesc', t.descricao || '');
  tkSet('edTarefaMateria', t.materia || '');
  tkSet('edTarefaData', t.data || '');
  tkSet('edTarefaHora', t.hora || '');
  tkSet('edTarefaPrio', t.prio || 'media');
  tkSet('edTarefaCat', t.categoria || '');
  tkSet('edTarefaStatus', t.status || 'pendente');
  tkSet('edTarefaObs', t.obs || '');
  tkSet('edTarefaLembrete', t.lembrete !== undefined ? String(t.lembrete) : '-1');
  var m = document.getElementById('tarefaEditModal');
  if (m) m.classList.add('visivel');
  var f = document.getElementById('edTarefaTitulo');
  if (f) setTimeout(function(){ f.focus(); }, 60);
}

function fecharEdicaoTarefa(e) {
  if (e && e.target && e.target.id !== 'tarefaEditModal') return;
  var m = document.getElementById('tarefaEditModal');
  if (m) m.classList.remove('visivel');
  tarefaEditId = null;
}

function salvarEdicaoTarefa() {
  if (!tarefaEditId) return;
  var t = estado.tarefas.find(function(x){return x.id===tarefaEditId;});
  if (!t) { fecharEdicaoTarefa(); return; }
  var titulo = tkVal('edTarefaTitulo').trim();
  if (!titulo) {
    var el = document.getElementById('edTarefaTitulo');
    if (el) { el.classList.add('tk-erro'); el.focus(); setTimeout(function(){ el.classList.remove('tk-erro'); }, 1200); }
    return;
  }
  tarefaUndo = {tipo:'editar', dados:JSON.parse(JSON.stringify(t))};
  t.texto = titulo;
  t.descricao = tkVal('edTarefaDesc').trim();
  t.materia = tkVal('edTarefaMateria').trim();
  t.data = tkVal('edTarefaData') || '';
  t.hora = tkVal('edTarefaHora') || '';
  t.prio = tkVal('edTarefaPrio') || 'media';
  t.categoria = tkVal('edTarefaCat') || '';
  t.status = tkVal('edTarefaStatus') || 'pendente';
  t.feito = t.status === 'concluida';
  t.obs = tkVal('edTarefaObs').trim();
  t.lembrete = parseInt(tkVal('edTarefaLembrete') || '-1');
  salvarEstado();
  fecharEdicaoTarefa();
  atualizarMateriasTarefa();
  renderTarefas();
  tkToast('Tarefa atualizada ✓', true);
}

// --- Pesquisa / filtro / ordem ---
function limparPesquisaTarefa() {
  tkSet('tarefaPesquisa', '');
  renderTarefas();
}

function filtroTarefa(f) {
  estado.filtroTarefas = f;
  salvarEstado();
  renderTarefas();
}

function ordenarTarefas(o) {
  estado.ordemTarefas = o;
  salvarEstado();
  renderTarefas();
}

function inverterOrdemTarefas() {
  estado.ordemTarefasDesc = !estado.ordemTarefasDesc;
  salvarEstado();
  renderTarefas();
}

function tkPassaFiltro(t, filtro, hoje, amanha, fimSem) {
  if (filtro === 'todas') return true;
  if (filtro === 'pendentes' || filtro === 'ativas') return !t.feito;
  if (filtro === 'concluidas' || filtro === 'feitas') return !!t.feito;
  if (filtro === 'atrasadas') return eAtrasada(t);
  if (filtro === 'hoje') return !t.feito && t.data === hoje;
  if (filtro === 'amanha') return !t.feito && t.data === amanha;
  if (filtro === 'semana') return !t.feito && !!t.data && t.data >= hoje && t.data <= fimSem;
  return true;
}

function renderTarefas() {
  var listaEl = document.getElementById('tarefasLista');
  if (!listaEl) return;
  migrarTarefas();
  atualizarMateriasTarefa();

  var pesquisa = tkVal('tarefaPesquisa') || '';
  var filtro = estado.filtroTarefas || 'todas';
  var ordem = estado.ordemTarefas || 'data';
  var hoje = hojeStr();
  var amanha = amanhaStr();
  var fimSem = fimSemanaStr();

  // contadores dos filtros
  var contas = {todas:0, hoje:0, amanha:0, semana:0, atrasadas:0, concluidas:0, pendentes:0};
  estado.tarefas.forEach(function(t){
    Object.keys(contas).forEach(function(k){
      if (tkPassaFiltro(t, k, hoje, amanha, fimSem)) contas[k]++;
    });
  });
  Object.keys(contas).forEach(function(k){
    var el = document.getElementById('tkfN-' + k);
    if (el) el.textContent = contas[k];
  });
  document.querySelectorAll('#tarefaFiltros .tk-chip').forEach(function(b){
    b.classList.toggle('ativo', b.getAttribute('data-f') === filtro);
  });
  var selO = document.getElementById('tarefaOrdem');
  if (selO && selO.value !== ordem) selO.value = ordem;
  var dirB = document.getElementById('tarefaOrdemDir');
  if (dirB) dirB.textContent = estado.ordemTarefasDesc ? '↓' : '↑';

  var lista = estado.tarefas.filter(function(t){
    return tkPassaFiltro(t, filtro, hoje, amanha, fimSem);
  });

  if (pesquisa.trim()) {
    var q = pesquisa.toLowerCase();
    lista = lista.filter(function(t){
      var alvo = [t.texto, t.descricao, t.materia, t.obs, t.categoria].join(' ').toLowerCase();
      return alvo.indexOf(q) >= 0;
    });
  }

  var cmp;
  if (ordem === 'prio') {
    cmp = function(a,b){
      var d = (tkPrioVal[a.prio] === undefined ? 1 : tkPrioVal[a.prio]) - (tkPrioVal[b.prio] === undefined ? 1 : tkPrioVal[b.prio]);
      if (d) return d;
      return (a.data || '9999').localeCompare(b.data || '9999');
    };
  } else if (ordem === 'cat') {
    cmp = function(a,b){ return (a.categoria || 'zzz').localeCompare(b.categoria || 'zzz'); };
  } else if (ordem === 'materia') {
    cmp = function(a,b){ return (a.materia || 'zzz').localeCompare(b.materia || 'zzz', 'pt-BR'); };
  } else if (ordem === 'status') {
    cmp = function(a,b){
      var d = (tkStatusVal[a.status] === undefined ? 1 : tkStatusVal[a.status]) - (tkStatusVal[b.status] === undefined ? 1 : tkStatusVal[b.status]);
      if (d) return d;
      return (a.data || '9999').localeCompare(b.data || '9999');
    };
  } else if (ordem === 'titulo') {
    cmp = function(a,b){ return (a.texto || '').localeCompare(b.texto || '', 'pt-BR'); };
  } else if (ordem === 'criacao') {
    cmp = function(a,b){ return String(b.criado || '').localeCompare(String(a.criado || '')); };
  } else {
    cmp = function(a,b){
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || ''));
    };
  }
  lista.sort(cmp);
  if (estado.ordemTarefasDesc) lista.reverse();
  // concluídas sempre no fim
  lista.sort(function(a,b){ return (a.feito ? 1 : 0) - (b.feito ? 1 : 0); });

  // resumo
  var resumo = document.getElementById('tarefaResumo');
  if (resumo) {
    var totalAtivas = contas.pendentes;
    var txtR = lista.length + (lista.length === 1 ? ' tarefa' : ' tarefas') + ' nesta visão';
    if (contas.atrasadas > 0) txtR += ' · 🚨 ' + contas.atrasadas + ' atrasada' + (contas.atrasadas > 1 ? 's' : '');
    txtR += ' · ' + totalAtivas + ' pendente' + (totalAtivas === 1 ? '' : 's') + ' · ✅ ' + contas.concluidas + ' concluída' + (contas.concluidas === 1 ? '' : 's');
    resumo.textContent = txtR;
  }

  var html = '';
  lista.forEach(function(t) {
    var catE = catEmojis[t.categoria] || '';
    var catC = catCores[t.categoria] || 'var(--txt2)';
    var prioC = t.prio === 'alta' ? 'prio-alta' : t.prio === 'baixa' ? 'prio-baixa' : '';
    var atrasada = eAtrasada(t);
    var aberta = !!tarefasAbertas[t.id];
    var temDetalhe = !!(t.descricao || t.obs);
    var classe = 'tarefa-item tk-item' + (t.feito ? ' feito' : '') + (atrasada ? ' atrasada' : '') + (prioC ? ' ' + prioC : '');
    html += '<li class="' + classe + '" data-busca-id="' + t.id + '">'; 
    html += '<div class="tk-row">';
    html += '<div class="tarefa-check" onclick="toggleTarefa(\'' + t.id + '\')" title="' + (t.feito ? 'Desfazer conclusão' : 'Concluir') + '">' + (t.feito ? '✅' : '⬜') + '</div>';
    html += '<div class="tarefa-info">';
    html += '<div class="tarefa-texto">' + (catE ? '<span style="margin-right:.3rem">' + catE + '</span>' : '') + esc(t.texto);
    if (t.prio === 'alta' && !t.feito) html += ' <span class="tk-badge tk-badge-alta">Alta</span>';
    if (t.status === 'fazendo') html += ' <span class="tk-badge tk-badge-fazendo">Fazendo</span>';
    html += '</div>';
    var metas = [];
    if (t.data) metas.push('<span style="color:' + catC + '">📅 ' + dataLocal(t.data) + '</span>');
    if (t.hora) metas.push('<span style="color:var(--txt3)">🕐 ' + esc(t.hora) + '</span>');
    if (t.materia) metas.push('<span class="tk-tag-materia">📚 ' + esc(t.materia) + '</span>');
    if (t.categoria) metas.push('<span style="color:' + catC + '">' + esc(t.categoria) + '</span>');
    metas.push('<span style="color:var(--txt3)">' + (tkStatusLabel[t.status] || t.status) + '</span>');
    if (atrasada) metas.push('<span style="color:var(--vermelho);font-weight:700">🚨 atrasada</span>');
    if (t.lembrete >= 0 && estado.notifConfig && estado.notifConfig.global) metas.push('<span class="notif-badge-active">🔔</span>');
    html += '<div class="tarefa-meta">' + metas.join(' ') + '</div>';
    if (temDetalhe) {
      html += '<button class="tk-toggle-det" onclick="toggleDetalheTarefa(\'' + t.id + '\')">' + (aberta ? '▲ Ocultar detalhes' : '▼ Ver detalhes') + '</button>';
    }
    html += '</div>';
    html += '<div class="tk-acoes">';
    html += '<button class="tk-acao" onclick="editarTarefa(\'' + t.id + '\')" title="Editar">✏️</button>';
    if (!t.feito) {
      var prox = t.status === 'fazendo' ? 'pendente' : 'fazendo';
      html += '<button class="tk-acao" onclick="mudarStatusTarefa(\'' + t.id + '\',\'' + prox + '\')" title="' + (prox === 'fazendo' ? 'Marcar como fazendo' : 'Voltar para pendente') + '">🔄</button>';
    }
    html += '<button class="tk-acao tk-acao-del" onclick="delTarefa(\'' + t.id + '\')" title="Excluir">🗑️</button>';
    html += '</div>';
    html += '</div>';
    if (temDetalhe && aberta) {
      html += '<div class="tk-detalhe">';
      if (t.descricao) html += '<div class="tk-det-bloco"><span class="tk-det-lbl">📝 Descrição</span><p>' + esc(t.descricao).replace(/\n/g, '<br>') + '</p></div>';
      if (t.obs) html += '<div class="tk-det-bloco"><span class="tk-det-lbl">📌 Observações</span><p>' + esc(t.obs).replace(/\n/g, '<br>') + '</p></div>';
      html += '</div>';
    }
    html += '</li>';
  });
  if (!html) {
    var vazio = {
      todas:'Nenhuma tarefa ainda. Crie a primeira acima! 🚀',
      hoje:'Nada para hoje — dia livre!',
      amanha:'Nada marcado para amanhã.',
      semana:'Nenhuma tarefa nesta semana.',
      atrasadas:'Nenhuma tarefa atrasada. Muito bem! 👏',
      concluidas:'Você ainda não concluiu nenhuma tarefa.'
    };
    var msgV = (pesquisa.trim() ? 'Nenhuma tarefa encontrada para "' + esc(pesquisa.trim()) + '"' : (vazio[filtro] || 'Nenhuma tarefa encontrada'));
    html = '<div class="tk-vazio">' + msgV + '</div>';
  }
  listaEl.innerHTML = html;
}

function limparTarefas() {
  var antes = JSON.parse(JSON.stringify(estado.tarefas));
  var n = estado.tarefas.filter(function(t){return t.feito;}).length;
  if (!n) { tkToast('Nenhuma tarefa concluída para limpar'); return; }
  estado.tarefas = estado.tarefas.filter(function(t){return !t.feito;});
  salvarEstado(); renderTarefas();
  tarefaUndo = {tipo:'excluirVarias', dados:antes};
  tkToast(n + (n === 1 ? ' tarefa removida' : ' tarefas removidas'), true);
}

// ---- CALENDARIO ----
function renderCalendario() {
  if (!estado.calMes && !estado.calAno) {
    var d = new Date();
    estado.calMes = d.getMonth();
    estado.calAno = d.getFullYear();
  }
  if (estado.calView === 'mes') renderCalMes();
  else if (estado.calView === 'semana') renderCalSemana();
  else if (estado.calView === 'dia') renderCalDia();
}

function setCalView(v, btn) {
  estado.calView = v;
  if (v === 'dia' && !estado.calDiaSel) estado.calDiaSel = hojeStr();
  document.querySelectorAll('.cal-view-toggle button').forEach(function(b){b.classList.remove('ativo');});
  if (btn) btn.classList.add('ativo');
  renderCalendario();
}

function calNav(dir) {
  if (estado.calView === 'mes') {
    estado.calMes += dir;
    if (estado.calMes > 11) { estado.calMes = 0; estado.calAno++; }
    if (estado.calMes < 0) { estado.calMes = 11; estado.calAno--; }
  } else if (estado.calView === 'semana') {
    if (!estado.calSemanaStart) estado.calSemanaStart = new Date();
    var d = new Date(estado.calSemanaStart);
    d.setDate(d.getDate() + dir * 7);
    estado.calSemanaStart = d;
  } else if (estado.calView === 'dia') {
    if (!estado.calDiaSel) estado.calDiaSel = hojeStr();
    var dd = new Date(estado.calDiaSel + 'T12:00:00');
    dd.setDate(dd.getDate() + dir);
    estado.calDiaSel = dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
  }
  renderCalendario();
}

function calHoje() {
  var d = new Date();
  estado.calMes = d.getMonth();
  estado.calAno = d.getFullYear();
  estado.calSemanaStart = d;
  estado.calDiaSel = hojeStr();
  renderCalendario();
}

function getCalEvents(dateStr) {
  var evts = [];
  estado.tarefas.forEach(function(t) {
    if (t.data === dateStr) evts.push({id: t.id, texto: t.texto, cor: catCores[t.categoria] || '#6c5ce7', tipo: 'tarefa', hora: t.hora || '', materia: t.materia || '', origem: 'tarefa'});
  });
  estado.lembretes.forEach(function(l) {
    if (l.data === dateStr) evts.push({id: l.id, texto: l.texto, cor: '#fdcb6e', tipo: 'lembrete', hora: '', materia: '', origem: 'lembrete'});
  });
  if (estado.estudos && estado.estudos.provas) {
    estado.estudos.provas.forEach(function(p) {
      if (p.data === dateStr) evts.push({id: p.id, texto: p.texto, cor: '#e17055', tipo: 'prova', hora: p.hora || '', materia: p.materia || '', origem: 'prova'});
    });
  }
  if (estado.estudos && estado.estudos.trabalhos) {
    estado.estudos.trabalhos.forEach(function(tr) {
      if (tr.data === dateStr) evts.push({id: tr.id, texto: tr.texto, cor: '#0984e3', tipo: 'trabalho', hora: tr.hora || '', materia: tr.materia || '', origem: 'trabalho'});
    });
  }
  (estado.calEventos || []).forEach(function(c) {
    if (c.data === dateStr) evts.push({id: c.id, texto: c.titulo, cor: calTipoCor(c.tipo), tipo: c.tipo, hora: c.hora || '', materia: c.materia || '', origem: 'calEvento'});
  });
  // Sort by hora
  evts.sort(function(a, b) {
    var ha = a.hora || '99:99';
    var hb = b.hora || '99:99';
    if (ha < hb) return -1;
    if (ha > hb) return 1;
    return 0;
  });
  return evts;
}

function calTipoCor(tipo) {
  var cores = {tarefa:'#6c5ce7', prova:'#e17055', trabalho:'#0984e3', evento:'#00b894'};
  return cores[tipo] || '#636e72';
}

function calTipoIcon(tipo) {
  var icons = {tarefa:'✅', prova:'📝', trabalho:'📋', evento:'📌', lembrete:'🔔'};
  return icons[tipo] || '📌';
}

function renderCalMes() {
  var m = estado.calMes;
  var y = estado.calAno;
  var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('calTitulo').textContent = meses[m] + ' ' + y;

  var primeiro = new Date(y, m, 1);
  var ultimo = new Date(y, m+1, 0);
  var startDay = primeiro.getDay();
  var totalDays = ultimo.getDate();
  var hoje = hojeStr();

  var diasSem = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var html = '<div class="cal-grid">';
  diasSem.forEach(function(d){ html += '<div class="cal-dia-header">' + d + '</div>'; });

  for (var i = 0; i < startDay; i++) html += '<div class="cal-dia empty"></div>';

  for (var dia = 1; dia <= totalDays; dia++) {
    var dateStr = y + '-' + String(m+1).padStart(2,'0') + '-' + String(dia).padStart(2,'0');
    var evts = getCalEvents(dateStr);
    var isHoje = dateStr === hoje;
    var cls = 'cal-dia' + (isHoje ? ' hoje' : '') + (evts.length ? ' has-events' : '');
    html += '<div class="' + cls + '" onclick="abrirCalDia(\'' + dateStr + '\')" >';
    html += '<div class="cal-dia-num">' + dia + '</div>';
    if (evts.length) {
      html += '<div class="cal-dia-eventos">';
      evts.slice(0,3).forEach(function(e){
        var icon = calTipoIcon(e.tipo);
        html += '<div class="cal-evento" data-busca-id="' + e.id + '" style="background:' + e.cor + '" title="' + esc(e.texto) + '">' + icon + '</div>';
      });
      if (evts.length > 3) html += '<div class="cal-evento-mais">+' + (evts.length-3) + '</div>';
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  document.getElementById('calCorpo').innerHTML = html;
}

function renderCalSemana() {
  if (!estado.calSemanaStart) estado.calSemanaStart = new Date();
  var start = new Date(estado.calSemanaStart);
  var day = start.getDay();
  start.setDate(start.getDate() - day); // Go to Sunday

  var diasSem = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var end = new Date(start); end.setDate(end.getDate()+6);
  document.getElementById('calTitulo').textContent = diasSem[start.getDay()] + ' ' + start.getDate() + ' ' + meses[start.getMonth()] + ' – ' + end.getDate() + ' ' + meses[end.getMonth()];

  var hoje = hojeStr();
  var html = '<div class="cal-semana-grid">';
  for (var i = 0; i < 7; i++) {
    var d = new Date(start); d.setDate(d.getDate()+i);
    var dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    var isHoje = dateStr === hoje;
    var evts = getCalEvents(dateStr);
    html += '<div class="cal-semana-dia' + (isHoje ? ' hoje' : '') + '" onclick="abrirCalDia(\'' + dateStr + '\')" style="cursor:pointer">';
    html += '<div class="csd-header"><span class="csd-nome">' + diasSem[i].slice(0,3) + '</span><span class="csd-num">' + d.getDate() + '</span></div>';
    html += '<div class="csd-eventos">';
    evts.forEach(function(e){
      var icon = calTipoIcon(e.tipo);
      var horaStr = e.hora ? '<span class="csd-evt-hora">' + esc(e.hora) + '</span> ' : '';
      html += '<div class="csd-evt" style="border-left:3px solid ' + e.cor + '">' + icon + ' ' + horaStr + esc(e.texto) + '</div>';
    });
    if (!evts.length) html += '<div class="csd-evt-empty">—</div>';
    html += '</div></div>';
  }
  html += '</div>';
  document.getElementById('calCorpo').innerHTML = html;
}

// ---- CALENDARIO: VISUALIZAÇÃO DIA ----
function abrirCalDia(dateStr) {
  estado.calDiaSel = dateStr;
  estado.calView = 'dia';
  document.querySelectorAll('.cal-view-toggle button').forEach(function(b){b.classList.remove('ativo');});
  var diaBtn = document.querySelector('.cal-view-toggle button[data-view="dia"]');
  if (diaBtn) diaBtn.classList.add('ativo');
  renderCalendario();
}

function renderCalDia() {
  var sel = estado.calDiaSel || hojeStr();
  estado.calDiaSel = sel;
  var d = new Date(sel + 'T12:00:00');
  var diasSem = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  document.getElementById('calTitulo').textContent = diasSem[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()];

  var evts = getCalEvents(sel);
  var isHoje = sel === hojeStr();

  var html = '<div class="cal-dia-view">';
  html += '<div class="cdv-header">';
  html += '<span class="cdv-date">' + d.getDate() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear() + '</span>';
  if (isHoje) html += '<span class="cdv-hoje-badge">Hoje</span>';
  html += '<button class="btn btn-p cdv-add-btn" onclick="abrirCalEventoModal()">＋ Adicionar evento</button>';
  html += '</div>';

  if (evts.length) {
    html += '<div class="cdv-list">';
    evts.forEach(function(e) {
      var icon = calTipoIcon(e.tipo);
      var horaStr = e.hora ? '<span class="cdv-evt-hora">' + esc(e.hora) + '</span>' : '';
      var matStr = e.materia ? '<span class="cdv-evt-mat">' + esc(e.materia) + '</span>' : '';
      var isCalEvt = e.origem === 'calEvento';
      html += '<div class="cdv-evt" style="border-left:4px solid ' + e.cor + '">';
      html += '<div class="cdv-evt-top">';
      html += '<span class="cdv-evt-icon">' + icon + '</span>';
      html += '<span class="cdv-evt-tipo">' + esc(e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)) + '</span>';
      html += horaStr;
      html += matStr;
      html += '</div>';
      html += '<div class="cdv-evt-titulo">' + esc(e.texto) + '</div>';
      if (isCalEvt) {
        var ce = estado.calEventos.find(function(c){ return c.id === e.id; });
        if (ce && ce.descricao) {
          html += '<div class="cdv-evt-desc">' + esc(ce.descricao) + '</div>';
        }
        html += '<div class="cdv-evt-acoes">';
        html += '<button class="btn btn-s cdv-evt-edit" onclick="abrirCalEventoModal(\'' + e.id + '\')">✏️ Editar</button>';
        html += '<button class="btn btn-d cdv-evt-del" onclick="delCalEvento(\'' + e.id + '\')">🗑️ Excluir</button>';
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="cdv-empty">';
    html += '<div class="cdv-empty-icon">📭</div>';
    html += '<div class="cdv-empty-text">Nenhum evento neste dia</div>';
    html += '<button class="btn btn-p" onclick="abrirCalEventoModal()">＋ Adicionar evento</button>';
    html += '</div>';
  }

  html += '</div>';
  document.getElementById('calCorpo').innerHTML = html;
}

// ---- CALENDARIO: CRUD EVENTOS ----
var calEventoEditId = null;

function abrirCalEventoModal(editId) {
  calEventoEditId = editId || null;
  var modal = document.getElementById('calEventModal');
  if (!modal) return;
  modal.classList.add('visivel');
  // Populate materias datalist
  var dl = document.getElementById('calMateriaList');
  if (dl) {
    var items = '';
    (estado.estudos.materias || []).forEach(function(m) {
      items += '<option value="' + esc(m.nome) + '">';
    });
    dl.innerHTML = items;
  }
  if (calEventoEditId) {
    var ce = estado.calEventos.find(function(c){ return c.id === calEventoEditId; });
    if (ce) {
      document.getElementById('calEvtTitulo').value = ce.titulo || '';
      document.getElementById('calEvtData').value = ce.data || estado.calDiaSel || hojeStr();
      document.getElementById('calEvtHora').value = ce.hora || '';
      document.getElementById('calEvtMateria').value = ce.materia || '';
      document.getElementById('calEvtTipo').value = ce.tipo || 'evento';
      document.getElementById('calEvtDesc').value = ce.descricao || '';
      document.getElementById('calEvtLembrete').value = ce.lembrete !== undefined ? String(ce.lembrete) : String(estado.notifConfig.eventos);
      document.getElementById('calEvtModalTitle').textContent = '✏️ Editar evento';
    }
  } else {
    document.getElementById('calEvtTitulo').value = '';
    document.getElementById('calEvtData').value = estado.calDiaSel || hojeStr();
    document.getElementById('calEvtHora').value = '';
    document.getElementById('calEvtMateria').value = '';
    document.getElementById('calEvtTipo').value = 'evento';
    document.getElementById('calEvtDesc').value = '';
    document.getElementById('calEvtLembrete').value = String(estado.notifConfig.eventos);
    document.getElementById('calEvtModalTitle').textContent = '＋ Novo evento';
  }
}

function fecharCalEventoModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var modal = document.getElementById('calEventModal');
  if (modal) modal.classList.remove('visivel');
  calEventoEditId = null;
}

function salvarCalEvento() {
  var titulo = document.getElementById('calEvtTitulo').value.trim();
  var data = document.getElementById('calEvtData').value;
  var hora = document.getElementById('calEvtHora').value;
  var materia = document.getElementById('calEvtMateria').value.trim();
  var tipo = document.getElementById('calEvtTipo').value;
  var descricao = document.getElementById('calEvtDesc').value.trim();
  var lembrete = parseInt(document.getElementById('calEvtLembrete').value);
  if (!titulo) return;
  if (!data) data = estado.calDiaSel || hojeStr();
  if (calEventoEditId) {
    var ce = estado.calEventos.find(function(c){ return c.id === calEventoEditId; });
    if (ce) {
      ce.titulo = titulo;
      ce.data = data;
      ce.hora = hora;
      ce.materia = materia;
      ce.tipo = tipo;
      ce.descricao = descricao;
      ce.lembrete = lembrete;
    }
  } else {
    estado.calEventos.push({
      id: uid(),
      titulo: titulo,
      data: data,
      hora: hora,
      materia: materia,
      tipo: tipo,
      descricao: descricao,
      lembrete: lembrete
    });
  }
  salvarEstado();
  fecharCalEventoModal();
  renderCalendario();
}

function delCalEvento(id) {
  showConfirm('Excluir este evento do calendário?', function() {
    estado.calEventos = estado.calEventos.filter(function(c){ return c.id !== id; });
    salvarEstado();
    renderCalendario();
  });
}

// ---- ESTUDOS ----
// ---- ESTUDOS: Meus Estudos ----
var matEditId = null;
var matDetalheIdAtual = null;
var anotEditIdx = null;

function renderEstudos() {
  // If detail view was open, return to main
  matDetalheIdAtual = null;
  var det = document.getElementById('materiaDetalhe');
  var main = document.getElementById('estudosMain');
  if (det) det.style.display = 'none';
  if (main) main.style.display = '';
  renderMaterias();
  renderProvas();
  renderTrabalhos();
}

// --- Materia Modal ---
function abrirMateriaModal(editId) {
  matEditId = editId || null;
  var modal = document.getElementById('materiaModal');
  if (!modal) return;
  modal.classList.add('visivel');
  if (matEditId) {
    var m = estado.estudos.materias.find(function(x){ return x.id === matEditId; });
    if (m) {
      document.getElementById('matNomeInput').value = m.nome || '';
      document.getElementById('matCorInput').value = m.cor || '#6c5ce7';
      document.getElementById('matMetaInput').value = m.metaHoras || 0;
      document.getElementById('matModalTitle').textContent = '✏️ Editar matéria';
    }
  } else {
    document.getElementById('matNomeInput').value = '';
    document.getElementById('matCorInput').value = '#6c5ce7';
    document.getElementById('matMetaInput').value = '';
    document.getElementById('matModalTitle').textContent = '＋ Nova matéria';
  }
}

function fecharMateriaModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('materiaModal').classList.remove('visivel');
  matEditId = null;
}

function salvarMateria() {
  var nome = document.getElementById('matNomeInput').value.trim();
  if (!nome) return;
  var cor = document.getElementById('matCorInput').value;
  var meta = parseFloat(document.getElementById('matMetaInput').value) || 0;
  if (matEditId) {
    var m = estado.estudos.materias.find(function(x){ return x.id === matEditId; });
    if (m) {
      // Update materia name in related provas, trabalhos, tarefas
      var oldNome = m.nome;
      m.nome = nome;
      m.cor = cor;
      m.metaHoras = meta;
      if (oldNome !== nome) {
        estado.estudos.provas.forEach(function(p){ if (p.materia === oldNome) p.materia = nome; });
        estado.estudos.trabalhos.forEach(function(t){ if (t.materia === oldNome) t.materia = nome; });
        estado.tarefas.forEach(function(t){ if (t.materia === oldNome) t.materia = nome; });
      }
    }
  } else {
    estado.estudos.materias.push({nome:nome, cor:cor, id:uid(), anotacoes:[], metaHoras:meta});
  }
  salvarEstado();
  fecharMateriaModal();
  renderMaterias();
  // If detail is open, refresh it
  if (matDetalheIdAtual) renderMateriaDetalhe(matDetalheIdAtual);
}

function confirmarDelMateria(id) {
  var m = estado.estudos.materias.find(function(x){ return x.id === id; });
  var nome = m ? m.nome : 'esta matéria';
  showConfirm('Excluir "' + nome + '" e todas as anotações? Provas, trabalhos e tarefas não serão excluídos.', function() {
    estado.estudos.materias = estado.estudos.materias.filter(function(x){ return x.id !== id; });
    salvarEstado();
    voltarEstudos();
    renderMaterias();
  });
}

function delMateria(id) {
  confirmarDelMateria(id);
}

function renderMaterias() {
  var html = '';
  var hoje = hojeStr();
  estado.estudos.materias.forEach(function(m) {
    var provas = estado.estudos.provas.filter(function(p){return p.materia===m.nome});
    var trabs = estado.estudos.trabalhos.filter(function(t){return t.materia===m.nome});
    var tarefas = estado.tarefas.filter(function(t){return t.materia===m.nome});
    var nProvas = provas.length;
    var nTrabs = trabs.length;
    var nTarefas = tarefas.length;
    var nAnotacoes = (m.anotacoes || []).length;
    // Pendentes: provas futuras, trabalhos pendente/fazendo, tarefas nao feitas
    var provasPend = provas.filter(function(p){return p.data && p.data >= hoje}).length;
    var trabsPend = trabs.filter(function(t){return t.status !== 'concluido'}).length;
    var tarefasPend = tarefas.filter(function(t){return !t.feito}).length;
    var totalPend = provasPend + trabsPend + tarefasPend;
    // Progress: completed / total
    var tarefasDone = tarefas.filter(function(t){return t.feito}).length;
    var trabsDone = trabs.filter(function(t){return t.status === 'concluido'}).length;
    var totalItems = nTarefas + nTrabs;
    var totalDone = tarefasDone + trabsDone;
    var pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    html += '<div class="materia-card" data-busca-id="' + m.id + '" style="border-left:4px solid ' + m.cor + '" onclick="abrirMateriaDetalhe(\'' + m.id + '\')" tabindex="0" role="button" aria-label="Ver detalhes de ' + esc(m.nome) + '">';
    html += '<div class="materia-nome" style="color:' + m.cor + '">' + esc(m.nome) + '</div>';
    if (totalItems > 0) {
      html += '<div class="materia-barra"><div class="materia-fill" style="width:' + pct + '%;background:' + m.cor + '"></div></div>';
      html += '<div class="materia-info">' + pct + '% concluído</div>';
    } else {
      html += '<div class="materia-info" style="margin-top:.3rem">Sem atividades ainda</div>';
    }
    html += '<div class="materia-stats">';
    html += '<span>✅ ' + nTarefas + '</span>';
    html += '<span>📝 ' + nProvas + '</span>';
    html += '<span>📄 ' + nTrabs + '</span>';
    html += '<span>📓 ' + nAnotacoes + '</span>';
    html += '</div>';
    if (totalPend > 0) {
      html += '<div class="materia-pendentes">⏳ ' + totalPend + ' pendente' + (totalPend > 1 ? 's' : '') + '</div>';
    }
    html += '</div>';
  });
  if (!html) html = '<div class="estudos-vazio">Nenhuma matéria adicionada.<br>Clique em <strong>＋ Nova matéria</strong> para começar.</div>';
  document.getElementById('materiasGrid').innerHTML = html;
}

// --- Materia Detail ---
function abrirMateriaDetalhe(id) {
  matDetalheIdAtual = id;
  var m = estado.estudos.materias.find(function(x){ return x.id === id; });
  if (!m) return;
  var main = document.getElementById('estudosMain');
  var det = document.getElementById('materiaDetalhe');
  if (main) main.style.display = 'none';
  if (det) det.style.display = '';
  renderMateriaDetalhe(id);
  // Update topbar title
  var t = document.getElementById('topbarTitle');
  if (t) t.textContent = m.nome;
}

function voltarEstudos() {
  matDetalheIdAtual = null;
  var det = document.getElementById('materiaDetalhe');
  var main = document.getElementById('estudosMain');
  if (det) det.style.display = 'none';
  if (main) main.style.display = '';
  var t = document.getElementById('topbarTitle');
  if (t) t.textContent = pageNames['estudos'] || 'Estudos';
  renderMaterias();
  renderProvas();
  renderTrabalhos();
}

function renderMateriaDetalhe(id) {
  var m = estado.estudos.materias.find(function(x){ return x.id === id; });
  if (!m) return;
  var hoje = hojeStr();
  var tarefas = estado.tarefas.filter(function(t){return t.materia === m.nome});
  var provas = estado.estudos.provas.filter(function(p){return p.materia === m.nome});
  var trabs = estado.estudos.trabalhos.filter(function(t){return t.materia === m.nome});
  var anotacoes = m.anotacoes || [];

  // Header
  var hdr = document.getElementById('matDetalheHeader');
  if (hdr) {
    hdr.innerHTML = '<span class="mat-detalhe-dot" style="background:' + m.cor + '"></span>' +
      '<span class="mat-detalhe-nome">' + esc(m.nome) + '</span>';
  }

  // Progress
  var tarefasDone = tarefas.filter(function(t){return t.feito}).length;
  var trabsDone = trabs.filter(function(t){return t.status === 'concluido'}).length;
  var totalItems = tarefas.length + trabs.length;
  var totalDone = tarefasDone + trabsDone;
  var pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
  var progEl = document.getElementById('matDetalheProgresso');
  if (progEl) {
    progEl.innerHTML = '<div class="mat-prog-linha"><span>Progresso geral</span><span class="mat-prog-pct" style="color:' + m.cor + '">' + pct + '%</span></div>' +
      '<div class="materia-barra" style="height:12px"><div class="materia-fill" style="width:' + pct + '%;background:' + m.cor + '"></div></div>' +
      '<div class="mat-prog-detalhe">✅ ' + tarefasDone + '/' + tarefas.length + ' tarefas · 📄 ' + trabsDone + '/' + trabs.length + ' trabalhos</div>';
  }

  // Pendentes summary
  var provasPend = provas.filter(function(p){return p.data && p.data >= hoje});
  var trabsPend = trabs.filter(function(t){return t.status !== 'concluido'});
  var tarefasPend = tarefas.filter(function(t){return !t.feito});
  var pendEl = document.getElementById('matDetalhePendentes');
  if (pendEl) {
    var ph = '';
    var totalPend = provasPend.length + trabsPend.length + tarefasPend.length;
    if (totalPend > 0) {
      ph += '<div class="mat-pend-card">';
      ph += '<div class="mat-pend-titulo">⏳ Atividades pendentes (' + totalPend + ')</div>';
      if (tarefasPend.length > 0) {
        ph += '<div class="mat-pend-secao">✅ Tarefas (' + tarefasPend.length + ')</div>';
        tarefasPend.slice(0, 5).forEach(function(t) {
          ph += '<div class="mat-pend-item">' + esc(t.texto) + (t.data ? ' · ' + dataLocal(t.data) : '') + '</div>';
        });
        if (tarefasPend.length > 5) ph += '<div class="mat-pend-item" style="color:var(--txt3)">...e mais ' + (tarefasPend.length - 5) + '</div>';
      }
      if (provasPend.length > 0) {
        ph += '<div class="mat-pend-secao">📝 Provas (' + provasPend.length + ')</div>';
        provasPend.forEach(function(p) {
          ph += '<div class="mat-pend-item">' + esc(p.texto) + ' · ' + dataLocal(p.data) + '</div>';
        });
      }
      if (trabsPend.length > 0) {
        ph += '<div class="mat-pend-secao">📄 Trabalhos (' + trabsPend.length + ')</div>';
        trabsPend.slice(0, 5).forEach(function(t) {
          ph += '<div class="mat-pend-item">' + esc(t.texto) + (t.data ? ' · ' + dataLocal(t.data) : '') + '</div>';
        });
        if (trabsPend.length > 5) ph += '<div class="mat-pend-item" style="color:var(--txt3)">...e mais ' + (trabsPend.length - 5) + '</div>';
      }
      ph += '</div>';
    } else {
      ph += '<div class="mat-pend-card mat-pend-ok">🎉 Tudo em dia! Nenhuma atividade pendente.</div>';
    }
    pendEl.innerHTML = ph;
  }

  // Tarefas
  var tEl = document.getElementById('matDetalheTarefas');
  if (tEl) {
    var th = '';
    if (tarefas.length === 0) {
      th = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma tarefa nesta matéria.</div>';
    } else {
      tarefas.forEach(function(t) {
        th += '<div class="pv-card" style="border-left:4px solid ' + m.cor + ';opacity:' + (t.feito ? '.55' : '1') + '">';
        th += '<div class="duce-nome" style="text-decoration:' + (t.feito ? 'line-through' : 'none') + '">' + (t.feito ? '✅ ' : '⬜ ') + esc(t.texto) + '</div>';
        if (t.data) th += '<div class="duce-info">📅 ' + dataLocal(t.data) + (t.hora ? ' ' + t.hora : '') + '</div>';
        th += '</div>';
      });
    }
    tEl.innerHTML = th;
  }

  // Provas
  var pEl = document.getElementById('matDetalheProvas');
  if (pEl) {
    var pvh = '';
    if (provas.length === 0) {
      pvh = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma prova nesta matéria.</div>';
    } else {
      provas.forEach(function(p) {
        pvh += '<div class="pv-card" style="border-left:4px solid #e17055">';
        pvh += '<div class="duce-nome">' + esc(p.texto) + '</div>';
        pvh += '<div class="duce-info">📅 ' + dataLocal(p.data) + (p.hora ? ' ' + p.hora : '') + '</div>';
        if (p.conteudo) pvh += '<div class="duce-info">📋 ' + esc(p.conteudo) + '</div>';
        pvh += '<div class="duce-botoes"><button class="btn btn-s" style="font-size:.65rem;padding:.15rem .4rem" onclick="abrirProvaModal(\'' + p.id + '\')">✏️</button>';
        pvh += '<button class="btn btn-d" style="font-size:.65rem;padding:.15rem .4rem" onclick="delProva(\'' + p.id + '\')">🗑️</button></div>';
        pvh += '</div>';
      });
    }
    pEl.innerHTML = pvh;
  }

  // Trabalhos
  var trEl = document.getElementById('matDetalheTrabalhos');
  if (trEl) {
    var trh = '';
    if (trabs.length === 0) {
      trh = '<div style="color:var(--txt3);font-size:.82rem">Nenhum trabalho nesta matéria.</div>';
    } else {
      trabs.forEach(function(t) {
        var statusIcon = t.status === 'concluido' ? '✅' : t.status === 'fazendo' ? '🔄' : '⏳';
        trh += '<div class="pv-card" style="border-left:4px solid #0984e3">';
        trh += '<div class="duce-nome">' + statusIcon + ' ' + esc(t.texto) + '</div>';
        trh += '<div class="duce-info">📅 ' + dataLocal(t.data) + (t.hora ? ' ' + t.hora : '') + ' · ' + (t.status === 'concluido' ? 'Concluído' : t.status === 'fazendo' ? 'Fazendo' : 'Pendente') + '</div>';
        if (t.descricao) trh += '<div class="duce-info">📋 ' + esc(t.descricao) + '</div>';
        trh += '<div class="duce-botoes"><button class="btn btn-s" style="font-size:.65rem;padding:.15rem .4rem" onclick="abrirTrabalhoModal(\'' + t.id + '\')">✏️</button>';
        trh += '<button class="btn btn-d" style="font-size:.65rem;padding:.15rem .4rem" onclick="delTrabalho(\'' + t.id + '\')">🗑️</button></div>';
        trh += '</div>';
      });
    }
    trEl.innerHTML = trh;
  }

  // Anotacoes
  renderAnotacoes();

  // Config
  var metaEl = document.getElementById('matMetaHoras');
  if (metaEl) metaEl.value = m.metaHoras || 0;
}

// --- Anotacoes CRUD ---
function addAnotacao() {
  anotEditIdx = null;
  var modal = document.getElementById('anotacaoModal');
  if (!modal) return;
  modal.classList.add('visivel');
  document.getElementById('anotTituloInput').value = '';
  document.getElementById('anotContInput').value = '';
  document.getElementById('anotModalTitle').textContent = '📓 Nova anotação';
}

function editarAnotacao(idx) {
  anotEditIdx = idx;
  var m = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
  if (!m || !m.anotacoes || !m.anotacoes[idx]) return;
  var a = m.anotacoes[idx];
  var modal = document.getElementById('anotacaoModal');
  if (!modal) return;
  modal.classList.add('visivel');
  document.getElementById('anotTituloInput').value = a.titulo || '';
  document.getElementById('anotContInput').value = a.conteudo || '';
  document.getElementById('anotModalTitle').textContent = '✏️ Editar anotação';
}

function fecharAnotacaoModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('anotacaoModal').classList.remove('visivel');
  anotEditIdx = null;
}

function salvarAnotacao() {
  var m = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
  if (!m) return;
  if (!m.anotacoes) m.anotacoes = [];
  var titulo = document.getElementById('anotTituloInput').value.trim();
  if (!titulo) return;
  var conteudo = document.getElementById('anotContInput').value.trim();
  var agora = new Date().toLocaleString('pt-BR');
  if (anotEditIdx !== null && m.anotacoes[anotEditIdx]) {
    m.anotacoes[anotEditIdx].titulo = titulo;
    m.anotacoes[anotEditIdx].conteudo = conteudo;
    m.anotacoes[anotEditIdx].editada = agora;
  } else {
    m.anotacoes.push({titulo: titulo, conteudo: conteudo, data: agora, id: uid()});
  }
  salvarEstado();
  fecharAnotacaoModal();
  renderAnotacoes();
}

function delAnotacao(idx) {
  var m = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
  if (!m || !m.anotacoes) return;
  showConfirm('Excluir esta anotação?', function() {
    m.anotacoes.splice(idx, 1);
    salvarEstado();
    renderAnotacoes();
  });
}

function renderAnotacoes() {
  var m = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
  var el = document.getElementById('matDetalheAnotacoes');
  if (!el || !m) return;
  var anotacoes = m.anotacoes || [];
  var h = '';
  if (anotacoes.length === 0) {
    h = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma anotação. Clique em ＋ Adicionar.</div>';
  } else {
    anotacoes.forEach(function(a, i) {
      h += '<div class="anot-card">';
      h += '<div class="anot-titulo">📌 ' + esc(a.titulo) + '</div>';
      if (a.conteudo) h += '<div class="anot-conteudo">' + esc(a.conteudo).replace(/\n/g, '<br>') + '</div>';
      h += '<div class="anot-data">' + (a.editada ? '✏️ ' + esc(a.editada) : '📅 ' + esc(a.data || '')) + '</div>';
      h += '<div class="anot-botoes">';
      h += '<button class="btn btn-s" style="font-size:.65rem;padding:.15rem .4rem" onclick="editarAnotacao(' + i + ')">✏️</button>';
      h += '<button class="btn btn-d" style="font-size:.65rem;padding:.15rem .4rem" onclick="delAnotacao(' + i + ')">🗑️</button>';
      h += '</div></div>';
    });
  }
  el.innerHTML = h;
}

// --- Meta Horas ---
function salvarMetaHoras() {
  var m = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
  if (!m) return;
  m.metaHoras = parseFloat(document.getElementById('matMetaHoras').value) || 0;
  salvarEstado();
}

// --- Helper: open tarefa modal with materia pre-filled ---
function abrirTarefaModalComMateria() {
  var m = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
  // Navigate to tarefas page and pre-fill materia in the quick-add
  navegarPara('tarefas');
  if (m) {
    setTimeout(function() {
      var el = document.getElementById('tarefaMateria');
      if (el) el.value = m.nome;
      var inp = document.getElementById('tarefaInput');
      if (inp) inp.focus();
    }, 100);
  }
}

// ---- PROVAS: CRUD ----
var provaEditId = null;

function abrirProvaModal(editId) {
  provaEditId = editId || null;
  var modal = document.getElementById('provaModal');
  if (!modal) return;
  modal.classList.add('visivel');
  // Populate materias datalist
  var dl = document.getElementById('provaMateriaList');
  if (dl) {
    var items = '';
    (estado.estudos.materias || []).forEach(function(m) {
      items += '<option value="' + esc(m.nome) + '">';
    });
    dl.innerHTML = items;
  }
  if (provaEditId) {
    var p = estado.estudos.provas.find(function(x){ return x.id === provaEditId; });
    if (p) {
      document.getElementById('provaModalTitle').textContent = '✏️ Editar prova';
      document.getElementById('prvTitulo').value = p.texto || '';
      document.getElementById('prvMateria').value = p.materia || '';
      document.getElementById('prvData').value = p.data || '';
      document.getElementById('prvHora').value = p.hora || '';
      document.getElementById('prvConteudo').value = p.conteudo || '';
      document.getElementById('prvLembrete').value = p.lembrete !== undefined ? String(p.lembrete) : String(estado.notifConfig.provas);
      return;
    }
  }
  document.getElementById('provaModalTitle').textContent = '＋ Nova prova';
  document.getElementById('prvTitulo').value = '';
  document.getElementById('prvMateria').value = '';
  // Pre-fill materia if opened from materia detail
  if (matDetalheIdAtual) {
    var mPre = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
    if (mPre) document.getElementById('prvMateria').value = mPre.nome;
  }
  document.getElementById('prvData').value = '';
  document.getElementById('prvHora').value = '';
  document.getElementById('prvConteudo').value = '';
  document.getElementById('prvLembrete').value = String(estado.notifConfig.provas);
}

function fecharProvaModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var modal = document.getElementById('provaModal');
  if (modal) modal.classList.remove('visivel');
  provaEditId = null;
}

function salvarProva() {
  var titulo = document.getElementById('prvTitulo').value.trim();
  var materia = document.getElementById('prvMateria').value.trim();
  var data = document.getElementById('prvData').value;
  var hora = document.getElementById('prvHora').value;
  var conteudo = document.getElementById('prvConteudo').value.trim();
  var lembrete = parseInt(document.getElementById('prvLembrete').value);
  if (!titulo) return;
  if (provaEditId) {
    var p = estado.estudos.provas.find(function(x){ return x.id === provaEditId; });
    if (p) {
      p.texto = titulo;
      p.materia = materia;
      p.data = data;
      p.hora = hora;
      p.conteudo = conteudo;
      p.lembrete = lembrete;
    }
  } else {
    estado.estudos.provas.push({
      id: uid(),
      texto: titulo,
      materia: materia,
      data: data,
      hora: hora,
      conteudo: conteudo,
      lembrete: lembrete,
      concluido: false
    });
  }
  salvarEstado();
  fecharProvaModal();
  renderProvas();
  renderCalendario();
  renderDashboard();
  registrarUsoPlus();
}

function delProva(id) {
  showConfirm('Excluir esta prova?', function() {
    estado.estudos.provas = estado.estudos.provas.filter(function(p){ return p.id !== id; });
    salvarEstado(); renderProvas(); renderCalendario(); renderDashboard();
  });
}

function renderProvas() {
  var html = '';
  var hoje = hojeStr();
  estado.estudos.provas.sort(function(a,b){ return (a.data||'z').localeCompare(b.data||'z'); });
  estado.estudos.provas.forEach(function(p) {
    var dias = p.data ? Math.ceil((new Date(p.data + 'T12:00:00') - new Date()) / 86400000) : null;
    var passou = dias !== null && dias < 0;
    var urgente = dias !== null && dias >= 0 && dias <= 3;
    var corMat = (estado.estudos.materias.find(function(m){ return m.nome === p.materia; }) || {}).cor;
    var corBorda = corMat || 'var(--cor2)';
    var concluido = p.concluido ? true : false;
    html += '<div class="pv-card' + (concluido ? ' pv-concluido' : '') + (urgente && !concluido ? ' pv-urgente' : '') + (passou && !concluido ? ' pv-passou' : '') + '" data-busca-id="' + p.id + '" style="border-left:4px solid ' + corBorda + '">'; 
    html += '<div class="pv-top">';
    html += '<span class="pv-mat" style="background:' + corBorda + ';color:#fff">' + (p.materia ? esc(p.materia) : '—') + '</span>';
    if (p.hora) html += '<span class="pv-hora">🕐 ' + esc(p.hora) + '</span>';
    html += '</div>';
    html += '<div class="pv-titulo">📝 ' + esc(p.texto) + '</div>';
    if (p.conteudo) html += '<div class="pv-conteudo">📋 ' + esc(p.conteudo) + '</div>';
    html += '<div class="pv-footer">';
    html += '<span class="pv-data">📅 ' + (p.data ? dataLocal(p.data) : 'sem data') + '</span>';
    if (dias !== null && !passou) {
      html += '<span class="pv-countdown' + (urgente ? ' pv-count-urg' : '') + '">' + dias + ' dia' + (dias !== 1 ? 's' : '') + '</span>';
    } else if (passou) {
      html += '<span class="pv-countdown pv-count-passou">passou</span>';
    }
    if (p.lembrete >= 0 && estado.notifConfig && estado.notifConfig.global) html += '<span class="notif-badge-active">🔔</span>';
    html += '</div>';
    html += '<div class="pv-acoes">';
    html += '<button class="btn btn-s pv-btn-check" onclick="concluirProva(\'' + p.id + '\')">' + (concluido ? '↩️ Reabrir' : '✅ Concluir') + '</button>';
    html += '<button class="btn btn-s pv-btn-edit" onclick="abrirProvaModal(\'' + p.id + '\')">✏️ Editar</button>';
    html += '<button class="btn btn-d pv-btn-del" onclick="delProva(\'' + p.id + '\')">🗑️ Excluir</button>';
    html += '</div>';
    html += '</div>';
  });
  if (!html) html = '<div class="pv-empty"><div class="pv-empty-icon">📭</div><div class="pv-empty-text">Nenhuma prova registrada</div></div>';
  document.getElementById('provasLista').innerHTML = html;
}

// ---- TRABALHOS: CRUD ----
var trabalhoEditId = null;

var statusTrabIcons = {
  pendente: '⏳',
  fazendo: '🔄',
  concluido: '✅'
};
var statusTrabCores = {
  pendente: 'var(--cor3)',
  fazendo: 'var(--amarelo)',
  concluido: 'var(--verde)'
};

function abrirTrabalhoModal(editId) {
  trabalhoEditId = editId || null;
  var modal = document.getElementById('trabalhoModal');
  if (!modal) return;
  modal.classList.add('visivel');
  // Populate materias datalist
  var dl = document.getElementById('trabMateriaList');
  if (dl) {
    var items = '';
    (estado.estudos.materias || []).forEach(function(m) {
      items += '<option value="' + esc(m.nome) + '">';
    });
    dl.innerHTML = items;
  }
  if (trabalhoEditId) {
    var tr = estado.estudos.trabalhos.find(function(x){ return x.id === trabalhoEditId; });
    if (tr) {
      document.getElementById('trabModalTitle').textContent = '✏️ Editar trabalho';
      document.getElementById('trbTitulo').value = tr.texto || '';
      document.getElementById('trbMateria').value = tr.materia || '';
      document.getElementById('trbPrazo').value = tr.data || '';
      document.getElementById('trbDescricao').value = tr.descricao || '';
      document.getElementById('trbStatus').value = tr.status || 'pendente';
      document.getElementById('trbLembrete').value = tr.lembrete !== undefined ? String(tr.lembrete) : String(estado.notifConfig.trabalhos);
      return;
    }
  }
  document.getElementById('trabModalTitle').textContent = '＋ Novo trabalho';
  document.getElementById('trbTitulo').value = '';
  document.getElementById('trbMateria').value = '';
  document.getElementById('trbPrazo').value = '';
  document.getElementById('trbDescricao').value = '';
  document.getElementById('trbStatus').value = 'pendente';
  document.getElementById('trbLembrete').value = String(estado.notifConfig.trabalhos);
  // Pre-fill materia if opened from materia detail
  if (matDetalheIdAtual) {
    var mPre = estado.estudos.materias.find(function(x){ return x.id === matDetalheIdAtual; });
    if (mPre) document.getElementById('trbMateria').value = mPre.nome;
  }
}

function fecharTrabalhoModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var modal = document.getElementById('trabalhoModal');
  if (modal) modal.classList.remove('visivel');
  trabalhoEditId = null;
}

function salvarTrabalho() {
  var titulo = document.getElementById('trbTitulo').value.trim();
  var materia = document.getElementById('trbMateria').value.trim();
  var prazo = document.getElementById('trbPrazo').value;
  var descricao = document.getElementById('trbDescricao').value.trim();
  var status = document.getElementById('trbStatus').value;
  var lembrete = parseInt(document.getElementById('trbLembrete').value);
  if (!titulo) return;
  if (trabalhoEditId) {
    var tr = estado.estudos.trabalhos.find(function(x){ return x.id === trabalhoEditId; });
    if (tr) {
      tr.texto = titulo;
      tr.materia = materia;
      tr.data = prazo;
      tr.descricao = descricao;
      tr.status = status;
      tr.lembrete = lembrete;
    }
  } else {
    estado.estudos.trabalhos.push({
      id: uid(),
      texto: titulo,
      materia: materia,
      data: prazo,
      descricao: descricao,
      status: status,
      lembrete: lembrete
    });
  }
  salvarEstado();
  fecharTrabalhoModal();
  renderTrabalhos();
  renderCalendario();
  renderDashboard();
  registrarUsoPlus();
}

function concluirProva(id) {
  var p = estado.estudos.provas.find(function(x){ return x.id === id; });
  if (p) {
    p.concluido = !p.concluido;
    salvarEstado(); renderProvas(); renderCalendario(); renderDashboard();
  }
}

function concluirTrabalho(id) {
  var tr = estado.estudos.trabalhos.find(function(x){ return x.id === id; });
  if (tr) {
    tr.status = tr.status === 'concluido' ? 'pendente' : 'concluido';
    salvarEstado(); renderTrabalhos(); renderCalendario(); renderDashboard();
  }
}

function delTrabalho(id) {
  showConfirm('Excluir este trabalho?', function() {
    estado.estudos.trabalhos = estado.estudos.trabalhos.filter(function(t){ return t.id !== id; });
    salvarEstado(); renderTrabalhos(); renderCalendario(); renderDashboard();
  });
}

function renderTrabalhos() {
  var html = '';
  var hoje = hojeStr();
  estado.estudos.trabalhos.sort(function(a,b){ return (a.data||'z').localeCompare(b.data||'z'); });
  estado.estudos.trabalhos.forEach(function(tr) {
    var dias = tr.data ? Math.ceil((new Date(tr.data + 'T12:00:00') - new Date()) / 86400000) : null;
    var passou = dias !== null && dias < 0;
    var urgente = dias !== null && dias >= 0 && dias <= 3;
    var corMat = (estado.estudos.materias.find(function(m){ return m.nome === tr.materia; }) || {}).cor;
    var corBorda = corMat || 'var(--azul)';
    var statusIcon = statusTrabIcons[tr.status] || '⏳';
    var statusCor = statusTrabCores[tr.status] || 'var(--cor3)';
    var concluido = tr.status === 'concluido';
    html += '<div class="tb-card' + (concluido ? ' tb-concluido' : '') + (urgente && !concluido ? ' tb-urgente' : '') + '" data-busca-id="' + tr.id + '" style="border-left:4px solid ' + corBorda + '">'; 
    html += '<div class="tb-top">';
    html += '<span class="tb-mat" style="background:' + corBorda + ';color:#fff">' + (tr.materia ? esc(tr.materia) : '—') + '</span>';
    html += '<span class="tb-status" style="background:' + statusCor + ';color:#fff">' + statusIcon + ' ' + esc(tr.status.charAt(0).toUpperCase() + tr.status.slice(1)) + '</span>';
    html += '</div>';
    html += '<div class="tb-titulo">' + esc(tr.texto) + '</div>';
    if (tr.descricao) html += '<div class="tb-desc">📋 ' + esc(tr.descricao) + '</div>';
    html += '<div class="tb-footer">';
    html += '<span class="tb-prazo">📅 ' + (tr.data ? dataLocal(tr.data) : 'sem prazo') + '</span>';
    if (dias !== null && !passou && !concluido) {
      html += '<span class="tb-countdown' + (urgente ? ' tb-count-urg' : '') + '">' + dias + ' dia' + (dias !== 1 ? 's' : '') + '</span>';
    } else if (passou && !concluido) {
      html += '<span class="tb-countdown tb-count-atrasado">atrasado</span>';
    }
    if (tr.lembrete >= 0 && estado.notifConfig && estado.notifConfig.global) html += '<span class="notif-badge-active">🔔</span>';
    html += '</div>';
    html += '<div class="tb-acoes">';
    html += '<button class="btn btn-s tb-btn-check" onclick="concluirTrabalho(\'' + tr.id + '\')">' + (concluido ? '↩️ Reabrir' : '✅ Concluir') + '</button>';
    html += '<button class="btn btn-s tb-btn-edit" onclick="abrirTrabalhoModal(\'' + tr.id + '\')">✏️ Editar</button>';
    html += '<button class="btn btn-d tb-btn-del" onclick="delTrabalho(\'' + tr.id + '\')">🗑️ Excluir</button>';
    html += '</div>';
    html += '</div>';
  });
  if (!html) html = '<div class="tb-empty"><div class="tb-empty-icon">📭</div><div class="tb-empty-text">Nenhum trabalho registrado</div></div>';
  document.getElementById('trabalhosLista').innerHTML = html;
}

// ---- HABITOS ----
function addHabito() {
  var nome = document.getElementById('habitoInput').value.trim();
  if (!nome) return;
  var emoji = document.getElementById('habitoEmoji').value.trim() || '✨';
  estado.habitos.push({nome:nome, emoji:emoji, id:uid(), semanas:{}});
  document.getElementById('habitoInput').value = '';
  document.getElementById('habitoEmoji').value = '';
  salvarEstado(); renderHabitos();
  registrarUsoPlus();
}

function delHabito(id) {
  estado.habitos = estado.habitos.filter(function(h){return h.id!==id;});
  salvarEstado(); renderHabitos();
}

function toggleHabitoDia(hid, diaIdx) {
  var h = estado.habitos.find(function(x){return x.id===hid;});
  if (!h) return;
  var sk = getSemanaKey();
  if (!h.semanas[sk]) h.semanas[sk] = [false,false,false,false,false,false,false];
  h.semanas[sk][diaIdx] = !h.semanas[sk][diaIdx];
  salvarEstado(); renderHabitos();
  registrarUsoPlus();
}

function renderHabitos() {
  var sk = getSemanaKey();
  var diasNomes = ['D','S','T','Q','Q','S','S'];
  var html = '';
  estado.habitos.forEach(function(h) {
    var streak = calcularStreak(h);
    var prog = progressoSemanaHabito(h);
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    html += '<div class="habito-card" data-busca-id="' + h.id + '">';
    html += '<div class="habito-header">';
    html += '<div class="habito-emoji">' + (h.emoji||'✨') + '</div>';
    html += '<div class="habito-nome">' + esc(h.nome) + '</div>';
    html += '<div class="habito-streak">🔥 ' + streak + '</div>';
    html += '<button class="habito-del" onclick="delHabito(\''+h.id+'\')">✕</button>';
    html += '</div>';
    html += '<div class="habito-progresso"><div class="habito-progresso-bar" style="width:'+prog.pct+'%"></div><span class="habito-progresso-txt">'+prog.feitos+'/'+prog.total+'</span></div>';
    html += '<div class="habito-dias">';
    for (var i = 0; i < 7; i++) {
      html += '<div class="habito-dia' + (arr[i] ? ' feito' : '') + '" onclick="toggleHabitoDia(\''+h.id+'\','+i+')"><span class="hd-letra">' + diasNomes[i] + '</span><span class="hd-icon">' + (arr[i] ? '✅' : '⬜') + '</span></div>';
    }
    html += '</div>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem;text-align:center">Nenhum hábito criado. Adicione o primeiro!</div>';
  document.getElementById('habitosGrid').innerHTML = html;
}

// ============================================================
// PART 3: Ferramentas Extras
// ============================================================

// ---- POMODORO ----
function startPomodoro() {
  if (pomoInterval) clearInterval(pomoInterval);
  pomoSegundos = estado.pomodoroMin * 60;
  pomoRodando = true;
  pomoPausa = false;
  pomoInterval = setInterval(function() {
    if (pomoPausa) return;
    pomoSegundos--;
    if (pomoSegundos <= 0) {
      clearInterval(pomoInterval);
      pomoRodando = false;
      estado.pomodorosHoje = (estado.pomodorosData === hojeStr()) ? (estado.pomodorosHoje + 1) : 1;
      estado.pomodorosData = hojeStr();
      salvarEstado();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('OrganizaJá', {body:'Pomodoro concluído! Hora da pausa 🎉', icon:'/favicon.ico'});
      }
      playBeep();
      renderPomodoro();
      return;
    }
    renderPomodoroTimer();
  }, 1000);
  renderPomodoro();
}

function pausarPomodoro() {
  pomoPausa = !pomoPausa;
  renderPomodoro();
}

function resetPomodoro() {
  if (pomoInterval) clearInterval(pomoInterval);
  pomoRodando = false;
  pomoPausa = false;
  pomoSegundos = estado.pomodoroMin * 60;
  renderPomodoro();
}

function setPomoMin(v) {
  estado.pomodoroMin = parseInt(v) || 25;
  if (!pomoRodando) pomoSegundos = estado.pomodoroMin * 60;
  salvarEstado();
  renderPomodoro();
}

function renderPomodoro() {
  var hoje = hojeStr();
  var total = (estado.pomodorosData === hoje) ? estado.pomodorosHoje : 0;
  document.getElementById('pomoCiclos').textContent = total;
  var btn = document.getElementById('pomoStart');
  if (btn) btn.textContent = pomoRodando ? (pomoPausa ? '▶ Continuar' : '⏸ Pausar') : '▶ Iniciar';
  renderPomodoroTimer();
}

function renderPomodoroTimer() {
  var m = Math.floor(pomoSegundos / 60);
  var s = pomoSegundos % 60;
  var el = document.getElementById('pomoTempo');
  if (el) el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function playBeep() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 800;
    osc.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch(e){}
}

// ---- METAS ----
// ---- METAS (sistema completo) ----
var metaFiltroAtivo = 'todas';
var metaEditId = null; // null=nova, id=editando

function metaSliderInput(slider) {
  var card = slider.closest('.meta-card');
  if (!card) return;
  var bar = card.querySelector('.meta-progresso');
  var label = card.querySelector('.meta-progress-label');
  if (bar) bar.style.width = slider.value + '%';
  if (label) label.textContent = slider.value + '%';
}
var metaCategorias = [
  {val:'pessoal', lbl:'Pessoal', icon:'👤'},
  {val:'estudos', lbl:'Estudos', icon:'📚'},
  {val:'trabalho', lbl:'Trabalho', icon:'💼'},
  {val:'saude', lbl:'Saúde', icon:'💪'},
  {val:'financas', lbl:'Finanças', icon:'💰'},
  {val:'outro', lbl:'Outro', icon:'📌'}
];

var metaEncorajamentos = [
  'Você está indo muito bem! 🌟',
  'Cada passo conta! 👣',
  'Continue assim! 💪',
  'Quase lá, não desista! 🚀',
  'Que progresso incrível! ✨',
  'Você é dedicado(a)! 🏆',
  'Mais um passo rumo ao objetivo! 🎯',
  'Sua consistência é inspiradora! 💖'
];

var metaCelebracoes = [
  '🎉 Parabéns! Meta concluída!',
  '🏆 Sensacional! Você conseguiu!',
  '🌟 Que conquista incrível!',
  '👏 Meta alcançada! Que orgulho!',
  '🎊 Você é demais!',
  '💪 Determinação que inspira!'
];

function calcularXPMeta(meta) {
  if (!meta.feito) return 0;
  var base = 10;
  // Bônus de conclusão antecipada
  if (meta.prazo && meta.concluidaData) {
    if (meta.concluidaData < meta.prazo) base += 5;
  }
  // Bônus por categoria
  if (meta.categoria === 'estudos') base += 2;
  if (meta.categoria === 'saude') base += 2;
  // Bônus de progresso incremental (meta bem detalhada)
  if (meta.descricao && meta.descricao.length > 20) base += 1;
  return base;
}

function calcularNivelMetas() {
  var xp = estado.metasXpTotal || 0;
  if (xp <= 0) return {nivel: 1, titulo: 'Iniciante', xp: 0, proximo: 30, icone: '🌱'};
  if (xp < 30) return {nivel: 1, titulo: 'Iniciante', xp: xp, proximo: 30, icone: '🌱'};
  if (xp < 80) return {nivel: 2, titulo: 'Dedicado(a)', xp: xp, proximo: 80, icone: '🌿'};
  if (xp < 160) return {nivel: 3, titulo: 'Focado(a)', xp: xp, proximo: 160, icone: '🌳'};
  if (xp < 300) return {nivel: 4, titulo: 'Conquistador(a)', xp: xp, proximo: 300, icone: '⭐'};
  if (xp < 500) return {nivel: 5, titulo: 'Vencedor(a)', xp: xp, proximo: 500, icone: '🏆'};
  if (xp < 800) return {nivel: 6, titulo: 'Lendário(a)', xp: xp, proximo: 800, icone: '💎'};
  return {nivel: 7, titulo: 'Mestre', xp: xp, proximo: xp + 100, icone: '👑'};
}

function calcularStreakMetas() {
  var hoje = hojeStr();
  // Verificar se já contamos hoje
  if (estado.metasStreakData === hoje) return estado.metasStreak;
  // Verificar se houve meta concluída ontem
  var ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  var ontemStr = ontem.getFullYear() + '-' + String(ontem.getMonth()+1).padStart(2,'0') + '-' + String(ontem.getDate()).padStart(2,'0');
  var teveOntem = estado.metas.some(function(m) { return m.concluidaData === ontemStr; });
  if (!teveOntem && estado.metasStreakData !== ontemStr) {
    // Streak quebrou
    estado.metasStreak = 0;
  }
  return estado.metasStreak;
}

function registrarConclusaoMeta(meta) {
  meta.feito = true;
  meta.progresso = 100;
  meta.concluidaData = hojeStr();
  var xpGanho = calcularXPMeta(meta);
  meta.xp = xpGanho;
  estado.metasXpTotal = (estado.metasXpTotal || 0) + xpGanho;
  // Streak
  var hoje = hojeStr();
  if (estado.metasStreakData !== hoje) {
    if (estado.metasStreakData !== '') {
      var ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      var ontemStr = ontem.getFullYear() + '-' + String(ontem.getMonth()+1).padStart(2,'0') + '-' + String(ontem.getDate()).padStart(2,'0');
      if (estado.metasStreakData === ontemStr) {
        estado.metasStreak = (estado.metasStreak || 0) + 1;
      } else {
        estado.metasStreak = 1;
      }
    } else {
      estado.metasStreak = 1;
    }
    estado.metasStreakData = hoje;
  }
}

function abrirMetaModal(id) {
  metaEditId = id || null;
  var modal = document.getElementById('metaModal');
  var title = document.getElementById('metaModalTitle');
  if (metaEditId) {
    var m = estado.metas.find(function(x) { return x.id === metaEditId; });
    if (!m) return;
    title.textContent = '✏️ Editar meta';
    document.getElementById('metaModTexto').value = m.texto || '';
    document.getElementById('metaModDesc').value = m.descricao || '';
    document.getElementById('metaModPrazo').value = m.prazo || '';
    document.getElementById('metaModCategoria').value = m.categoria || 'pessoal';
    document.getElementById('metaModProgresso').value = m.progresso || 0;
    document.getElementById('metaModProgressoVal').textContent = (m.progresso || 0) + '%';
  } else {
    title.textContent = '🎯 Nova meta';
    document.getElementById('metaModTexto').value = '';
    document.getElementById('metaModDesc').value = '';
    document.getElementById('metaModPrazo').value = '';
    document.getElementById('metaModCategoria').value = 'pessoal';
    document.getElementById('metaModProgresso').value = 0;
    document.getElementById('metaModProgressoVal').textContent = '0%';
  }
  modal.classList.add('visivel');
}

function fecharMetaModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  document.getElementById('metaModal').classList.remove('visivel');
  metaEditId = null;
}

function salvarMetaModal() {
  var texto = document.getElementById('metaModTexto').value.trim();
  if (!texto) return;
  var desc = document.getElementById('metaModDesc').value.trim();
  var prazo = document.getElementById('metaModPrazo').value;
  var cat = document.getElementById('metaModCategoria').value;
  var prog = parseInt(document.getElementById('metaModProgresso').value) || 0;
  if (prog < 0) prog = 0;
  if (prog > 100) prog = 100;

  if (metaEditId) {
    var m = estado.metas.find(function(x) { return x.id === metaEditId; });
    if (m) {
      m.texto = texto;
      m.descricao = desc;
      m.prazo = prazo;
      m.categoria = cat;
      m.progresso = prog;
      if (prog === 100 && !m.feito) {
        registrarConclusaoMeta(m);
        mostrarCelebracaoMeta();
      }
    }
  } else {
    var nova = {
      id: uid(),
      texto: texto,
      descricao: desc,
      prazo: prazo,
      categoria: cat,
      progresso: prog,
      feito: prog === 100,
      criada: hojeStr(),
      concluidaData: prog === 100 ? hojeStr() : '',
      xp: 0
    };
    if (nova.feito) {
      nova.xp = calcularXPMeta(nova);
      estado.metasXpTotal = (estado.metasXpTotal || 0) + nova.xp;
    }
    estado.metas.push(nova);
  }
  document.getElementById('metaModal').classList.remove('visivel');
  metaEditId = null;
  salvarEstado();
  renderMetas();
}

function toggleMetaConclusao(id) {
  var m = estado.metas.find(function(x) { return x.id === id; });
  if (!m) return;
  if (m.feito) {
    // Desmarcar conclusão
    m.feito = false;
    m.concluidaData = '';
    if (m.xp > 0) {
      estado.metasXpTotal = Math.max(0, (estado.metasXpTotal || 0) - m.xp);
      m.xp = 0;
    }
  } else {
    registrarConclusaoMeta(m);
    mostrarCelebracaoMeta();
  }
  salvarEstado(); renderMetas();
  registrarUsoPlus();
}

function atualizarProgressoMeta(id, val) {
  var m = estado.metas.find(function(x) { return x.id === id; });
  if (!m) return;
  var prog = parseInt(val) || 0;
  if (prog < 0) prog = 0;
  if (prog > 100) prog = 100;
  m.progresso = prog;
  if (prog === 100 && !m.feito) {
    registrarConclusaoMeta(m);
    mostrarCelebracaoMeta();
  }
  salvarEstado(); renderMetas();
}

function delMeta(id) {
  var m = estado.metas.find(function(x) { return x.id === id; });
  var msg = m ? 'Excluir a meta "' + esc(m.texto) + '"?' : 'Excluir esta meta?';
  confirmar(msg, function() {
    // Reembolsar XP se estava concluída
    if (m && m.xp > 0) {
      estado.metasXpTotal = Math.max(0, (estado.metasXpTotal || 0) - m.xp);
    }
    estado.metas = estado.metas.filter(function(x) { return x.id !== id; });
    salvarEstado(); renderMetas();
  });
}

function filtrarMetas(filtro) {
  metaFiltroAtivo = filtro;
  renderMetas();
}

function mostrarCelebracaoMeta() {
  var el = document.getElementById('metaCelebracao');
  if (!el) return;
  var msg = metaCelebracoes[Math.floor(Math.random() * metaCelebracoes.length)];
  el.textContent = msg;
  el.classList.add('ativo');
  setTimeout(function() { el.classList.remove('ativo'); }, 2800);
}

function renderMetaStats() {
  var total = estado.metas.length;
  var ativas = estado.metas.filter(function(m) { return !m.feito; }).length;
  var concluidas = estado.metas.filter(function(m) { return m.feito; }).length;
  var xpTotal = estado.metasXpTotal || 0;
  var nivel = calcularNivelMetas();
  var streak = estado.metasStreak || 0;
  var html = '';
  html += '<div class="meta-stat-card"><span class="meta-stat-icon">📋</span><span class="meta-stat-val">' + total + '</span><span class="meta-stat-lbl">Total</span></div>';
  html += '<div class="meta-stat-card"><span class="meta-stat-icon">🔥</span><span class="meta-stat-val">' + ativas + '</span><span class="meta-stat-lbl">Ativas</span></div>';
  html += '<div class="meta-stat-card"><span class="meta-stat-icon">✅</span><span class="meta-stat-val">' + concluidas + '</span><span class="meta-stat-lbl">Concluídas</span></div>';
  html += '<div class="meta-stat-card"><span class="meta-stat-icon">' + nivel.icone + '</span><span class="meta-stat-val">' + nivel.nivel + '</span><span class="meta-stat-lbl">' + nivel.titulo + '</span></div>';
  html += '<div class="meta-stat-card"><span class="meta-stat-icon">⭐</span><span class="meta-stat-val">' + xpTotal + '</span><span class="meta-stat-lbl">XP</span></div>';
  if (streak > 0) {
    html += '<div class="meta-stat-card"><span class="meta-stat-icon">🔥</span><span class="meta-stat-val">' + streak + '</span><span class="meta-stat-lbl">Streak</span></div>';
  }
  var statsEl = document.getElementById('metaStats');
  if (statsEl) statsEl.innerHTML = html;
  // Nível bar
  var nivelEl = document.getElementById('metaNivelBar');
  if (nivelEl) {
    var pct = nivel.proximo > 0 ? Math.min(100, Math.round((nivel.xp / nivel.proximo) * 100)) : 100;
    nivelEl.innerHTML = '<div class="meta-nivel-info">' + nivel.icone + ' Nível ' + nivel.nivel + ' — ' + nivel.titulo + ' <span style="color:var(--txt3);font-size:.72rem">(' + nivel.xp + '/' + nivel.proximo + ' XP)</span></div>' + '<div class="meta-barra"><div class="meta-progresso" style="width:' + pct + '%"></div></div>';
  }
}

function renderMetaCards() {
  var lista = estado.metas;
  if (metaFiltroAtivo === 'ativas') lista = lista.filter(function(m) { return !m.feito; });
  else if (metaFiltroAtivo === 'concluidas') lista = lista.filter(function(m) { return m.feito; });

  var html = '';
  lista.forEach(function(m) {
    var catObj = metaCategorias.find(function(c) { return c.val === m.categoria; }) || {lbl:'Outro', icon:'📌'};
    var prazoTxt = m.prazo ? dataLocal(m.prazo) : 'Sem prazo';
    var atrasada = !m.feito && m.prazo && m.prazo < hojeStr();
    var pct = m.progresso || 0;

    html += '<div class="meta-card' + (m.feito ? ' meta-concluida' : '') + (atrasada ? ' meta-atrasada' : '') + '" data-busca-id="' + m.id + '">';
    html += '<div class="meta-card-top">';
    html += '<button class="meta-check' + (m.feito ? ' feito' : '') + '" onclick="toggleMetaConclusao(\'' + m.id + '\')" title="' + (m.feito ? 'Desmarcar' : 'Concluir') + '">' + (m.feito ? '✅' : '⬜') + '</button>';
    html += '<div class="meta-card-info">';
    html += '<span class="meta-nome">' + esc(m.texto) + '</span>';
    html += '<span class="meta-cat-badge">' + catObj.icon + ' ' + catObj.lbl + '</span>';
    html += '</div>';
    html += '<div class="meta-card-acoes">';
    html += '<button class="btn btn-s meta-btn-icon" onclick="abrirMetaModal(\'' + m.id + '\')" title="Editar">✏️</button>';
    html += '<button class="btn btn-s meta-btn-icon" onclick="delMeta(\'' + m.id + '\')" title="Excluir">🗑️</button>';
    html += '</div>';
    html += '</div>';

    if (m.descricao) {
      html += '<div class="meta-desc">' + esc(m.descricao) + '</div>';
    }

    html += '<div class="meta-card-mid">';
    html += '<div class="meta-barra"><div class="meta-progresso" style="width:' + pct + '%"></div></div>';
    html += '<div class="meta-progress-label">' + pct + '%</div>';
    html += '</div>';

    if (!m.feito) {
      html += '<div class="meta-slider-row">';
      html += '<input type="range" min="0" max="100" step="5" value="' + pct + '" class="meta-slider" data-meta-id="' + m.id + '" onchange="atualizarProgressoMeta(\'' + m.id + '\', this.value)" oninput="metaSliderInput(this)" title="Ajustar progresso">';
      html += '</div>';
    }

    html += '<div class="meta-card-foot">';
    html += '<span class="meta-prazo' + (atrasada ? ' atrasada' : '') + '">📅 ' + prazoTxt + '</span>';
    if (m.xp > 0) {
      html += '<span class="meta-xp-badge">⭐ +' + m.xp + ' XP</span>';
    }
    html += '</div>';

    html += '</div>';
  });

  if (!html) {
    var emptyMsg = metaFiltroAtivo === 'ativas' ? 'Nenhuma meta ativa. Crie uma nova meta! 🎯' : metaFiltroAtivo === 'concluidas' ? 'Nenhuma meta concluída ainda. Continue firme! 💪' : 'Nenhuma meta adicionada. Comece definindo um objetivo! 🌟';
    html = '<div class="meta-empty">' + emptyMsg + '</div>';
  }

  var listaEl = document.getElementById('metasLista');
  if (listaEl) listaEl.innerHTML = html;

  // Encorajamento aleatório se há metas em andamento
  var encEl = document.getElementById('metaEncorajamento');
  if (encEl && estado.metas.some(function(m) { return !m.feito && m.progresso > 0 && m.progresso < 100; })) {
    encEl.textContent = metaEncorajamentos[Math.floor(Math.random() * metaEncorajamentos.length)];
    encEl.style.display = 'block';
  } else if (encEl) {
    encEl.style.display = 'none';
  }
}

function renderMetas() {
  renderMetaStats();
  renderMetaCards();
  // Update filter tabs
  document.querySelectorAll('.meta-tab').forEach(function(t) {
    t.classList.toggle('ativo', t.getAttribute('data-filtro') === metaFiltroAtivo);
  });
}

// ---- NOTAS ----
function addNota() {
  var titulo = document.getElementById('notaTitulo').value.trim();
  var texto = document.getElementById('notaTexto').value.trim();
  if (!titulo && !texto) return;
  estado.notas.push({titulo:titulo, texto:texto, id:uid(), data:new Date().toISOString()});
  document.getElementById('notaTitulo').value = '';
  document.getElementById('notaTexto').value = '';
  salvarEstado(); renderNotas();
}

function delNota(id) {
  estado.notas = estado.notas.filter(function(x){return x.id!==id;});
  salvarEstado(); renderNotas();
}

function renderNotas() {
  var html = '';
  estado.notas.forEach(function(n) {
    html += '<div class="nota-card" data-busca-id="' + n.id + '">';
    html += '<div class="nota-titulo">' + esc(n.titulo || 'Sem título') + '</div>';
    html += '<div class="nota-texto">' + esc(n.texto).replace(/\n/g,'<br>') + '</div>';
    html += '<div class="nota-meta">' + dataLocal(n.data.slice(0,10)) + '</div>';
    html += '<button class="btn btn-d" style="font-size:.65rem" onclick="delNota(\''+n.id+'\')">Excluir</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma nota salva.</div>';
  document.getElementById('notasGrid').innerHTML = html;
}

// ---- LEMBRETES ----
function addLembrete() {
  var txt = document.getElementById('lembreteInput').value.trim();
  if (!txt) return;
  estado.lembretes.push({
    texto: txt,
    hora: document.getElementById('lembreteHora').value || '',
    data: document.getElementById('lembreteData').value || '',
    id: uid(),
    ativo: true
  });
  document.getElementById('lembreteInput').value = '';
  document.getElementById('lembreteHora').value = '';
  document.getElementById('lembreteData').value = '';
  salvarEstado(); renderLembretes(); scheduleLembretes();
}

function toggleLembrete(id) {
  var l = estado.lembretes.find(function(x){return x.id===id;});
  if (l) { l.ativo = !l.ativo; salvarEstado(); renderLembretes(); scheduleLembretes(); }
}

function delLembrete(id) {
  estado.lembretes = estado.lembretes.filter(function(x){return x.id!==id;});
  salvarEstado(); renderLembretes(); scheduleLembretes();
}

function renderLembretes() {
  var html = '';
  estado.lembretes.forEach(function(l) {
    html += '<div class="lembrete-item' + (l.ativo ? '' : ' inativo') + '" data-busca-id="' + l.id + '">';
    html += '<span class="lembrete-check" onclick="toggleLembrete(\''+l.id+'\')">' + (l.ativo ? '🔔' : '🔕') + '</span>';
    html += '<span class="lembrete-texto">' + esc(l.texto) + '</span>';
    html += '<span class="lembrete-hora">' + (l.hora || '') + (l.data ? ' ' + dataLocal(l.data) : '') + '</span>';
    html += '<button class="btn btn-d" style="font-size:.65rem" onclick="delLembrete(\''+l.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhum lembrete.</div>';
  document.getElementById('lembretesLista').innerHTML = html;
  renderNotifConfig();
}

function renderNotifConfig() {
  if (!estado.notifConfig) return;
  var nc = estado.notifConfig;
  document.getElementById('notifGlobal').checked = nc.global ? true : false;
  document.getElementById('notifTarefas').value = String(nc.tarefas);
  document.getElementById('notifProvas').value = String(nc.provas);
  document.getElementById('notifTrabalhos').value = String(nc.trabalhos);
  document.getElementById('notifEventos').value = String(nc.eventos);
  document.getElementById('notifQuietOn').checked = nc.quietHours && nc.quietHours.on ? true : false;
  document.getElementById('notifQuietStart').value = nc.quietHours ? nc.quietHours.start : '22:00';
  document.getElementById('notifQuietEnd').value = nc.quietHours ? nc.quietHours.end : '08:00';
  var qr = document.getElementById('notifQuietRow');
  if (qr) qr.style.display = nc.quietHours && nc.quietHours.on ? '' : 'none';
  var cs = document.getElementById('notifConfigSection');
  if (cs) {
    var items = cs.querySelectorAll('.notif-config-grid .notif-config-item, .notif-config-quiet');
    for (var i = 0; i < items.length; i++) {
      items[i].style.opacity = nc.global ? '1' : '0.4';
      items[i].style.pointerEvents = nc.global ? '' : 'none';
    }
  }
}

function saveNotifConfig() {
  if (!estado.notifConfig) estado.notifConfig = {};
  estado.notifConfig.global = document.getElementById('notifGlobal').checked;
  estado.notifConfig.tarefas = parseInt(document.getElementById('notifTarefas').value);
  estado.notifConfig.provas = parseInt(document.getElementById('notifProvas').value);
  estado.notifConfig.trabalhos = parseInt(document.getElementById('notifTrabalhos').value);
  estado.notifConfig.eventos = parseInt(document.getElementById('notifEventos').value);
  estado.notifConfig.quietHours = {
    on: document.getElementById('notifQuietOn').checked,
    start: document.getElementById('notifQuietStart').value || '22:00',
    end: document.getElementById('notifQuietEnd').value || '08:00'
  };
  salvarEstado();
  renderNotifConfig();
  scheduleAllNotificacoes();
}

// ---- DECISOR ----
function addOpcao() {
  var txt = document.getElementById('decisorInput').value.trim();
  if (!txt) return;
  estado.decisorOpcoes.push(txt);
  document.getElementById('decisorInput').value = '';
  salvarEstado(); renderDecisor();
}

function delOpcao(idx) {
  estado.decisorOpcoes.splice(idx, 1);
  salvarEstado(); renderDecisor();
}

function decidir() {
  if (estado.decisorOpcoes.length < 2) return;
  var idx = Math.floor(Math.random() * estado.decisorOpcoes.length);
  document.getElementById('decisorResultado').textContent = '👉 ' + estado.decisorOpcoes[idx];
  document.getElementById('decisorResultado').style.display = 'block';
}

function limparDecisor() {
  estado.decisorOpcoes = [];
  salvarEstado(); renderDecisor();
}

function renderDecisor() {
  var html = '';
  estado.decisorOpcoes.forEach(function(o, i) {
    html += '<div class="opcao-item">' + esc(o) + ' <button class="btn btn-d" style="font-size:.6rem" onclick="delOpcao('+i+')">✕</button></div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Adicione pelo menos 2 opções.</div>';
  document.getElementById('opcoesLista').innerHTML = html;
  var res = document.getElementById('decisorResultado');
  if (res && estado.decisorOpcoes.length < 2) res.style.display = 'none';
}

// ---- AGUA ----
function addAgua() {
  var hoje = hojeStr();
  if (estado.aguaData !== hoje) { estado.aguaHoje = 0; estado.aguaData = hoje; }
  if (estado.aguaHoje < 8) estado.aguaHoje++;
  salvarEstado(); renderAgua();
}

function removeAgua() {
  if (estado.aguaHoje > 0) estado.aguaHoje--;
  salvarEstado(); renderAgua();
}

function resetAgua() {
  estado.aguaHoje = 0;
  estado.aguaData = hojeStr();
  salvarEstado(); renderAgua();
}

function renderAgua() {
  var hoje = hojeStr();
  var qtd = (estado.aguaData === hoje) ? estado.aguaHoje : 0;
  if (estado.aguaData !== hoje) { estado.aguaHoje = 0; estado.aguaData = hoje; salvarEstado(); }
  var html = '';
  for (var i = 0; i < 8; i++) {
    html += '<div class="agua-copo' + (i < qtd ? ' cheio' : '') + '" onclick="' + (i < qtd ? '' : 'addAgua()') + '">' + (i < qtd ? '💧' : '🥛') + '</div>';
  }
  document.getElementById('aguaGrid').innerHTML = html;
  document.getElementById('aguaInfo').textContent = qtd + '/8 copos';
  document.getElementById('aguaPct').style.width = Math.round(qtd/8*100) + '%';
}

// ---- EXERCICIOS ----
function addExercicio() {
  var txt = document.getElementById('exercicioInput').value.trim();
  if (!txt) return;
  var hoje = hojeStr();
  if (!estado.exerciciosHoje) estado.exerciciosHoje = [];
  if (estado.exerciciosData !== hoje) { estado.exerciciosHoje = []; estado.exerciciosData = hoje; }
  estado.exerciciosHoje.push({texto:txt, id:uid()});
  document.getElementById('exercicioInput').value = '';
  salvarEstado(); renderExercicios();
}

function delExercicio(id) {
  estado.exerciciosHoje = estado.exerciciosHoje.filter(function(x){return x.id!==id;});
  salvarEstado(); renderExercicios();
}

function renderExercicios() {
  var hoje = hojeStr();
  var lista = (estado.exerciciosData === hoje) ? (estado.exerciciosHoje || []) : [];
  var html = '';
  lista.forEach(function(e) {
    html += '<div class="exercicio-item">💪 ' + esc(e.texto) + ' <button class="btn btn-d" style="font-size:.6rem" onclick="delExercicio(\''+e.id+'\')">✕</button></div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhum exercício registrado hoje.</div>';
  document.getElementById('exerciciosLista').innerHTML = html;
  document.getElementById('exerciciosCount').textContent = lista.length + ' exercícios hoje';
}

// ---- HUMOR ----
function setHumor(nivel) {
  estado.humorHoje = nivel;
  estado.humorData = hojeStr();
  if (!estado.humorHist) estado.humorHist = [];
  estado.humorHist.push({nivel:nivel, data:hojeStr()});
  // Keep last 30
  if (estado.humorHist.length > 30) estado.humorHist = estado.humorHist.slice(-30);
  salvarEstado(); renderHumor();
}

function renderHumor() {
  var hoje = hojeStr();
  var nivel = (estado.humorData === hoje) ? estado.humorHoje : 0;
  var emojis = ['😢','😟','😐','🙂','😄'];
  var labels = ['Muito mal','Mal','Normal','Bem','Muito bem'];
  var html = '';
  for (var i = 1; i <= 5; i++) {
    html += '<div class="humor-btn' + (nivel === i ? ' ativo' : '') + '" onclick="setHumor('+i+')">' + emojis[i-1] + '<small>' + labels[i-1] + '</small></div>';
  }
  document.getElementById('humorOpcoes').innerHTML = html;
  document.getElementById('humorRegistro').textContent = nivel ? 'Seu humor hoje: ' + emojis[nivel-1] + ' ' + labels[nivel-1] : 'Como você está hoje?';
  // History
  var hhtml = '';
  if (estado.humorHist && estado.humorHist.length) {
    estado.humorHist.slice(-7).forEach(function(h) {
      hhtml += '<div class="humor-hist-item"><small>' + dataLocal(h.data) + '</small> ' + emojis[h.nivel-1] + '</div>';
    });
  }
  document.getElementById('humorHistorico').innerHTML = hhtml || '<div style="color:var(--txt3);font-size:.82rem">Sem histórico.</div>';
}

// ---- GRATIDAO ----
function addGratidao() {
  var txt = document.getElementById('gratidaoInput').value.trim();
  if (!txt) return;
  if (!estado.gratidoes) estado.gratidoes = [];
  estado.gratidoes.push({texto:txt, data:hojeStr(), id:uid()});
  document.getElementById('gratidaoInput').value = '';
  salvarEstado(); renderGratidao();
}

function delGratidao(id) {
  estado.gratidoes = estado.gratidoes.filter(function(x){return x.id!==id;});
  salvarEstado(); renderGratidao();
}

function renderGratidao() {
  var html = '';
  (estado.gratidoes || []).forEach(function(g) {
    html += '<div class="gratidao-item">🙏 ' + esc(g.texto) + ' <small style="color:var(--txt3)">' + dataLocal(g.data) + '</small> <button class="btn btn-d" style="font-size:.6rem" onclick="delGratidao(\''+g.id+'\')">✕</button></div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Comece registrando algo pelo qual é grato.</div>';
  document.getElementById('gratidaoLista').innerHTML = html;
}

// ---- REFEICOES ----
function addRefeicao(tipo) {
  var txt = document.getElementById('refeicao_' + tipo).value.trim();
  if (!txt) return;
  if (!estado.refeicoes) estado.refeicoes = {};
  var hoje = hojeStr();
  if (!estado.refeicoes[hoje]) estado.refeicoes[hoje] = {};
  estado.refeicoes[hoje][tipo] = txt;
  document.getElementById('refeicao_' + tipo).value = '';
  salvarEstado(); renderRefeicoes();
}

function renderRefeicoes() {
  var hoje = hojeStr();
  var ref = (estado.refeicoes && estado.refeicoes[hoje]) || {};
  var tipos = [{k:'cafe',l:'Café da manhã',e:'☕'},{k:'almoco',l:'Almoço',e:'🍽️'},{k:'lanche',l:'Lanche',e:'🥪'},{k:'jantar',l:'Jantar',e:'🌙'}];
  var html = '';
  tipos.forEach(function(t) {
    var val = ref[t.k] || '';
    html += '<div class="refeicao-tipo">';
    html += '<div class="rt-label">' + t.e + ' ' + t.l + '</div>';
    html += '<input id="refeicao_'+t.k+'" placeholder="O que comeu?" value="' + esc(val) + '" class="input" />';
    html += '<button class="btn btn-p" onclick="addRefeicao(\''+t.k+'\')">Salvar</button>';
    html += '</div>';
  });
  document.getElementById('refeicoesGrid').innerHTML = html;
}

// ---- ORCAMENTO ----
function addDespesa() {
  var desc = document.getElementById('despesaDesc').value.trim();
  var val = parseFloat(document.getElementById('despesaVal').value);
  if (!desc || isNaN(val)) return;
  var cat = document.getElementById('despesaCat').value || 'outros';
  if (!estado.despesas) estado.despesas = [];
  estado.despesas.push({descricao:desc, valor:val, categoria:cat, data:hojeStr(), id:uid()});
  document.getElementById('despesaDesc').value = '';
  document.getElementById('despesaVal').value = '';
  salvarEstado(); renderOrcamento();
}

function delDespesa(id) {
  estado.despesas = estado.despesas.filter(function(x){return x.id!==id;});
  salvarEstado(); renderOrcamento();
}

function setOrcamento() {
  var val = parseFloat(document.getElementById('orcamentoMesInput').value);
  if (isNaN(val)) return;
  estado.orcamentoMes = val;
  salvarEstado(); renderOrcamento();
}

function renderOrcamento() {
  var mes = new Date().getMonth();
  var ano = new Date().getFullYear();
  var despesasMes = (estado.despesas||[]).filter(function(d) {
    var dt = new Date(d.data);
    return dt.getMonth() === mes && dt.getFullYear() === ano;
  });
  var total = despesasMes.reduce(function(s,d){return s+d.valor;},0);
  var orc = estado.orcamentoMes || 0;
  var pct = orc ? Math.min(100, Math.round(total/orc*100)) : 0;
  var cor = pct > 90 ? 'var(--vermelho)' : pct > 70 ? 'var(--amarelo)' : 'var(--verde)';

  document.getElementById('orcTotal').textContent = 'R$ ' + total.toFixed(2);
  document.getElementById('orcLimite').textContent = orc ? 'R$ ' + orc.toFixed(2) : 'Defina um orçamento';
  document.getElementById('orcSaldo').style.width = pct + '%';
  document.getElementById('orcSaldo').style.background = cor;
  document.getElementById('orcPct').textContent = pct + '%';

  var html = '';
  despesasMes.forEach(function(d) {
    var catE = {alimentacao:'🍔',transporte:'🚌',educacao:'📚',lazer:'🎮',saude:'💊',moradia:'🏠',outros:'📦'};
    html += '<div class="despesa-item">';
    html += '<span>' + (catE[d.categoria]||'📦') + '</span> ';
    html += '<span class="despesa-desc">' + esc(d.descricao) + '</span> ';
    html += '<span class="despesa-val" style="color:var(--vermelho)">-R$' + d.valor.toFixed(2) + '</span> ';
    html += '<button class="btn btn-d" style="font-size:.6rem" onclick="delDespesa(\''+d.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma despesa este mês.</div>';
  document.getElementById('despesasLista').innerHTML = html;
}

// ---- COMPRAS ----
function addCompra() {
  var txt = document.getElementById('compraInput').value.trim();
  if (!txt) return;
  if (!estado.listaCompras) estado.listaCompras = [];
  estado.listaCompras.push({texto:txt, feito:false, id:uid()});
  document.getElementById('compraInput').value = '';
  salvarEstado(); renderCompras();
}

function toggleCompra(id) {
  var c = estado.listaCompras.find(function(x){return x.id===id;});
  if (c) { c.feito = !c.feito; salvarEstado(); renderCompras(); }
}

function delCompra(id) {
  estado.listaCompras = estado.listaCompras.filter(function(x){return x.id!==id;});
  salvarEstado(); renderCompras();
}

function limparCompras() {
  estado.listaCompras = estado.listaCompras.filter(function(c){return !c.feito;});
  salvarEstado(); renderCompras();
}

function renderCompras() {
  var html = '';
  (estado.listaCompras||[]).forEach(function(c) {
    html += '<div class="compra-item' + (c.feito ? ' feito' : '') + '">';
    html += '<span onclick="toggleCompra(\''+c.id+'\')">' + (c.feito ? '✅' : '⬜') + '</span> ';
    html += '<span class="compra-texto">' + esc(c.texto) + '</span> ';
    html += '<button class="btn btn-d" style="font-size:.6rem" onclick="delCompra(\''+c.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Lista vazia.</div>';
  document.getElementById('comprasLista').innerHTML = html;
}

// ---- PLANEJAMENTO ----
function addPlanejamento() {
  var txt = document.getElementById('planejamentoInput').value.trim();
  var data = document.getElementById('planejamentoData').value || '';
  if (!txt) return;
  if (!estado.planejamentos) estado.planejamentos = [];
  estado.planejamentos.push({texto:txt, data:data, feito:false, id:uid()});
  document.getElementById('planejamentoInput').value = '';
  document.getElementById('planejamentoData').value = '';
  salvarEstado(); renderPlanejamento();
}

function togglePlanejamento(id) {
  var p = estado.planejamentos.find(function(x){return x.id===id;});
  if (p) { p.feito = !p.feito; salvarEstado(); renderPlanejamento(); }
}

function delPlanejamento(id) {
  estado.planejamentos = estado.planejamentos.filter(function(x){return x.id!==id;});
  salvarEstado(); renderPlanejamento();
}

function renderPlanejamento() {
  var html = '';
  (estado.planejamentos||[]).sort(function(a,b){return (a.data||'z').localeCompare(b.data||'z');}).forEach(function(p) {
    html += '<div class="planejamento-item' + (p.feito ? ' feito' : '') + '">';
    html += '<span onclick="togglePlanejamento(\''+p.id+'\')">' + (p.feito ? '✅' : '⬜') + '</span> ';
    html += '<span class="pl-texto">' + esc(p.texto) + '</span> ';
    if (p.data) html += '<small style="color:var(--txt3)">📅 ' + dataLocal(p.data) + '</small> ';
    html += '<button class="btn btn-d" style="font-size:.6rem" onclick="delPlanejamento(\''+p.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhum planejamento.</div>';
  document.getElementById('planejamentosLista').innerHTML = html;
}

// ---- REGRESSIVA ----
function addRegressiva() {
  var nome = document.getElementById('regressivaNome').value.trim();
  var data = document.getElementById('regressivaData').value;
  if (!nome || !data) return;
  if (!estado.regressivas) estado.regressivas = [];
  estado.regressivas.push({nome:nome, data:data, id:uid()});
  document.getElementById('regressivaNome').value = '';
  document.getElementById('regressivaData').value = '';
  salvarEstado(); renderRegressivas();
}

function delRegressiva(id) {
  estado.regressivas = estado.regressivas.filter(function(x){return x.id!==id;});
  salvarEstado(); renderRegressivas();
}

function renderRegressivas() {
  var html = '';
  (estado.regressivas||[]).forEach(function(r) {
    var diff = Math.ceil((new Date(r.data) - new Date()) / 86400000);
    html += '<div class="regressiva-item">';
    html += '<div class="reg-nome">🎉 ' + esc(r.nome) + '</div>';
    html += '<div class="reg-dias" style="color:' + (diff <= 7 ? 'var(--vermelho)' : diff <= 30 ? 'var(--amarelo)' : 'var(--verde)') + '">' + (diff > 0 ? diff + ' dias' : 'Hoje! 🎊') + '</div>';
    html += '<div class="reg-data">📅 ' + dataLocal(r.data) + '</div>';
    html += '<button class="btn btn-d" style="font-size:.6rem" onclick="delRegressiva(\''+r.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma contagem regressiva.</div>';
  document.getElementById('regressivaLista').innerHTML = html;
}

// ---- CALCULADORA ----
function calcInput(val) {
  var el = document.getElementById('calcTela');
  if (!el) return;
  var cur = el.textContent || '';
  if (val === 'C') { el.textContent = '0'; calcValor = '0'; return; }
  if (val === '=') {
    try { var res = Function('return ' + calcValor)(); el.textContent = String(res); calcValor = String(res); } catch(e) { el.textContent = 'Erro'; calcValor = '0'; }
    return;
  }
  if (val === '⌫') { calcValor = calcValor.slice(0,-1); if (!calcValor) calcValor = '0'; el.textContent = calcValor; return; }
  if (calcValor === '0' && val !== '.') calcValor = val; else calcValor += val;
  el.textContent = calcValor;
}

// ---- SENHAS ----
function addSenha() {
  var site = document.getElementById('senhaSite').value.trim();
  var user = document.getElementById('senhaUser').value.trim();
  var pw = document.getElementById('senhaPw').value;
  if (!site || !pw) return;
  if (!estado.senhas) estado.senhas = [];
  estado.senhas.push({site:site, user:user, pw:pw, id:uid()});
  document.getElementById('senhaSite').value = '';
  document.getElementById('senhaUser').value = '';
  document.getElementById('senhaPw').value = '';
  salvarEstado(); renderSenhas();
}

function delSenha(id) {
  estado.senhas = estado.senhas.filter(function(x){return x.id!==id;});
  salvarEstado(); renderSenhas();
}

function toggleVisSenha(id) {
  var inp = document.getElementById('spw_'+id);
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

function renderSenhas() {
  var html = '';
  (estado.senhas||[]).forEach(function(s) {
    html += '<div class="senha-item">';
    html += '<div class="senha-site">🔒 ' + esc(s.site) + '</div>';
    html += '<div class="senha-user">👤 ' + esc(s.user || '-') + '</div>';
    html += '<div class="senha-pw"><input id="spw_'+s.id+'" type="password" value="' + esc(s.pw) + '" readonly class="input" style="width:60%"/><button class="btn btn-p" style="font-size:.6rem;padding:.2rem .4rem" onclick="toggleVisSenha(\''+s.id+'\')">👁️</button></div>';
    html += '<button class="btn btn-d" style="font-size:.6rem" onclick="delSenha(\''+s.id+'\')">Excluir</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma senha salva. ⚠️ Use com cautela — dados ficam no navegador.</div>';
  document.getElementById('senhasLista').innerHTML = html;
}

// ---- LEITURA ----
function addLeitura() {
  var titulo = document.getElementById('leituraTitulo').value.trim();
  var autor = document.getElementById('leituraAutor').value.trim();
  var pag = parseInt(document.getElementById('leituraPag').value) || 0;
  var status = document.getElementById('leituraStatus') ? document.getElementById('leituraStatus').value : 'quero';
  if (!titulo) return;
  if (!estado.leituras) estado.leituras = [];
  estado.leituras.push({titulo:titulo, autor:autor, totalPag:pag, pagLidas:0, status:status, id:uid()});
  document.getElementById('leituraTitulo').value = '';
  document.getElementById('leituraAutor').value = '';
  document.getElementById('leituraPag').value = '';
  salvarEstado(); renderLeitura();
}

function attPagLidas(id, val) {
  var l = estado.leituras.find(function(x){return x.id===id;});
  if (l) { l.pagLidas = Math.min(parseInt(val)||0, l.totalPag); salvarEstado(); renderLeitura(); }
}

function delLeitura(id) {
  estado.leituras = estado.leituras.filter(function(x){return x.id!==id;});
  salvarEstado(); renderLeitura();
}

function renderLeitura() {
  var filtro = estado.filtroLeitura || 'todos';
  var lista = (estado.leituras||[]).filter(function(l) {
    if (filtro === 'todos') return true;
    var st = l.status || 'quero';
    return st === filtro;
  });
  var html = '';
  lista.forEach(function(l) {
    var pct = l.totalPag ? Math.round(l.pagLidas/l.totalPag*100) : 0;
    var stBadge = {quero:'🔖 Quero ler',lendo:'📖 Lendo',lido:'✅ Lido'};
    var st = l.status || 'quero';
    html += '<div class="leitura-item">';
    html += '<div class="lei-titulo">' + (stBadge[st]||'') + ' ' + esc(l.titulo) + (l.autor ? ' <small>por ' + esc(l.autor) + '</small>' : '') + '</div>';
    html += '<div class="lei-progresso">';
    html += '<div class="lei-bar" style="width:'+pct+'%"></div>';
    html += '<span class="lei-pct">' + l.pagLidas + '/' + l.totalPag + ' (' + pct + '%)</span>';
    html += '</div>';
    html += '<select class="select" style="font-size:.75rem;width:auto" onchange="attStatusLeitura(\''+l.id+'\',this.value)">';
    html += '<option value="quero"' + (st==='quero'?' selected':'') + '>Quero ler</option>';
    html += '<option value="lendo"' + (st==='lendo'?' selected':'') + '>Lendo</option>';
    html += '<option value="lido"' + (st==='lido'?' selected':'') + '>Lido</option>';
    html += '</select> ';
    html += '<input type="number" min="0" max="'+l.totalPag+'" value="'+l.pagLidas+'" class="input" style="width:80px;font-size:.8rem" onchange="attPagLidas(\''+l.id+'\',this.value)" />';
    html += '<button class="btn btn-d" style="font-size:.6rem" onclick="delLeitura(\''+l.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhum livro ' + (filtro==='todos'?'':'com filtro "'+filtro+'"') + ' na lista.</div>';
  document.getElementById('leiturasLista').innerHTML = html;
}

// ---- REVISAO (Spaced Repetition) ----
function addRevisao() {
  var txt = document.getElementById('revisaoNotas').value.trim();
  if (!txt) return;
  if (!estado.revisoes) estado.revisoes = [];
  estado.revisoes.push({texto:txt, data:hojeStr(), intervalo:1, id:uid()});
  document.getElementById('revisaoNotas').value = '';
  salvarEstado(); renderRevisao();
}

function marcarRevisao(id, lembrou) {
  var r = estado.revisoes.find(function(x){return x.id===id;});
  if (!r) return;
  if (lembrou) {
    r.intervalo = Math.min(r.intervalo * 2, 30);
  } else {
    r.intervalo = 1;
  }
  var prox = new Date();
  prox.setDate(prox.getDate() + r.intervalo);
  r.data = prox.toISOString().slice(0,10);
  salvarEstado(); renderRevisao();
}

function delRevisao(id) {
  estado.revisoes = estado.revisoes.filter(function(x){return x.id!==id;});
  salvarEstado(); renderRevisao();
}

function renderRevisao() {
  var hoje = hojeStr();
  var html = '';
  var pendentes = (estado.revisoes||[]).filter(function(r){return r.data <= hoje;}).sort(function(a,b){return a.data.localeCompare(b.data);});
  var futuras = (estado.revisoes||[]).filter(function(r){return r.data > hoje;}).sort(function(a,b){return a.data.localeCompare(b.data);});
  if (pendentes.length) {
    html += '<div class="rev-section-title" style="color:var(--cor);margin-bottom:.5rem">📚 Revisar agora (' + pendentes.length + ')</div>';
    pendentes.forEach(function(r) {
      html += '<div class="revisao-item urgente">';
      html += '<div class="rev-texto">' + esc(r.texto) + '</div>';
      html += '<div class="rev-botoes"><button class="btn btn-p" style="font-size:.7rem" onclick="marcarRevisao(\''+r.id+'\',true)">✅ Lembrei</button><button class="btn btn-d" style="font-size:.7rem" onclick="marcarRevisao(\''+r.id+'\',false)">🔄 Esqueci</button></div>';
      html += '</div>';
    });
  }
  if (futuras.length) {
    html += '<div class="rev-section-title" style="color:var(--txt3);margin:.8rem 0 .5rem">📅 Próximas revisões</div>';
    futuras.forEach(function(r) {
      html += '<div class="revisao-item">';
      html += '<div class="rev-texto">' + esc(r.texto) + '</div>';
      html += '<small style="color:var(--txt3)">em ' + dataLocal(r.data) + ' (intervalo: ' + r.intervalo + 'd)</small>';
      html += ' <button class="btn btn-d" style="font-size:.6rem" onclick="delRevisao(\''+r.id+'\')">✕</button>';
      html += '</div>';
    });
  }
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma revisão. Adicione um tema para revisar!</div>';
  document.getElementById('revisaoBlocos').innerHTML = html;
}

// ---- FRASES ----
function novaFrase() {
  var idx = Math.floor(Math.random() * frases.length);
  estado.fraseAtualIdx = idx;
  document.getElementById('fraseBox').textContent = '"' + frases[idx].t + '"';
  var autorEl = document.getElementById('fraseAutor');
  if (autorEl) autorEl.textContent = '— ' + frases[idx].a;
  renderFrasesFav();
}

// ---- PAINEL DA VIDA ----
function calcularVida() {
  var hoje = hojeStr();
  var cats = {
    saude: {label:'Saúde',emoji:'💪',max:25},
    estudos: {label:'Estudos',emoji:'📚',max:25},
    organizacao: {label:'Organização',emoji:'📋',max:20},
    bemEstar: {label:'Bem-estar',emoji:'😊',max:15},
    financas: {label:'Finanças',emoji:'💰',max:15}
  };

  var scores = {};
  // Saúde
  var agua = (estado.aguaData === hoje) ? estado.aguaHoje : 0;
  var exCount = (estado.exerciciosData === hoje) ? (estado.exerciciosHoje||[]).length : 0;
  scores.saude = Math.min(25, Math.round(agua/8*10 + exCount*3 + (estado.humorData===hoje && estado.humorHoje>=3 ? 5 : 0) + 7));
  // Estudos
  var pomos = (estado.pomodorosData === hoje) ? estado.pomodorosHoje : 0;
  var revPend = (estado.revisoes||[]).filter(function(r){return r.data<=hoje;}).length;
  scores.estudos = Math.min(25, Math.round(pomos*3 + (revPend===0?5:2) + 8));
  // Organização
  var atrasadas = estado.tarefas.filter(eAtrasada).length;
  var feitas = estado.tarefas.filter(function(t){return t.feito;}).length;
  var total = estado.tarefas.length || 1;
  scores.organizacao = Math.min(20, Math.round((feitas/total)*12 + (atrasadas===0?5:0) + 5));
  // Bem-estar
  var humorVal = (estado.humorData===hoje) ? estado.humorHoje : 3;
  var gratHoje = (estado.gratidoes||[]).filter(function(g){return g.data===hoje;}).length;
  scores.bemEstar = Math.min(15, Math.round(humorVal*2 + gratHoje + 4));
  // Finanças
  var mesAtual = new Date().getMonth();
  var despMes = (estado.despesas||[]).filter(function(d){var dt=new Date(d.data);return dt.getMonth()===mesAtual;});
  var gastoTotal = despMes.reduce(function(s,d){return s+d.valor;},0);
  var orc = estado.orcamentoMes || 0;
  scores.financas = orc ? Math.min(15, Math.round((1 - gastoTotal/orc)*12 + 5)) : 7;

  var totalScore = 0;
  for (var k in scores) totalScore += scores[k];
  var nivel = totalScore >= 80 ? 'Excelente 🌟' : totalScore >= 60 ? 'Bom 👍' : totalScore >= 40 ? 'Regular 📊' : 'Precisa melhorar 💪';

  // Update individual elements instead of destroying innerHTML
  var bar = document.getElementById('vidaScoreBar');
  if (bar) {
    var circ = 2 * Math.PI * 85; // ~534
    var offset = circ - (totalScore / 100) * circ;
    bar.setAttribute('stroke-dashoffset', String(offset));
  }
  var numEl = document.getElementById('vidaScoreNum');
  if (numEl) numEl.textContent = String(totalScore);

  var nivelEl = document.getElementById('vidaNivel');
  if (nivelEl) {
    nivelEl.textContent = nivel;
    nivelEl.className = 'vida-nivel n' + (totalScore >= 80 ? 4 : totalScore >= 60 ? 3 : totalScore >= 40 ? 2 : totalScore >= 20 ? 1 : 0);
  }

  // Completion message
  var compEl = document.getElementById('vidaComp');
  if (compEl) {
    var msg = totalScore >= 80 ? 'Incrível! Você está mandando muito bem! 🌟' : totalScore >= 60 ? 'Bom trabalho! Continue assim! 👍' : totalScore >= 40 ? 'Tá no caminho. Continue se organizando! 📊' : 'Vamos melhorar juntos! Um passo de cada vez. 💪';
    compEl.textContent = msg;
  }

  // Categories bars
  var catsEl = document.getElementById('vidaCats');
  if (catsEl) {
    var chtml = '';
    for (var k in cats) {
      var c = cats[k];
      var s = scores[k] || 0;
      var pct = Math.round(s / c.max * 100);
      chtml += '<div class="vida-cat">';
      chtml += '<div class="vida-cat-header">' + c.emoji + ' ' + c.label + '</div>';
      chtml += '<div class="vida-cat-bar"><div class="vida-cat-fill" style="width:'+pct+'%"></div></div>';
      chtml += '<div class="vida-cat-score">' + s + '/' + c.max + '</div>';
      chtml += '</div>';
    }
    catsEl.innerHTML = chtml;
  }

  // Tips based on weakest area
  var dicasEl = document.getElementById('vidaDicas');
  if (dicasEl) {
    var weakest = '';
    var lowest = 999;
    for (var k in scores) { if (scores[k] < lowest) { lowest = scores[k]; weakest = k; } }
    var tips = {
      saude: 'Beba mais água e tente fazer exercício! 💧',
      estudos: 'Use Pomodoro e revise conteúdo regularmente! 🍅',
      organizacao: 'Organize suas tarefas e evite atrasos! ✅',
      bemEstar: 'Registre gratidão e cuide do seu humor! 🙏',
      financas: 'Acompanhe seus gastos e respeite o orçamento! 💰'
    };
    dicasEl.innerHTML = '<div class="vida-dica" style="font-size:.8rem;color:var(--txt2);margin-top:.5rem;padding:.5rem;background:var(--card2);border-radius:var(--raio)">💡 Dica: ' + (tips[weakest]||'') + '</div>';
  }

  // Streak (days with humor registered)
  var streakEl = document.getElementById('vidaStreak');
  if (streakEl) {
    var streak = 0;
    var h = estado.humorHist || [];
    for (var i = h.length - 1; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - streak);
      var ds = d.toISOString().slice(0,10);
      if (h[i] && h[i].data === ds) streak++; else break;
    }
    streakEl.innerHTML = streak > 0 ? '🔥 ' + streak + ' dia' + (streak > 1 ? 's' : '') + ' seguido' + (streak > 1 ? 's' : '') + ' registrando humor!' : '';
  }

  // History mini chart
  var histEl = document.getElementById('vidaHist');
  if (histEl) {
    try {
      var hist = JSON.parse(localStorage.getItem('vidaHist') || '[]');
      if (hist.length > 1) {
        var hhtml = '<div style="display:flex;align-items:flex-end;gap:2px;height:40px;margin-top:.5rem">';
        var maxH = Math.max.apply(null, hist.map(function(x){return x.score;}));
        hist.slice(-30).forEach(function(h) {
          var pctH = Math.round(h.score / (maxH || 100) * 100);
          hhtml += '<div style="width:8px;height:'+Math.max(4,pctH*0.4)+'px;background:var(--cor);border-radius:2px" title="'+h.data+': '+h.score+'"></div>';
        });
        hhtml += '</div>';
        histEl.innerHTML = hhtml;
      } else {
        histEl.innerHTML = '';
      }
    } catch(e) { histEl.innerHTML = ''; }
  }

  // Save to vidaHist
  try {
    var hist = JSON.parse(localStorage.getItem('vidaHist') || '[]');
    if (!hist.length || hist[hist.length-1].data !== hoje) {
      hist.push({data:hoje, score:totalScore});
      if (hist.length > 90) hist = hist.slice(-90);
      localStorage.setItem('vidaHist', JSON.stringify(hist));
    }
  } catch(e){}

  // Re-attach renderVida onclick on refresh button
  var refreshBtn = vidaPainel.querySelector('.vida-refresh');
  if (refreshBtn) refreshBtn.onclick = function(){ calcularVida(); };
}

// ============================================================
// PART 4: Init/Bootstrap, Notificações, Search
// ============================================================

// ---- SEARCH ----
function toggleSearch() {
  var overlay = document.getElementById('buscaOverlay');
  if (!overlay) return;
  var vis = overlay.classList.contains('ativo');
  if (vis) {
    overlay.classList.remove('ativo');
    return;
  }
  overlay.classList.add('ativo');
  document.getElementById('buscaInput').focus();
}

function searchPages() {
  var q = (document.getElementById('buscaInput').value || '').toLowerCase().trim();
  var results = document.getElementById('buscaResultados');
  if (!q) { results.innerHTML = ''; return; }

  var pages = [
    {slug:'inicio', nome:'Início', icon:'🏠'},
    {slug:'tarefas', nome:'Tarefas', icon:'✅'},
    {slug:'calendario', nome:'Calendário', icon:'📅'},
    {slug:'estudos', nome:'Estudos', icon:'📚'},
    {slug:'habitos', nome:'Hábitos', icon:'🔥'},
    {slug:'pomodoro', nome:'Pomodoro', icon:'🍅'},
    {slug:'metas', nome:'Metas', icon:'🎯'},
    {slug:'notas', nome:'Notas', icon:'📝'},
    {slug:'lembretes', nome:'Lembretes', icon:'🔔'},
    {slug:'decisor', nome:'Decisor', icon:'🎲'},
    {slug:'agua', nome:'Água', icon:'💧'},
    {slug:'exercicios', nome:'Exercícios', icon:'💪'},
    {slug:'humor', nome:'Humor', icon:'😊'},
    {slug:'gratidao', nome:'Gratidão', icon:'🙏'},
    {slug:'refeicoes', nome:'Refeições', icon:'🍽️'},
    {slug:'orcamento', nome:'Orçamento', icon:'💰'},
    {slug:'compras', nome:'Compras', icon:'🛒'},
    {slug:'planejamento', nome:'Planejamento', icon:'📋'},
    {slug:'regressiva', nome:'Contagem Regressiva', icon:'⏳'},
    {slug:'calculadora', nome:'Calculadora', icon:'🧮'},
    {slug:'senhas', nome:'Senhas', icon:'🔒'},
    {slug:'leitura', nome:'Leitura', icon:'📖'},
    {slug:'revisao', nome:'Revisão', icon:'🔄'},
    {slug:'frases', nome:'Frases', icon:'💬'},
    {slug:'vida', nome:'Painel da Vida', icon:'🌟'},
    {slug:'perfil', nome:'Perfil & Config', icon:'⚙️'}
  ];

  var html = '';
  pages.forEach(function(p) {
    if (p.nome.toLowerCase().indexOf(q) >= 0) {
      html += '<div class="search-result" onclick="navegarPara(\''+p.slug+'\');toggleSearch()">' + p.icon + ' ' + p.nome + '</div>';
    }
  });
  if (!html) html = '<div style="color:var(--txt3);padding:.5rem">Nenhum resultado</div>';
  results.innerHTML = html;
}

// ---- PIX MODAL ----
function openPix() {
  var m = document.getElementById('pixModal');
  if (m) m.classList.add('ativo');
}
function closePix() {
  var m = document.getElementById('pixModal');
  if (m) m.classList.remove('ativo');
}

// ---- CONFIRM MODAL ----
function showConfirm(msg, onOk) {
  document.getElementById('modalMsg').textContent = msg;
  modalCallback = onOk;
  document.getElementById('modalOverlay').classList.add('visivel');
}
function closeConfirm() {
  document.getElementById('modalOverlay').classList.remove('visivel');
  modalCallback = null;
}

// ---- APOIE BANNER ----
function fecharApoie() {
  document.getElementById('apoieBanner').style.display = 'none';
  localStorage.setItem('apoieBannerFechado', '1');
}

// ---- INSTALL BANNER ----
function fecharInstall() {
  document.getElementById('instalarBanner').style.display = 'none';
}

// ---- SCROLL TOP ----
function scrollTop() {
  window.scrollTo({top:0, behavior:'smooth'});
}

// ---- SIDEBAR MOBILE ----
function toggleMaisFerramentas() {
  var panel = document.getElementById('sidebarTools');
  if (panel) panel.classList.toggle('aberto');
}

function toggleMaisBottom() {
  var sheet = document.getElementById('moreSheet');
  if (sheet) sheet.classList.toggle('aberto');
}

// ---- MEU PROGRESSO ----
function renderProgresso() {
  var hoje = hojeStr();
  var sk = getSemanaKey();
  var diaIdx = getDiaSemana(); // 0=dom 6=sab

  // Calcular inicio da semana (domingo)
  var d = new Date();
  var inicioSemana = new Date(d);
  inicioSemana.setDate(d.getDate() - diaIdx);
  var diasSemana = [];
  var nomesDia = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  for (var i = 0; i < 7; i++) {
    var dd = new Date(inicioSemana);
    dd.setDate(inicioSemana.getDate() + i);
    diasSemana.push({
      key: dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0'),
      label: nomesDia[i],
      eHoje: i === diaIdx
    });
  }

  // 1) Tarefas concluídas esta semana
  var tarefasSemana = estado.tarefas.filter(function(t) {
    if (!t.data) return false;
    return t.data >= diasSemana[0].key && t.data <= diasSemana[6].key;
  });
  var tarefasFeitas = tarefasSemana.filter(function(t) { return t.feito; });
  var tarefasPendentes = tarefasSemana.filter(function(t) { return !t.feito; });
  var tPct = tarefasSemana.length ? Math.round(tarefasFeitas.length / tarefasSemana.length * 100) : 0;

  // 2) Provas próximas (futuras ou de hoje)
  var provas = (estado.estudos && estado.estudos.provas) ? estado.estudos.provas : [];
  var provasProximas = provas.filter(function(p) { return p.data && p.data >= hoje; })
    .sort(function(a,b) { return (a.data + (a.hora||'')) > (b.data + (b.hora||'')) ? 1 : -1; })
    .slice(0, 5);
  var provasFeitas = provas.filter(function(p) { return p.concluido; });

  // 3) Trabalhos
  var trabalhos = (estado.estudos && estado.estudos.trabalhos) ? estado.estudos.trabalhos : [];
  var trabalhosEntregues = trabalhos.filter(function(t) { return t.status === 'concluido' || t.status === 'Entregue' || t.status === 'Concluído'; });
  var trPct = trabalhos.length ? Math.round(trabalhosEntregues.length / trabalhos.length * 100) : 0;
  var trabalhosPendentes = trabalhos.filter(function(t) { return t.status !== 'concluido' && t.status !== 'Entregue' && t.status !== 'Concluído'; })
    .sort(function(a,b) { return (a.data||'9999') > (b.data||'9999') ? 1 : -1; })
    .slice(0, 5);

  // 4) Hábitos da semana
  var habitos = estado.habitos || [];
  var habFeitosSemana = 0;
  var habTotalSemana = habitos.length * 7;
  habitos.forEach(function(h) {
    var arr = h.semanas[sk] || [];
    arr.forEach(function(v) { if (v) habFeitosSemana++; });
  });
  var habPct = habTotalSemana ? Math.round(habFeitosSemana / habTotalSemana * 100) : 0;

  // 5) Progresso por dia da semana (barras horizontais)
  var tarefasPorDia = diasSemana.map(function(ds) {
    var doDia = estado.tarefas.filter(function(t) { return t.data === ds.key; });
    var feitasDoDia = doDia.filter(function(t) { return t.feito; });
    var pct = doDia.length ? Math.round(feitasDoDia.length / doDia.length * 100) : 0;
    return { label: ds.label, eHoje: ds.eHoje, total: doDia.length, feitas: feitasDoDia.length, pct: pct };
  });

  // 6) Progresso por matéria
  var materias = (estado.estudos && estado.estudos.materias) ? estado.estudos.materias : [];
  var progMaterias = materias.map(function(m) {
    var tarefasMat = estado.tarefas.filter(function(t) { return t.materia === m.nome; });
    var feitasMat = tarefasMat.filter(function(t) { return t.feito; });
    var pctMat = tarefasMat.length ? Math.round(feitasMat.length / tarefasMat.length * 100) : 0;
    return { nome: m.nome, cor: m.cor || 'var(--cor)', total: tarefasMat.length, feitas: feitasMat.length, pct: pctMat };
  }).filter(function(pm) { return pm.total > 0; });

  // --- Montar HTML ---
  var h = '';

  // Cards resumo (topo)
  h += '<div class="prog-cards">';
  h += '<div class="prog-card prog-card-feitas">';
  h += '<div class="prog-card-icon">✅</div>';
  h += '<div class="prog-card-num">' + tarefasFeitas.length + '</div>';
  h += '<div class="prog-card-label">Concluídas</div>';
  h += '<div class="prog-card-sub">de ' + tarefasSemana.length + ' esta semana</div>';
  h += '</div>';

  h += '<div class="prog-card prog-card-pend">';
  h += '<div class="prog-card-icon">⏳</div>';
  h += '<div class="prog-card-num">' + tarefasPendentes.length + '</div>';
  h += '<div class="prog-card-label">Pendentes</div>';
  h += '<div class="prog-card-sub">a fazer ainda</div>';
  h += '</div>';

  h += '<div class="prog-card prog-card-provas">';
  h += '<div class="prog-card-icon">📝</div>';
  h += '<div class="prog-card-num">' + provasProximas.length + '</div>';
  h += '<div class="prog-card-label">Provas próximas</div>';
  h += '<div class="prog-card-sub">a estudar</div>';
  h += '</div>';

  h += '<div class="prog-card prog-card-trab">';
  h += '<div class="prog-card-icon">📄</div>';
  h += '<div class="prog-card-num">' + trabalhosEntregues.length + '</div>';
  h += '<div class="prog-card-label">Trabalhos entregues</div>';
  h += '<div class="prog-card-sub">de ' + trabalhos.length + ' no total</div>';
  h += '</div>';

  h += '<div class="prog-card prog-card-provas">';
  h += '<div class="prog-card-icon">✅</div>';
  h += '<div class="prog-card-num">' + provasFeitas.length + '</div>';
  h += '<div class="prog-card-label">Provas concluídas</div>';
  h += '<div class="prog-card-sub">de ' + provas.length + ' no total</div>';
  h += '</div>';

  h += '</div>';

  // Barra geral da semana
  h += '<div class="prog-secao">';
  h += '<div class="prog-secao-titulo">📊 Progresso Semanal</div>';
  h += '<div class="prog-barra-geral">';
  h += '<div class="prog-barra-info"><span>Tarefas</span><span>' + tPct + '%</span></div>';
  h += '<div class="prog-barra-track"><div class="prog-barra-fill prog-barra-cor" style="width:' + tPct + '%"></div></div>';
  h += '</div>';
  h += '<div class="prog-barra-geral">';
  h += '<div class="prog-barra-info"><span>Hábitos</span><span>' + habPct + '%</span></div>';
  h += '<div class="prog-barra-track"><div class="prog-barra-fill prog-barra-verde" style="width:' + habPct + '%"></div></div>';
  h += '</div>';
  h += '<div class="prog-barra-geral">';
  h += '<div class="prog-barra-info"><span>Trabalhos</span><span>' + trPct + '%</span></div>';
  h += '<div class="prog-barra-track"><div class="prog-barra-fill prog-barra-azul" style="width:' + trPct + '%"></div></div>';
  h += '</div>';
  h += '</div>';

  // Progresso por dia (mini barras)
  h += '<div class="prog-secao">';
  h += '<div class="prog-secao-titulo">📅 Por Dia da Semana</div>';
  h += '<div class="prog-dias-grid">';
  tarefasPorDia.forEach(function(dia) {
    var corBarra = dia.pct === 100 ? 'var(--verde)' : dia.pct >= 50 ? 'var(--amarelo)' : dia.total > 0 ? 'var(--vermelho)' : 'var(--borda)';
    h += '<div class="prog-dia-item' + (dia.eHoje ? ' prog-dia-hoje' : '') + '">';
    h += '<div class="prog-dia-label">' + dia.label + '</div>';
    h += '<div class="prog-dia-count">' + dia.feitas + '/' + dia.total + '</div>';
    h += '<div class="prog-dia-bar"><div style="width:' + (dia.total ? dia.pct : 0) + '%;background:' + corBarra + '"></div></div>';
    h += '</div>';
  });
  h += '</div>';
  h += '</div>';

  // Provas próximas
  h += '<div class="prog-secao">';
  h += '<div class="prog-secao-titulo">📝 Provas Próximas</div>';
  if (provasProximas.length) {
    h += '<div class="prog-lista">';
    provasProximas.forEach(function(p) {
      var diasFaltam = Math.ceil((new Date(p.data) - new Date(hoje)) / 86400000);
      var urgencia = diasFaltam <= 2 ? 'prog-urgente' : diasFaltam <= 5 ? 'prog-atencao' : 'prog-normal';
      h += '<div class="prog-lista-item ' + urgencia + '">';
      h += '<div class="prog-lista-left">';
      h += '<div class="prog-lista-texto">' + esc(p.texto) + '</div>';
      h += '<div class="prog-lista-sub">' + (p.materia ? esc(p.materia) + ' · ' : '') + dataLocal(p.data) + '</div>';
      h += '</div>';
      h += '<div class="prog-lista-badge">' + (diasFaltam === 0 ? 'Hoje!' : diasFaltam === 1 ? 'Amanhã' : diasFaltam + ' dias') + '</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div class="prog-empty">Nenhuma prova próxima 🎉</div>';
  }
  h += '</div>';

  // Trabalhos pendentes
  h += '<div class="prog-secao">';
  h += '<div class="prog-secao-titulo">📄 Trabalhos Pendentes</div>';
  if (trabalhosPendentes.length) {
    h += '<div class="prog-lista">';
    trabalhosPendentes.forEach(function(t) {
      var statusCor = t.status === 'Em progresso' ? 'var(--amarelo)' : t.status === 'Não iniciado' ? 'var(--txt3)' : 'var(--cor)';
      h += '<div class="prog-lista-item">';
      h += '<div class="prog-lista-left">';
      h += '<div class="prog-lista-texto">' + esc(t.texto) + '</div>';
      h += '<div class="prog-lista-sub">' + (t.materia ? esc(t.materia) + ' · ' : '') + (t.data ? dataLocal(t.data) : '') + '</div>';
      h += '</div>';
      h += '<div class="prog-lista-badge" style="background:' + statusCor + ';color:#fff">' + esc(t.status || 'Pendente') + '</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div class="prog-empty">Todos os trabalhos foram entregues! 🎉</div>';
  }
  h += '</div>';

  // Progresso por matéria
  h += '<div class="prog-secao">';
  h += '<div class="prog-secao-titulo">📚 Progresso por Matéria</div>';
  if (progMaterias.length) {
    h += '<div class="prog-materias">';
    progMaterias.forEach(function(m) {
      h += '<div class="prog-mat-item">';
      h += '<div class="prog-mat-head"><span class="prog-mat-nome">' + esc(m.nome) + '</span><span class="prog-mat-pct">' + m.pct + '%</span></div>';
      h += '<div class="prog-mat-bar"><div style="width:' + m.pct + '%;background:' + m.cor + '"></div></div>';
      h += '<div class="prog-mat-sub">' + m.feitas + ' de ' + m.total + ' tarefas</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div class="prog-empty">Crie matérias em Estudos para ver o progresso</div>';
  }
  h += '</div>';

  // Hábitos da semana - mini anéis
  if (habitos.length) {
    h += '<div class="prog-secao">';
    h += '<div class="prog-secao-titulo">🔥 Hábitos da Semana</div>';
    h += '<div class="prog-hab-grid">';
    habitos.forEach(function(hab) {
      var arr = hab.semanas[sk] || [false,false,false,false,false,false,false];
      var feitosHab = arr.filter(function(v){return v;}).length;
      var pctHab = Math.round(feitosHab / 7 * 100);
      var deg = Math.round(pctHab * 3.6);
      var corHab = pctHab >= 80 ? 'var(--verde)' : pctHab >= 50 ? 'var(--amarelo)' : 'var(--vermelho)';
      h += '<div class="prog-hab-item">';
      h += '<div class="prog-hab-ring" style="background:conic-gradient(' + corHab + ' ' + deg + 'deg, var(--borda) ' + deg + 'deg)">';
      h += '<div class="prog-hab-ring-inner">' + feitosHab + '/7</div>';
      h += '</div>';
      h += '<div class="prog-hab-nome">' + (hab.emoji||'✨') + ' ' + esc(hab.nome) + '</div>';
      h += '</div>';
    });
    h += '</div>';
    h += '</div>';
  }

  // Plus: Estatísticas Avançadas (upsell)
  if (!estado.plus.ativo) {
    h += '<div class="prog-secao plus-preview-section" onclick="showPlusPrompt(\'Estatísticas Avançadas\')">';
    h += '<div class="plus-preview-header"><span class="plus-badge-mini">PLUS</span> 📊 Estatísticas Avançadas</div>';
    h += '<div class="plus-preview-desc">Gráficos de tendência, streaks, análise por período, comparação semanal e muito mais.</div>';
    h += '<div class="plus-preview-cta">⭐ Desbloquear com Plus</div>';
    h += '</div>';
  }

  document.getElementById('progressoConteudo').innerHTML = h;
}

// ---- RENDER ALL FOR PAGE ----
function renderPage(slug) {
  switch(slug) {
    case 'inicio': renderDashboard(); break;
    case 'tarefas': renderTarefas(); break;
    case 'calendario': renderCalendario(); break;
    case 'estudos': renderEstudos(); break;
    case 'habitos': renderHabitos(); break;
    case 'progresso': renderProgresso(); break;
    case 'pomodoro': renderPomodoro(); break;
    case 'metas': renderMetas(); break;
    case 'notas': renderNotas(); break;
    case 'lembretes': renderLembretes(); break;
    case 'decisor': renderDecisor(); break;
    case 'agua': renderAgua(); break;
    case 'exercicios': renderExercicios(); break;
    case 'humor': renderHumor(); break;
    case 'gratidao': renderGratidao(); break;
    case 'refeicoes': renderRefeicoes(); break;
    case 'orcamento': renderOrcamento(); break;
    case 'compras': renderCompras(); break;
    case 'planejamento': renderPlanejamento(); break;
    case 'regressiva': renderRegressivas(); break;
    case 'calculadora': break;
    case 'senhas': renderSenhas(); break;
    case 'leitura': renderLeitura(); break;
    case 'revisao': renderRevisao(); break;
    case 'frases': novaFrase(); break;
    case 'vida': calcularVida(); break;
    case 'perfil': renderPerfil(); break;
    case 'plus': renderPlusPage(); break;
  }
}

// ---- PERFIL / CONFIGURACOES ----

var perfilEmojis = ['😊','😎','🤓','🦊','🐱','🐶','🦁','🐸','🦋','🌟','🎯','💡','🔥','🎮','🎨','📚'];

function renderPerfil() {
  // Nome
  var nomeInput = document.getElementById('perfilNomeInput');
  if (nomeInput) nomeInput.value = estado.perfil.nome || '';

  // Série
  var serieSelect = document.getElementById('perfilSerieSelect');
  if (serieSelect) serieSelect.value = estado.perfil.serie || '';

  // Avatar preview
  var preview = document.getElementById('perfilAvatarPreview');
  if (preview) {
    if (estado.perfil.avatar && estado.perfil.avatar.indexOf('data:') === 0) {
      preview.innerHTML = '<img src="' + estado.perfil.avatar + '" class="perfil-avatar-real">';
    } else {
      preview.textContent = estado.perfil.avatar || '😊';
    }
  }

  // Emoji grid
  var grid = document.getElementById('perfilEmojiGrid');
  if (grid) {
    var html = '';
    for (var i = 0; i < perfilEmojis.length; i++) {
      var sel = (estado.perfil.avatar === perfilEmojis[i]) ? ' perfil-emoji-sel' : '';
      html += '<div class="perfil-emoji-item' + sel + '" onclick="escolherEmoji(\'' + perfilEmojis[i] + '\')">' + perfilEmojis[i] + '</div>';
    }
    grid.innerHTML = html;
  }

  // Theme selector
  var optClaro = document.getElementById('temaOptClaro');
  var optEscuro = document.getElementById('temaOptEscuro');
  if (optClaro) optClaro.className = 'config-theme-opt' + (estado.tema === 'claro' ? ' config-theme-active' : '');
  if (optEscuro) optEscuro.className = 'config-theme-opt' + (estado.tema === 'escuro' ? ' config-theme-active' : '');

  // Notificações — summary + link to lembretes page
  var notifArea = document.getElementById('configNotifArea');
  if (notifArea) {
    var nc = estado.notifConfig || {};
    var status = nc.global ? 'Ativadas' : 'Desativadas';
    var stColor = nc.global ? 'var(--cor)' : 'var(--txt3)';
    notifArea.innerHTML = '<div class="config-row" style="display:flex;align-items:center;justify-content:space-between">' +
      '<span class="config-label">Notificações globais</span>' +
      '<span style="color:' + stColor + ';font-size:.85rem;font-weight:600">' + status + '</span>' +
      '</div>' +
      '<div class="config-row" style="display:flex;align-items:center;justify-content:space-between">' +
      '<span class="config-label">Horário silencioso</span>' +
      '<span style="color:var(--txt2);font-size:.85rem">' +
      (nc.quietHours && nc.quietHours.on ? nc.quietHours.start + ' – ' + nc.quietHours.end : 'Desativado') +
      '</span></div>' +
      '<button class="btn" style="margin-top:.5rem;width:100%" onclick="navegarPara(\'lembretes\')">🔔 Configurar notificações</button>';
  }
}

function selecionarAvatar() {
  document.getElementById('avatarFileInput').click();
}

function trocarAvatar(evt) {
  var file = evt.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var size = 128;
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext('2d');
      var s = Math.min(img.width, img.height);
      var sx = (img.width - s) / 2;
      var sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      estado.perfil.avatar = canvas.toDataURL('image/jpeg', 0.7);
      salvarEstado();
      renderPerfil();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function escolherEmoji(emoji) {
  estado.perfil.avatar = emoji;
  salvarEstado();
  renderPerfil();
}

function mudarTema(t) {
  estado.tema = t;
  salvarEstado();
  aplicarTema();
  renderPerfil();
}

// ---- INIT / BOOTSTRAP ----
document.addEventListener('DOMContentLoaded', function() {
  // Load state
  carregarEstado();

  // Apply theme
  aplicarTema();

  // Navigate to last page or inicio
  var hash = location.hash.replace('#','') || 'inicio';
  navegarPara(hash);

  // Init notifications
  initNotificacoes();

  // Close sidebar on mobile click outside
  document.addEventListener('click', function(e) {
    var sb = document.getElementById('sidebar');
    if (sb && sb.classList.contains('aberto')) {
      if (!sb.contains(e.target) && !e.target.closest('[onclick*="toggleSidebar"]')) {
        closeSidebarOverlay();
      }
    }
  });

  // Close bottom sheet on click outside
  document.addEventListener('click', function(e) {
    var bs = document.getElementById('moreSheet');
    if (bs && bs.classList.contains('aberto')) {
      if (!bs.contains(e.target) && !e.target.closest('[onclick*="toggleMoreSheet"]')) {
        bs.classList.remove('aberto');
      }
    }
  });

  // Close search on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var so = document.getElementById('buscaOverlay');
      if (so && so.classList.contains('visivel')) so.classList.remove('visivel');
      var pm = document.getElementById('pixModal');
      if (pm && pm.classList.contains('ativo')) pm.classList.remove('ativo');
      var mo = document.getElementById('modalOverlay');
      if (mo && mo.classList.contains('visivel')) mo.classList.remove('visivel');
    }
  });

  // Apoie banner
  if (localStorage.getItem('apoieBannerFechado')) {
    var ab = document.getElementById('apoieBanner');
    if (ab) ab.style.display = 'none';
  }

  // Register service worker if available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  }

  // Update regressivas every minute
  setInterval(function() {
    if (estado.paginaAtual === 'regressiva') renderRegressivas();
  }, 60000);

  // Track visit
  try {
    var v = parseInt(localStorage.getItem('oj_visits') || '0') + 1;
    localStorage.setItem('oj_visits', v);
    var today = hojeStr();
    var dv = parseInt(localStorage.getItem('oj_visits_d') || '0');
    if (dv < 3) {
      localStorage.setItem('oj_visits_d', dv + 1);
      setTimeout(function() {
        var ab = document.getElementById('apoieBanner');
        if (ab && !localStorage.getItem('apoieBannerFechado')) ab.style.display = '';
      }, 30000);
    }
  } catch(e){}
});

// Handle hash navigation
window.addEventListener('hashchange', function() {
  var hash = location.hash.replace('#','') || 'inicio';
  navegarPara(hash);
});

// ============================================================
// ALIASES & WRAPPER FUNCTIONS (referenced by onclick in HTML)
// ============================================================

// Decisor aliases
function addDecisorOpcao() { addOpcao(); }
function sortearDecisor() { decidir(); }

// Pomodoro aliases/wrappers
function pomoToggle() {
  if (pomoRodando) { pausarPomodoro(); }
  else { startPomodoro(); }
}
function pomoReset() { resetPomodoro(); }

function pomoPausaCurta() {
  if (pomoInterval) clearInterval(pomoInterval);
  pomoRodando = true;
  pomoPausa = false;
  pomoSegundos = 5 * 60;
  document.getElementById('pomoLabel').textContent = '☕ Pausa curta';
  pomoInterval = setInterval(function() {
    if (pomoPausa) return;
    pomoSegundos--;
    if (pomoSegundos <= 0) {
      clearInterval(pomoInterval);
      pomoRodando = false;
      document.getElementById('pomoLabel').textContent = 'Foco';
      playBeep();
      renderPomodoro();
      return;
    }
    renderPomodoroTimer();
  }, 1000);
  renderPomodoro();
}

function pomoPausaLonga() {
  if (pomoInterval) clearInterval(pomoInterval);
  pomoRodando = true;
  pomoPausa = false;
  pomoSegundos = 15 * 60;
  document.getElementById('pomoLabel').textContent = '🌴 Pausa longa';
  pomoInterval = setInterval(function() {
    if (pomoPausa) return;
    pomoSegundos--;
    if (pomoSegundos <= 0) {
      clearInterval(pomoInterval);
      pomoRodando = false;
      document.getElementById('pomoLabel').textContent = 'Foco';
      playBeep();
      renderPomodoro();
      return;
    }
    renderPomodoroTimer();
  }, 1000);
  renderPomodoro();
}

function pomoConfigurar() {
  var foco = parseInt(document.getElementById('pomoFocoMin').value) || 25;
  var pausa = parseInt(document.getElementById('pomoPausaMin').value) || 5;
  estado.pomodoroMin = foco;
  pomoFocoMin = foco;
  pomoPausaMin = pausa;
  if (!pomoRodando) {
    pomoSegundos = foco * 60;
    renderPomodoroTimer();
  }
  salvarEstado();
  renderPomodoro();
}

// Calculator aliases/wrappers
function calcLimpar() { calcInput('C'); }
function calcDigito(val) { calcInput(val); }
function calcIgual() { calcInput('='); }

// Gerador de senhas
function gerarSenha() {
  var tam = parseInt(document.getElementById('senhaTam').value) || 16;
  var maius = document.getElementById('senhaMaius').checked;
  var minus = document.getElementById('senhaMinus').checked;
  var nums = document.getElementById('senhaNum').checked;
  var simb = document.getElementById('senhaSimb').checked;
  var chars = '';
  if (maius) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (minus) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (nums) chars += '0123456789';
  if (simb) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var senha = '';
  var arr = new Uint32Array(tam);
  crypto.getRandomValues(arr);
  for (var i = 0; i < tam; i++) {
    senha += chars[arr[i] % chars.length];
  }
  document.getElementById('senhaDisplay').textContent = senha;
}

function copiarSenha() {
  var txt = document.getElementById('senhaDisplay').textContent;
  if (!txt || txt === 'Clique para gerar') return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(function() {
      var el = document.getElementById('senhaDisplay');
      var orig = el.textContent;
      el.textContent = '✅ Copiado!';
      setTimeout(function(){ el.textContent = orig; }, 1200);
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e){}
    document.body.removeChild(ta);
  }
}

// Frases favoritas
function favoritarFrase() {
  if (!estado.frasesFav) estado.frasesFav = [];
  var idx = estado.fraseAtualIdx || 0;
  var f = frases[idx];
  if (!f) return;
  var jaExiste = estado.frasesFav.some(function(x){return x.t === f.t;});
  if (jaExiste) return; // já favoritada
  estado.frasesFav.push({t: f.t, a: f.a});
  salvarEstado();
  renderFrasesFav();
}

function renderFrasesFav() {
  var el = document.getElementById('frasesFavLista');
  if (!el) return;
  var html = '';
  (estado.frasesFav||[]).forEach(function(f, i) {
    html += '<div class="frase-item" style="padding:.4rem .6rem;margin:.3rem 0;background:var(--card2);border-radius:var(--raio);font-size:.82rem">';
    html += '"' + esc(f.t) + '" <small style="color:var(--txt3)">— ' + esc(f.a) + '</small>';
    html += ' <button class="btn btn-d" style="font-size:.55rem;padding:.1rem .3rem" onclick="delFraseFav('+i+')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.78rem">Nenhuma frase favoritada ainda.</div>';
  el.innerHTML = html;
}

function delFraseFav(idx) {
  if (estado.frasesFav) estado.frasesFav.splice(idx, 1);
  salvarEstado();
  renderFrasesFav();
}

// Leitura - filtro
function filtroLeitura(filtro) {
  estado.filtroLeitura = filtro;
  salvarEstado();
  renderLeitura();
}

// Leitura - atualizar status
function attStatusLeitura(id, novoStatus) {
  var l = estado.leituras.find(function(x){return x.id===id;});
  if (l) {
    l.status = novoStatus;
    if (novoStatus === 'lido') l.pagLidas = l.totalPag;
    salvarEstado();
    renderLeitura();
  }
}

// Humor wrapper - extrai nível 1-5 do texto do botão
function registrarHumor(texto) {
  var nivel = 3; // default
  if (texto.indexOf('péssimo') >= 0 || texto.indexOf('😢') >= 0) nivel = 1;
  else if (texto.indexOf('mal') >= 0 || texto.indexOf('😟') >= 0) nivel = 2;
  else if (texto.indexOf('mais ou menos') >= 0 || texto.indexOf('😐') >= 0) nivel = 3;
  else if (texto.indexOf('bem') >= 0 || texto.indexOf('🙂') >= 0) nivel = 4;
  else if (texto.indexOf('ótimo') >= 0 || texto.indexOf('😄') >= 0) nivel = 5;
  setHumor(nivel);
}

// Vida alias
function renderVida() { calcularVida(); }

// Revisão alias
function salvarRevisao() { addRevisao(); }

// Limpar despesas
function limparDespesas() {
  estado.despesas = [];
  salvarEstado();
  renderOrcamento();
}


/* ===== OrganizaIA ===== */
var oiaHistorico = [];
var OIA_HIST_KEY = 'oj_ia_hist';
var OIA_MAX_HIST = 60;

function carregarHistoricoIA() {
  try {
    var raw = localStorage.getItem(OIA_HIST_KEY);
    if (raw) oiaHistorico = JSON.parse(raw);
  } catch(e) { oiaHistorico = []; }
  renderHistoricoIA();
}

function salvarHistoricoIA() {
  try {
    if (oiaHistorico.length > OIA_MAX_HIST) oiaHistorico = oiaHistorico.slice(oiaHistorico.length - OIA_MAX_HIST);
    localStorage.setItem(OIA_HIST_KEY, JSON.stringify(oiaHistorico));
  } catch(e) {}
}

function renderHistoricoIA() {
  var box = document.getElementById('oiaMessages');
  if (!box) return;
  box.innerHTML = '';
  if (oiaHistorico.length === 0) {
    box.innerHTML = '<div class="oia-msg oia-msg-ai"><div class="oia-msg-avatar">🧠</div><div class="oia-msg-bubble">Olá! Sou o <strong>OrganizaIA</strong>, seu assistente de organização dentro do OrganizaJá. 🚀<br><br>Posso te ajudar a:<br>• Organizar tarefas e prioridades<br>• Montar planos de estudo<br>• Planejar sua semana<br>• Decidir o que fazer primeiro<br><br>Me pergunte algo ou use as sugestões abaixo!</div></div>';
    return;
  }
  for (var i = 0; i < oiaHistorico.length; i++) {
    var m = oiaHistorico[i];
    var isUser = m.role === 'user';
    var html = '<div class="oia-msg ' + (isUser ? 'oia-msg-user' : 'oia-msg-ai') + '">';
    html += '<div class="oia-msg-avatar">' + (isUser ? '👤' : '🧠') + '</div>';
    html += '<div class="oia-msg-bubble">' + (m.html || esc(m.text)) + '</div>';
    html += '</div>';
    box.innerHTML += html;
  }
  box.scrollTop = box.scrollHeight;
}

function abrirOrganizaIA() {
  if (isPlusFeature('organizaia')) {
    showPlusPrompt('OrganizaIA');
    return;
  }
  var overlay = document.getElementById('oiaOverlay');
  var panel = document.getElementById('oiaPanel');
  if (overlay) overlay.classList.add('visivel');
  if (panel) panel.classList.add('aberto');
  carregarHistoricoIA();
  var input = document.getElementById('oiaInput');
  if (input) setTimeout(function(){ input.focus(); }, 350);
  fecharSidebar();
  fecharMoreSheet();
}

function fecharOrganizaIA(e) {
  if (e && e.target && e.target.id !== 'oiaOverlay') return;
  var overlay = document.getElementById('oiaOverlay');
  var panel = document.getElementById('oiaPanel');
  if (overlay) overlay.classList.remove('visivel');
  if (panel) panel.classList.remove('aberto');
}

function fecharOrganizaIABtn() {
  fecharOrganizaIA({target:{id:'oiaOverlay'}});
}

function oiaEnviarSugestao(texto) {
  var input = document.getElementById('oiaInput');
  if (input) input.value = texto;
  oiaEnviar();
}

function oiaEnviar() {
  var input = document.getElementById('oiaInput');
  if (!input) return;
  var texto = input.value.trim();
  if (!texto) return;
  input.value = '';

  oiaHistorico.push({role:'user', text:texto, html:esc(texto)});
  salvarHistoricoIA();
  renderHistoricoIA();

  mostrarTypingIA(true);
  setTimeout(function() {
    var resposta = gerarRespostaIA(texto);
    oiaHistorico.push({role:'ai', text:resposta.text, html:resposta.html});
    salvarHistoricoIA();
    mostrarTypingIA(false);
    renderHistoricoIA();
  }, 600 + Math.random() * 600);
}

function mostrarTypingIA(show) {
  var el = document.getElementById('oiaTyping');
  if (el) { if (show) el.classList.add('ativo'); else el.classList.remove('ativo'); }
}

/* ---- Guardrail: detectar pedido de fazer trabalho ---- */
function detectarPedidoTrabalho(msg) {
  var lower = msg.toLowerCase();
  var padroes = ['faça minha', 'fazer minha', 'resolva esta', 'resolva essa', 'resolva a equação', 'faça a redação', 'faça meu trabalho', 'fazer meu trabalho', 'faça a minha prova', 'me dê a resposta', 'me dá a resposta', 'me de a resposta', 'escreva meu', 'escrever meu', 'faz minha', 'responde pra mim', 'responda a questão', 'como se resolve', 'me resolva', 'me faça', 'fazer por mim', 'faça por mim', 'meu tcc', 'minha monografia', 'resolver exercício', 'resolver a questão'];
  for (var i = 0; i < padroes.length; i++) {
    if (lower.indexOf(padroes[i]) !== -1) return true;
  }
  return false;
}

/* ---- Gerador de respostas baseado em regras ---- */
function gerarRespostaIA(msg) {
  if (detectarPedidoTrabalho(msg)) {
    return {text:'Não posso fazer seu trabalho por você, mas posso te ajudar a se organizar! 📋', html:'⚠️ <strong>Não posso fazer seu trabalho por você!</strong><br><br>Mas posso te ajudar de outras formas:<br><ul><li>Montar um cronograma de estudos</li><li>Organizar suas tarefas por prioridade</li><li>Sugerir como dividir o trabalho em etapas</li><li>Planejar seu tempo para conseguir entregar tudo</li></ul>Quer que eu te ajude com isso? 😊'};
  }

  var lower = msg.toLowerCase();
  var t = estado.tarefas || [];
  var provas = estado.estudos && estado.estudos.provas ? estado.estudos.provas : [];
  var trabalhos = estado.estudos && estado.estudos.trabalhos ? estado.estudos.trabalhos : [];
  var materias = estado.estudos && estado.estudos.materias ? estado.estudos.materias : [];
  var habitos = estado.habitos || [];
  var metas = estado.metas || [];
  var lembretes = estado.lembretes || [];
  var hoje = hojeStr();

  /* Organizar tarefas de hoje */
  if (lower.indexOf('organizar') !== -1 && (lower.indexOf('hoje') !== -1 || lower.indexOf('tarefa') !== -1)) {
    return gerarRespostaTarefasHoje(t, hoje);
  }

  /* Qual tarefa fazer primeiro / prioridade */
  if (lower.indexOf('primeiro') !== -1 || lower.indexOf('prioridade') !== -1 || lower.indexOf('importante') !== -1 || lower.indexOf('urgente') !== -1) {
    return gerarRespostaPrioridade(t, provas, trabalhos, hoje);
  }

  /* Plano de estudos */
  if (lower.indexOf('plano de estudo') !== -1 || lower.indexOf('plano de estudos') !== -1 || lower.indexOf('montar plano') !== -1 || lower.indexOf('como estudar') !== -1) {
    return gerarRespostaPlanoEstudos(provas, trabalhos, materias, hoje);
  }

  /* Organizar semana */
  if (lower.indexOf('semana') !== -1 || lower.indexOf('planejar') !== -1 || lower.indexOf('planejamento') !== -1) {
    return gerarRespostaPlanejamentoSemanal(t, provas, trabalhos, habitos, hoje);
  }

  /* Atrasado / atrasados */
  if (lower.indexOf('atrasado') !== -1 || lower.indexOf('atraso') !== -1 || lower.indexOf('pendente') !== -1 || lower.indexOf('perdido') !== -1) {
    return gerarRespostaAtrasados(t, provas, trabalhos, hoje);
  }

  /* Dica de produtividade */
  if (lower.indexOf('dica') !== -1 || lower.indexOf('produtividade') !== -1 || lower.indexOf('motivação') !== -1 || lower.indexOf('motivacao') !== -1 || lower.indexOf('concentrar') !== -1 || lower.indexOf('foco') !== -1) {
    return gerarRespostaDica();
  }

  /* Hábitos */
  if (lower.indexOf('hábito') !== -1 || lower.indexOf('habito') !== -1 || lower.indexOf('rotina') !== -1 || lower.indexOf('consistência') !== -1 || lower.indexOf('constância') !== -1) {
    return gerarRespostaHabitos(habitos);
  }

  /* Provas */
  if (lower.indexOf('prova') !== -1 || lower.indexOf('avaliação') !== -1 || lower.indexOf('avaliacao') !== -1 || lower.indexOf('teste') !== -1 || lower.indexOf('exame') !== -1) {
    return gerarRespostaProvas(provas, hoje);
  }

  /* Trabalhos */
  if (lower.indexOf('trabalho') !== -1 || lower.indexOf('projeto') !== -1 || lower.indexOf('entrega') !== -1) {
    return gerarRespostaTrabalhos(trabalhos, hoje);
  }

  /* Metas */
  if (lower.indexOf('meta') !== -1 || lower.indexOf('objetivo') !== -1 || lower.indexOf('alcance') !== -1 || lower.indexOf('conquistar') !== -1) {
    return gerarRespostaMetas(metas);
  }

  /* Saudação */
  if (lower.indexOf('oi') !== -1 || lower.indexOf('olá') !== -1 || lower.indexOf('ola') !== -1 || lower.indexOf('eai') !== -1 || lower.indexOf('e ai') !== -1 || lower.indexOf('hey') !== -1 || lower.indexOf('bom dia') !== -1 || lower.indexOf('boa tarde') !== -1 || lower.indexOf('boa noite') !== -1) {
    var saudacao = 'Olá! 😊';
    var resumo = gerarMiniResumo(t, provas, trabalhos, hoje);
    return {text:saudacao + ' Como posso te ajudar a se organizar?', html:'<strong>' + saudacao + '</strong><br><br>Como posso te ajudar hoje?<br><br>' + resumo};
  }

  /* Ajuda geral / o que você faz */
  if (lower.indexOf('ajuda') !== -1 || lower.indexOf('o que você') !== -1 || lower.indexOf('o que voce') !== -1 || lower.indexOf('como funciona') !== -1 || lower.indexOf('o que faz') !== -1 || lower.indexOf('pode me ajudar') !== -1) {
    return {text:'Sou o OrganizaIA e ajudo com organização!', html:'🧠 <strong>O que o OrganizaIA pode fazer por você:</strong><br><br>📋 <strong>Organizar tarefas</strong> — listar o que precisa fazer hoje e por prioridade<br>📚 <strong>Plano de estudos</strong> — montar cronograma baseado nas suas provas e trabalhos<br>📅 <strong>Planejar a semana</strong> — distribuir tarefas pelos próximos dias<br>🔥 <strong>Priorizar</strong> — dizer o que é mais urgente<br>⏰ <strong>Atrasados</strong> — ver o que passou do prazo<br>💡 <strong>Dicas</strong> — produtividade, foco e motivação<br><br>Use as sugestões abaixo ou me pergunte algo! 👇'};
  }

  /* Fallback inteligente com mini-resumo */
  var fallbackResumo = gerarMiniResumo(t, provas, trabalhos, hoje);
  return {text:'Não entendi totalmente, mas posso te ajudar com organização!', html:'🤔 Não entendi totalmente sua pergunta, mas aqui vai um resumo rápido:<br><br>' + fallbackResumo + '<br><br>Tente me perguntar sobre:<br>• Organizar minhas tarefas<br>• O que fazer primeiro<br>• Montar plano de estudos<br>• Organizar minha semana<br>• Ver o que está atrasado<br>• Dica de produtividade'};
}

/* ---- Mini resumo para fallback ---- */
function gerarMiniResumo(t, provas, trabalhos, hoje) {
  var pendentes = 0; var atrasados = 0; var provasProx = 0;
  for (var i = 0; i < t.length; i++) {
    if (!t[i].feito) { pendentes++; if (t[i].data && t[i].data < hoje) atrasados++; }
  }
  for (var i = 0; i < provas.length; i++) {
    if (provas[i].data && provas[i].data >= hoje && provas[i].data <= addDias(hoje, 7)) provasProx++;
  }
  var html = '📊 <strong>Seu resumo:</strong><br>';
  html += '• ' + pendentes + ' tarefa(s) pendente(s)';
  if (atrasados > 0) html += ' <span class="oia-tag" style="background:rgba(231,76,60,.12);color:var(--vermelho)">⚠️ ' + atrasados + ' atrasada(s)</span>';
  html += '<br>';
  html += '• ' + provasProx + ' prova(s) esta semana';
  if (pendentes === 0 && provasProx === 0) html += '<br>✅ Parece que está tudo em dia!';
  return html;
}

/* ---- Resposta: Tarefas de hoje ---- */
function gerarRespostaTarefasHoje(t, hoje) {
  var hojeItems = []; var amanhaItems = [];
  for (var i = 0; i < t.length; i++) {
    if (t[i].feito) continue;
    if (t[i].data === hoje) hojeItems.push(t[i]);
    else if (t[i].data && t[i].data < hoje) hojeItems.push(t[i]); /* atrasadas tb vão pra hoje */
  }
  if (hojeItems.length === 0) {
    return {text:'Nenhuma tarefa pendente para hoje!', html:'✅ <strong>Nenhuma tarefa pendente para hoje!</strong><br><br>Aproveite o tempo livre para:<br>• Revisar matérias<br>• Adiantar trabalhos futuros<br>• Praticar exercícios ou hábitos<br><br>Quer que eu monte um plano de estudos?'};
  }
  hojeItems.sort(function(a, b) { return prioridadeValor(b.prio) - prioridadeValor(a.prio); });
  var html = '📋 <strong>Suas tarefas para hoje:</strong><br><br><div class="oia-task-list">';
  for (var i = 0; i < hojeItems.length; i++) {
    var item = hojeItems[i];
    var prioClass = item.prio === 'alta' ? 'alta' : (item.prio === 'media' ? 'media' : 'baixa');
    var prioLabel = item.prio === 'alta' ? '🔴 Alta' : (item.prio === 'media' ? '🟡 Média' : '🟢 Baixa');
    var atrasado = item.data < hoje ? ' <span class="oia-tag" style="background:rgba(231,76,60,.12);color:var(--vermelho)">⚠️ Atrasada</span>' : '';
    html += '<div class="oia-task-item"><span class="oia-task-prio ' + prioClass + '">' + prioLabel + '</span> ' + esc(item.texto) + atrasado + '</div>';
  }
  html += '</div>';
  html += '<br>💡 <strong>Dica:</strong> Comece pelas de prioridade <span style="color:var(--vermelho);font-weight:700">alta</span> e vá descendo. Quer que eu detalhe a ordem?';
  return {text:'Suas tarefas de hoje organizadas!', html:html};
}

/* ---- Resposta: Prioridade ---- */
function gerarRespostaPrioridade(t, provas, trabalhos, hoje) {
  var todas = [];
  for (var i = 0; i < t.length; i++) {
    if (!t[i].feito) todas.push({tipo:'tarefa', nome:t[i].texto, data:t[i].data, prio:t[i].prio, materia:t[i].materia || ''});
  }
  for (var i = 0; i < provas.length; i++) {
    todas.push({tipo:'prova', nome:provas[i].materia + ' — Prova', data:provas[i].data, prio:'alta', materia:provas[i].materia});
  }
  for (var i = 0; i < trabalhos.length; i++) {
    todas.push({tipo:'trabalho', nome:trabalhos[i].materia + ' — Trabalho', data:trabalhos[i].data, prio:'alta', materia:trabalhos[i].materia});
  }
  if (todas.length === 0) {
    return {text:'Nada pendente!', html:'🎉 <strong>Tá tudo em dia!</strong><br><br>Não há tarefas, provas ou trabalhos pendentes. Aproveite para descansar ou se adiantar!'};
  }
  todas.sort(function(a, b) {
    var va = prioridadeValor(a.prio) + (a.data && a.data < hoje ? 100 : 0);
    var vb = prioridadeValor(b.prio) + (b.data && b.data < hoje ? 100 : 0);
    return vb - va;
  });
  var max = Math.min(todas.length, 10);
  var html = '🔥 <strong>O que fazer primeiro:</strong><br><br><div class="oia-task-list">';
  for (var i = 0; i < max; i++) {
    var item = todas[i];
    var prioClass = item.prio === 'alta' ? 'alta' : (item.prio === 'media' ? 'media' : 'baixa');
    var prioLabel = item.prio === 'alta' ? '🔴 Alta' : (item.prio === 'media' ? '🟡 Média' : '🟢 Baixa');
    var icone = item.tipo === 'prova' ? '📝' : (item.tipo === 'trabalho' ? '📄' : '✅');
    var atrasadoTag = item.data && item.data < hoje ? ' <span class="oia-tag" style="background:rgba(231,76,60,.12);color:var(--vermelho)">⚠️ Atrasado</span>' : '';
    html += '<div class="oia-task-item"><span class="oia-task-prio ' + prioClass + '">' + prioLabel + '</span> ' + icone + ' ' + esc(item.nome) + atrasadoTag + '</div>';
  }
  html += '</div>';
  if (todas.length > max) html += '<br><span style="color:var(--txt2);font-size:.82rem">+ ' + (todas.length - max) + ' itens restantes</span>';
  return {text:'Prioridades organizadas!', html:html};
}

/* ---- Resposta: Plano de estudos ---- */
function gerarRespostaPlanoEstudos(provas, trabalhos, materias, hoje) {
  var eventos = [];
  for (var i = 0; i < provas.length; i++) {
    if (!provas[i].concluido) eventos.push({tipo:'prova', materia:provas[i].materia, data:provas[i].data});
  }
  for (var i = 0; i < trabalhos.length; i++) {
    if (trabalhos[i].status !== 'concluido') eventos.push({tipo:'trabalho', materia:trabalhos[i].materia, data:trabalhos[i].data});
  }
  if (eventos.length === 0) {
    if (materias.length === 0) {
      return {text:'Cadastre matérias e provas para eu montar o plano!', html:'📚 <strong>Nenhuma prova ou trabalho cadastrado</strong><br><br>Para eu montar um plano de estudos, cadastre suas provas e trabalhos na seção <strong>Estudos</strong>. Depois me pergunte de novo! 😊'};
    }
    var html = '📚 <strong>Plano de estudos geral</strong><br><br>';
    html += 'Como não há provas/trabalhos próximos, divida o tempo entre suas matérias:<br><br>';
    for (var i = 0; i < materias.length; i++) {
      html += '📖 <strong>' + esc(materias[i].nome) + '</strong> — estude ~45min por sessão<br>';
    }
    html += '<br>💡 Use o <strong>Pomodoro</strong> (25min foco + 5min pausa) para cada sessão!';
    return {text:'Plano de estudos geral montado!', html:html};
  }
  eventos.sort(function(a, b) { return (a.data || '9999') < (b.data || '9999') ? -1 : 1; });
  var html = '📚 <strong>Plano de estudos personalizado:</strong><br><br>';
  for (var i = 0; i < eventos.length; i++) {
    var ev = eventos[i];
    var diasRestantes = ev.data ? diasEntre(hoje, ev.data) : '?';
    var icone = ev.tipo === 'prova' ? '📝' : '📄';
    var urgencia = '';
    if (typeof diasRestantes === 'number') {
      if (diasRestantes <= 1) urgencia = ' <span class="oia-tag" style="background:rgba(231,76,60,.12);color:var(--vermelho)">🔥 URGENTE</span>';
      else if (diasRestantes <= 3) urgencia = ' <span class="oia-tag" style="background:rgba(243,156,18,.12);color:var(--amarelo)">⏰ Em breve</span>';
    }
    html += icone + ' <strong>' + esc(ev.materia) + '</strong> — ' + ev.tipo + ' em ' + (typeof diasRestantes === 'number' ? diasRestantes + ' dia(s)' : 'data indefinida') + urgencia + '<br>';
    if (typeof diasRestantes === 'number' && diasRestantes > 0) {
      var sessoes = Math.min(diasRestantes, 5);
      html += '&nbsp;&nbsp;&nbsp;↳ ' + sessoes + ' sessão(ões) de revisão até lá (1 por dia)<br>';
    }
  }
  html += '<br>💡 <strong>Dica:</strong> Estude a matéria mais urgente primeiro. Use Pomodoro de 25min com 5min de pausa entre sessões!';
  return {text:'Plano de estudos montado!', html:html};
}

/* ---- Resposta: Planejamento semanal ---- */
function gerarRespostaPlanejamentoSemanal(t, provas, trabalhos, habitos, hoje) {
  var dias = [];
  for (var d = 0; d < 7; d++) {
    var data = addDias(hoje, d);
    var nomeDia = nomeDiaSemana(data);
    var itens = [];
    for (var i = 0; i < t.length; i++) {
      if (!t[i].feito && t[i].data === data) itens.push({t:'📋 ' + esc(t[i].texto), prio:t[i].prio});
    }
    for (var i = 0; i < provas.length; i++) {
      if (!provas[i].concluido && provas[i].data === data) itens.push({t:'📝 Prova: ' + esc(provas[i].materia), prio:'alta'});
    }
    for (var i = 0; i < trabalhos.length; i++) {
      if (trabalhos[i].status !== 'concluido' && trabalhos[i].data === data) itens.push({t:'📄 Entrega: ' + esc(trabalhos[i].materia), prio:'alta'});
    }
    itens.sort(function(a, b) { return prioridadeValor(b.prio) - prioridadeValor(a.prio); });
    dias.push({data:data, nome:nomeDia, itens:itens});
  }
  var html = '📅 <strong>Seu planejamento semanal:</strong><br><br>';
  var temAlgo = false;
  for (var d = 0; d < dias.length; d++) {
    var dia = dias[d];
    html += '<strong>' + dia.nome + '</strong>';
    if (dia.data === hoje) html += ' <span class="oia-tag">Hoje</span>';
    html += '<br>';
    if (dia.itens.length === 0) {
      html += '&nbsp;&nbsp;✨ Nada programado<br>';
    } else {
      temAlgo = true;
      for (var i = 0; i < dia.itens.length; i++) {
        html += '&nbsp;&nbsp;' + dia.itens[i].t + '<br>';
      }
    }
  }
  if (!temAlgo) {
    html += '<br>✅ Nada programado esta semana! Que tal cadastrar tarefas ou usar o planejamento semanal?';
  } else {
    html += '<br>💡 Foque nas tarefas de hoje e amanhã primeiro. As do resto da semana podem ser redistribuídas se necessário.';
  }
  return {text:'Planejamento semanal pronto!', html:html};
}

/* ---- Resposta: Atrasados ---- */
function gerarRespostaAtrasados(t, provas, trabalhos, hoje) {
  var atrasados = [];
  for (var i = 0; i < t.length; i++) {
    if (!t[i].feito && t[i].data && t[i].data < hoje) atrasados.push({tipo:'tarefa', nome:t[i].texto, data:t[i].data, prio:t[i].prio});
  }
  for (var i = 0; i < provas.length; i++) {
    if (!provas[i].concluido && provas[i].data && provas[i].data < hoje) atrasados.push({tipo:'prova', nome:provas[i].materia + ' — Prova', data:provas[i].data, prio:'alta'});
  }
  for (var i = 0; i < trabalhos.length; i++) {
    if (trabalhos[i].status !== 'concluido' && trabalhos[i].data && trabalhos[i].data < hoje) atrasados.push({tipo:'trabalho', nome:trabalhos[i].materia + ' — Trabalho', data:trabalhos[i].data, prio:'alta'});
  }
  if (atrasados.length === 0) {
    return {text:'Nada atrasado!', html:'🎉 <strong>Tá tudo em dia!</strong><br><br>Nenhuma tarefa, prova ou trabalho atrasado. Continue assim! 💪'};
  }
  atrasados.sort(function(a, b) { return (a.data || '') < (b.data || '') ? -1 : 1; });
  var html = '⚠️ <strong>Itens atrasados:</strong><br><br><div class="oia-task-list">';
  for (var i = 0; i < atrasados.length; i++) {
    var item = atrasados[i];
    var diasA = diasEntre(item.data, hoje);
    var icone = item.tipo === 'prova' ? '📝' : (item.tipo === 'trabalho' ? '📄' : '📋');
    html += '<div class="oia-task-item">' + icone + ' <strong>' + esc(item.nome) + '</strong> — ' + diasA + ' dia(s) atrasado</div>';
  }
  html += '</div>';
  html += '<br>💡 <strong>Recomendação:</strong> Priorize os mais atrasados primeiro. Se forem muitos, considere renegociar prazos ou remover os que não são mais relevantes.';
  return {text:'Itens atrasados encontrados!', html:html};
}

/* ---- Resposta: Dica de produtividade ---- */
var oiaDicas = [
  '🎯 Use a regra dos 2 minutos: se algo leva menos de 2 min, faça agora mesmo!',
  '🍅 Técnica Pomodoro: 25 min focado + 5 min pausa. Repita 4 vezes e descanse 15-30 min.',
  '📝 Comece o dia listando as 3 tarefas mais importantes. Foque nelas antes de qualquer coisa.',
  '🧠 Sua energia é melhor pela manhã. Deixe as tarefas mais difíceis pro início do dia.',
  '📱 Coloque o celular longe enquanto estuda. Mesmo silencioso, só ele estar perto distrai.',
  '✅ Marcar tarefas como concluídas libera dopamina. Use isso a seu favor — divida tarefas grandes em subtarefas!',
  '⏰ Defina horários fixos para estudar. Rotina vira hábito, e hábito vira resultado.',
  '🌊 Não tente fazer tudo de uma vez. Uma tarefa por vez, com foco total.',
  '😴 Sono é essencial! Estudar cansado rende menos. Priorize 7-8h de sono.',
  '📝 Antes de dormir, anote o que precisa fazer amanhã. Seu cérebro processa enquanto você dorme.',
  '🚫 Dizer "não" é tão importante quanto dizer "sim". Não sobrecarregue sua agenda.',
  '🏆 Comemore pequenas vitórias! Cada tarefa concluída é um passo rumo ao seu objetivo.'
];

function gerarRespostaDica() {
  var idx = Math.floor(Math.random() * oiaDicas.length);
  var html = '💡 <strong>Dica de produtividade:</strong><br><br>' + oiaDicas[idx];
  html += '<br><br>🔍 Quer mais dicas? É só pedir! Ou posso te ajudar a organizar suas tarefas.';
  return {text:'Dica de produtividade!', html:html};
}

/* ---- Resposta: Hábitos ---- */
function gerarRespostaHabitos(habitos) {
  if (habitos.length === 0) {
    return {text:'Cadastre hábitos para eu te ajudar!', html:'🔄 <strong>Nenhum hábito cadastrado</strong><br><br>Cadastre seus hábitos na seção de <strong>Hábitos</strong> para que eu possa te ajudar a manter a consistência!<br><br>💡 Dica: comece com 2-3 hábitos simples e vá adicionando mais conforme ganha ritmo.'};
  }
  var html = '🔄 <strong>Seus hábitos:</strong><br><br>';
  for (var i = 0; i < habitos.length; i++) {
    var h = habitos[i];
    var emoji = h.emoji || '📌';
    html += emoji + ' <strong>' + esc(h.nome) + '</strong>';
    var semanas = h.semanas || {};
    var semanaAtual = getSemanaKey();
    var diasSemana = semanas[semanaAtual] || {};
    var feitos = 0; var total = 7;
    for (var d in diasSemana) { if (diasSemana[d]) feitos++; }
    var pct = Math.round((feitos / total) * 100);
    html += ' — ' + pct + '% esta semana';
    if (pct >= 80) html += ' 🔥';
    else if (pct >= 50) html += ' 💪';
    else html += ' 📈';
    html += '<br>';
  }
  html += '<br>💡 <strong>Dica:</strong> Tente manter a consistência acima de 80% para criar hábitos duradouros!';
  return {text:'Resumo dos seus hábitos!', html:html};
}

/* ---- Resposta: Provas ---- */
function gerarRespostaProvas(provas, hoje) {
  var futuras = [];
  for (var i = 0; i < provas.length; i++) {
    if (!provas[i].concluido && provas[i].data && provas[i].data >= hoje) futuras.push(provas[i]);
  }
  if (futuras.length === 0) {
    return {text:'Nenhuma prova futura cadastrada!', html:'✅ <strong>Nenhuma prova futura!</strong><br><br>Tá tranquilo por enquanto. Aproveite para revisar matérias ou adiantar trabalhos!'};
  }
  futuras.sort(function(a, b) { return a.data < b.data ? -1 : 1; });
  var html = '📝 <strong>Suas próximas provas:</strong><br><br>';
  for (var i = 0; i < futuras.length; i++) {
    var p = futuras[i];
    var diasR = diasEntre(hoje, p.data);
    var urgencia = '';
    if (diasR <= 1) urgencia = ' <span class="oia-tag" style="background:rgba(231,76,60,.12);color:var(--vermelho)">🔥 AMANHÃ</span>';
    else if (diasR <= 3) urgencia = ' <span class="oia-tag" style="background:rgba(243,156,18,.12);color:var(--amarelo)">⏰ Em breve</span>';
    html += '• <strong>' + esc(p.materia) + '</strong> — em ' + diasR + ' dia(s)' + urgencia + '<br>';
  }
  html += '<br>💡 Comece a revisar pela mais próxima. Divida o conteúdo em tópicos e estude 1-2 por dia!';
  return {text:'Próximas provas listadas!', html:html};
}

/* ---- Resposta: Trabalhos ---- */
function gerarRespostaTrabalhos(trabalhos, hoje) {
  var futuros = [];
  for (var i = 0; i < trabalhos.length; i++) {
    if (trabalhos[i].status !== 'concluido' && trabalhos[i].data && trabalhos[i].data >= hoje) futuros.push(trabalhos[i]);
  }
  if (futuros.length === 0) {
    return {text:'Nenhum trabalho futuro!', html:'✅ <strong>Nenhum trabalho futuro!</strong><br><br>Tá em dia com as entregas. Se sobrar tempo, adiantou algo para depois!'};
  }
  futuros.sort(function(a, b) { return a.data < b.data ? -1 : 1; });
  var html = '📄 <strong>Seus próximos trabalhos:</strong><br><br>';
  for (var i = 0; i < futuros.length; i++) {
    var tr = futuros[i];
    var diasR = diasEntre(hoje, tr.data);
    var urgencia = '';
    if (diasR <= 1) urgencia = ' <span class="oia-tag" style="background:rgba(231,76,60,.12);color:var(--vermelho)">🔥 AMANHÃ</span>';
    else if (diasR <= 3) urgencia = ' <span class="oia-tag" style="background:rgba(243,156,18,.12);color:var(--amarelo)">⏰ Em breve</span>';
    html += '• <strong>' + esc(tr.materia) + '</strong> — entrega em ' + diasR + ' dia(s)' + urgencia + '<br>';
  }
  html += '<br>💡 Divida cada trabalho em etapas: pesquisa, rascunho, revisão e finalização. Comece pela entrega mais próxima!';
  return {text:'Próximos trabalhos listados!', html:html};
}

/* ---- Resposta: Metas ---- */
function gerarRespostaMetas(metas) {
  if (metas.length === 0) {
    return {text:'Cadastre metas para eu te ajudar!', html:'🎯 <strong>Nenhuma meta cadastrada</strong><br><br>Defina suas metas na seção de <strong>Metas</strong> para que eu possa te ajudar a acompanhá-las!'};
  }
  var html = '🎯 <strong>Suas metas:</strong><br><br>';
  var ativas = 0; var concluidas = 0;
  for (var i = 0; i < metas.length; i++) {
    var m = metas[i];
    if (m.feito) { concluidas++; continue; }
    ativas++;
    var pct = m.progresso ? Math.round(m.progresso) : 0;
    html += '• <strong>' + esc(m.nome) + '</strong> — ' + pct + '% concluída';
    if (pct >= 80) html += ' 🏆 Quase lá!';
    else if (pct >= 50) html += ' 💪 Na metade!';
    else html += ' 📈 Continue firme';
    html += '<br>';
  }
  html += '<br>✅ ' + concluidas + ' meta(s) concluída(s) | 🔄 ' + ativas + ' em andamento';
  return {text:'Resumo das suas metas!', html:html};
}

/* ---- Funções auxiliares OrganizaIA ---- */
function prioridadeValor(prio) {
  if (prio === 'alta') return 3;
  if (prio === 'media') return 2;
  return 1;
}

function addDias(dataStr, n) {
  var partes = dataStr.split('-');
  var d = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  d.setDate(d.getDate() + n);
  var ano = d.getFullYear();
  var mes = ('0' + (d.getMonth() + 1)).slice(-2);
  var dia = ('0' + d.getDate()).slice(-2);
  return ano + '-' + mes + '-' + dia;
}

function diasEntre(data1, data2) {
  var p1 = data1.split('-');
  var p2 = data2.split('-');
  var d1 = new Date(parseInt(p1[0]), parseInt(p1[1]) - 1, parseInt(p1[2]));
  var d2 = new Date(parseInt(p2[0]), parseInt(p2[1]) - 1, parseInt(p2[2]));
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function nomeDiaSemana(dataStr) {
  var partes = dataStr.split('-');
  var d = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  var nomes = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  return nomes[d.getDay()] + ' (' + dataStr.slice(5) + ')';
}

/* ===== FREEMIUM / PLUS ===== */

// -- Configuracao de precos (facil de alterar) --
var PLUS_CONFIG = {
  mensal: { preco: 9.90, label: 'R$ 9,90/mes', periodo: 'mes' },
  anual:  { preco: 89.90, label: 'R$ 89,90/ano', periodo: 'ano', economia: 'R$ 29,30' },
  gateway: null,       // placeholder: 'stripe' | 'mercadopago' | etc.
  gatewayEnv: 'test',  // 'test' | 'live'
  moeda: 'BRL',
  pais: 'BR'
};

// -- Mapa completo de recursos Plus --
var plusFeatures = {
  organizaia:             { nome: 'OrganizaIA',             icone: '🤖', desc: 'Assistente inteligente para organizar seus estudos e rotina' },
  progressoAvancado:     { nome: 'Estatisticas Avancadas', icone: '📊', desc: 'Graficos de tendencia, streaks, analise por periodo e comparacao semanal' },
  personalizacaoAvancada:{ nome: 'Personalizacao Avancada',icone: '🎨', desc: 'Temas extras, icones personalizados, cores customizaveis e fontes' },
  planejamentoAvancado:  { nome: 'Planejamento Avancado',  icone: '🧠', desc: 'Sugestoes inteligentes de horario, priorizacao automatica e auto-planejamento' },
  revisaoAvancada:       { nome: 'Revisao Avancada',       icone: '📚', desc: 'Planos de estudo personalizados, revisao espaçada e cronogramas automaticos' },
  pomodoroAvancado:      { nome: 'Pomodoro Avancado',      icone: '⚡', desc: 'Sessoes personalizadas, estatisticas detalhadas e metas de foco' },
  temasExtras:           { nome: 'Temas Adicionais',       icone: '🌙', desc: 'Temas escuro, minimal, natureza, synthwave e mais' },
  relatorios:           { nome: 'Relatorios de Progresso',icone: '📈', desc: 'Relatorios semanais e mensais com insights e recomendacoes' },
  planosEstudo:          { nome: 'Planos de Estudo',       icone: '📖', desc: 'Planos de estudo gerados automaticamente baseados nas suas provas e materias' }
};

// -- Contador de uso para conversao natural --
var plusUsageCount = 0;
var PLUS_CONVERSION_THRESHOLD = 15; // depois de N acoes, mostrar dica
var plusConversionShown = false;

function registrarUsoPlus() {
  plusUsageCount++;
  if (!plusConversionShown && plusUsageCount >= PLUS_CONVERSION_THRESHOLD && !estado.plus.ativo) {
    plusConversionShown = true;
    setTimeout(function() { mostrarDicaConversao(); }, 1200);
  }
}

function mostrarDicaConversao() {
  var el = document.getElementById('plusToastArea');
  if (!el) return;
  var msgs = [
    'Gostou de organizar sua semana? Conheca o OrganizaJa Plus! ⭐',
    'Quer ir alem? O OrganizaJa Plus tem recursos incriveis para voce! ⭐',
    'Organizando direitinho! Que tal turbinar com o Plus? ⭐'
  ];
  var msg = msgs[Math.floor(Math.random() * msgs.length)];
  el.innerHTML = '<div class="plus-toast plus-toast-conversion" onclick="navegarPara(\'plus\')">' + msg + '</div>';
  setTimeout(function() { el.innerHTML = ''; }, 5000);
}

// -- Verificacao de recurso Plus --
function isPlusFeature(slug) {
  if (estado.plus && estado.plus.ativo) return false;
  return plusFeatures[slug] !== undefined;
}

// -- Verificar se o usuario e Plus --
function isUsuarioPlus() {
  return estado.plus && estado.plus.ativo;
}

// -- Prompt de recurso Plus (nao bloqueia, so informa) --
function showPlusPrompt(featureSlug) {
  var feature = plusFeatures[featureSlug] || { nome: featureSlug || 'Este recurso', icone: '⭐', desc: 'Recurso disponivel no OrganizaJa Plus' };
  var el = document.getElementById('plusPromptOverlay');
  if (!el) return;
  var nameEl = document.getElementById('plusPromptFeature');
  var descEl = document.getElementById('plusPromptDesc');
  if (nameEl) nameEl.textContent = feature.nome;
  if (descEl) descEl.textContent = feature.desc;
  var iconEl = el.querySelector('.plus-prompt-icon');
  if (iconEl) iconEl.textContent = feature.icone;
  el.classList.add('show');
  el.style.display = 'flex';
}

function fecharPlusPrompt(e) {
  var el = document.getElementById('plusPromptOverlay');
  if (!el) return;
  if (e && e.target && e.target.id !== 'plusPromptOverlay') return;
  el.classList.remove('show');
  el.style.display = 'none';
}

function fecharPlusPromptBtn() {
  var el = document.getElementById('plusPromptOverlay');
  if (!el) return;
  el.classList.remove('show');
  el.style.display = 'none';
}

function plusPromptVerPlanos() {
  fecharPlusPromptBtn();
  navegarPara('plus');
}

// ===== ESTRUTURA DE ASSINATURA (preparacao para gateway futuro) =====
// Nao processa pagamentos reais. Apenas estrutura.

function criarAssinatura(plano) {
  // Placeholder: integrar com gateway de pagamento futuramente
  // plano: 'mensal' | 'anual'
  // Retornaria: { subscriptionId, status, gatewayId, ... }
  return { sucesso: false, mensagem: 'Pagamentos ainda nao estao disponiveis. Em breve!' };
}

function cancelarAssinatura() {
  // Placeholder: cancelar via gateway
  estado.plus.cancelado = true;
  salvarEstado();
  return { sucesso: false, mensagem: 'Pagamentos ainda nao estao disponiveis.' };
}

function atualizarPlano(novoPlano) {
  // Placeholder: upgrade/downgrade via gateway
  return { sucesso: false, mensagem: 'Pagamentos ainda nao estao disponiveis.' };
}

function verificarAssinatura() {
  // Placeholder: verificar status com gateway
  // Retornaria: { ativa, expira, plano, gatewayId }
  return estado.plus;
}

function ativarPlusTeste() {
  // Funcao de teste: ativa o Plus localmente (sem pagamento)
  // Para testar a experiencia do usuario Plus
  var hoje = new Date();
  var exp = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
  estado.plus.ativo = true;
  estado.plus.plano = 'mensal';
  estado.plus.inicio = hoje.toISOString().split('T')[0];
  estado.plus.expira = exp.toISOString().split('T')[0];
  estado.plus.cancelado = false;
  estado.plus.metodo = 'teste';
  estado.plus.gatewayId = '';
  salvarEstado();
  renderPlusPage();
  toastPlusEmBreve();
}

function desativarPlusTeste() {
  // Funcao de teste: volta ao plano gratuito
  estado.plus.ativo = false;
  estado.plus.plano = '';
  estado.plus.inicio = '';
  estado.plus.expira = '';
  estado.plus.cancelado = false;
  estado.plus.metodo = '';
  estado.plus.gatewayId = '';
  salvarEstado();
  renderPlusPage();
  toastPlusMensagem('Modo Plus desativado. Voce voltou ao plano Gratuito.');
}

function toastPlusMensagem(msg) {
  var el = document.getElementById('plusToastArea');
  if (!el) return;
  el.innerHTML = '<div class="plus-toast">' + esc(msg) + '</div>';
  setTimeout(function() { el.innerHTML = ''; }, 3500);
}

function toastPlusEmBreve() {
  toastPlusMensagem('⭐ Assinatura Plus em breve! Estamos preparando tudo para voce.');
}

// ===== PAGINA DE PLANOS (Escolha seu plano) =====

function renderPlusPage() {
  var container = document.getElementById('page-plus');
  if (!container) return;
  var ativo = estado.plus && estado.plus.ativo;
  var html = '';
  html += '<div class="plus-page">';

  // Header
  html += '<div class="plus-header">';
  html += '<div class="plus-header-icon">⭐</div>';
  html += '<h2 class="plus-header-title">Escolha seu plano</h2>';
  html += '<p class="plus-header-sub">Organize sua vida estudantil do jeito que funciona para voce. Sem pressao.</p>';
  html += '</div>';

  // Status Plus
  if (ativo) {
    html += '<div class="plus-status-active">';
    html += '✨ Voce e assinante Plus!';
    if (estado.plus.plano) html += ' <small>Plano: ' + esc(estado.plus.plano) + '</small>';
    if (estado.plus.expira) html += ' <small>Valido ate: ' + dataLocal(estado.plus.expira) + '</small>';
    html += '</div>';
    html += '<div class="plus-manage">';
    html += '<button class="plus-manage-btn" onclick="desativarPlusTeste()">Sair do modo teste Plus</button>';
    html += '</div>';
  }

  // Plans cards
  html += '<div class="plus-plans">';

  // Free plan card
  html += '<div class="plus-plan-card plus-plan-free">';
  html += '<div class="plus-plan-badge">Gratuito</div>';
  html += '<div class="plus-plan-name">Gratuito</div>';
  html += '<div class="plus-plan-desc">Para comecar a organizar sua rotina.</div>';
  html += '<div class="plus-plan-price">R$ 0 <span>para sempre</span></div>';
  html += '<ul class="plus-plan-features">';
  html += '<li class="plus-plan-feat">✅ Tarefas e lembretes</li>';
  html += '<li class="plus-plan-feat">📅 Calendario completo</li>';
  html += '<li class="plus-plan-feat">📚 Materias, Provas & Trabalhos</li>';
  html += '<li class="plus-plan-feat">🎯 Metas basicas</li>';
  html += '<li class="plus-plan-feat">🔥 Habitos e rastreadores</li>';
  html += '<li class="plus-plan-feat">📝 Notas e anotacoes</li>';
  html += '<li class="plus-plan-feat">🔍 Pesquisa global</li>';
  html += '<li class="plus-plan-feat">⏱️ Pomodoro basico</li>';
  html += '<li class="plus-plan-feat">📊 Revisao basica</li>';
  html += '</ul>';
  if (!ativo) html += '<div class="plus-plan-current">Seu plano atual</div>';
  html += '<button class="plus-plan-btn plus-plan-btn-secondary" onclick="fecharPlusPromptBtn()">Continuar gratis</button>';
  html += '</div>';

  // Plus plan card
  html += '<div class="plus-plan-card plus-plan-paid">';
  html += '<div class="plus-plan-badge plus-plan-badge-popular">Recomendado</div>';
  html += '<div class="plus-plan-name">OrganizaJa Plus</div>';
  html += '<div class="plus-plan-desc">Para quem quer levar sua organizacao para o proximo nivel.</div>';
  html += '<div class="plus-plan-price">' + PLUS_CONFIG.mensal.label + ' <span>ou ' + PLUS_CONFIG.anual.label + '</span></div>';
  if (PLUS_CONFIG.anual.economia) html += '<div class="plus-plan-savings">Economize ' + PLUS_CONFIG.anual.economia + ' no plano anual!</div>';
  html += '<ul class="plus-plan-features">';
  html += '<li class="plus-plan-feat">🤖 OrganizaIA com recursos avancados</li>';
  html += '<li class="plus-plan-feat">📊 Estatisticas avancadas</li>';
  html += '<li class="plus-plan-feat">🧠 Planejamento inteligente da semana</li>';
  html += '<li class="plus-plan-feat">📚 Planos de estudo personalizados</li>';
  html += '<li class="plus-plan-feat">🎨 Mais opcoes de personalizacao</li>';
  html += '<li class="plus-plan-feat">🌙 Temas adicionais</li>';
  html += '<li class="plus-plan-feat">📈 Relatorios de progresso</li>';
  html += '<li class="plus-plan-feat">⚡ Recursos avancados de organizacao</li>';
  html += '<li class="plus-plan-feat">✅ Tudo do plano Gratuito</li>';
  html += '</ul>';
  if (ativo) {
    html += '<div class="plus-plan-current">Seu plano atual ⭐</div>';
  } else {
    html += '<button class="plus-plan-btn plus-plan-btn-primary" onclick="toastPlusEmBreve()">⭐ Conhecer o Plus</button>';
  }
  html += '</div>';

  html += '</div>';

  // Pricing toggle monthly / annual
  html += '<div class="plus-pricing-toggle">';
  html += '<div class="plus-pricing-option active" onclick="togglePricing(\'mensal\', this)">Mensal</div>';
  html += '<div class="plus-pricing-option" onclick="togglePricing(\'anual\', this)">Anual <span class="plus-pricing-save">-24%</span></div>';
  html += '</div>';
  html += '<div class="plus-pricing-detail" id="plusPricingDetail">';
  html += '<div class="plus-pricing-line">Plano Mensal: <strong>' + PLUS_CONFIG.mensal.label + '</strong></div>';
  html += '<div class="plus-pricing-line">Plano Anual: <strong>' + PLUS_CONFIG.anual.label + '</strong> <span class="plus-pricing-savings">(economia de ' + PLUS_CONFIG.anual.economia + ')</span></div>';
  html += '</div>';

  // Feature comparison table
  html += '<div class="plus-compare">';
  html += '<div class="plus-compare-title">Comparacao detalhada de recursos</div>';
  html += '<div class="plus-compare-table">';
  html += '<div class="plus-compare-row plus-compare-header">';
  html += '<div class="plus-compare-cell">Recurso</div>';
  html += '<div class="plus-compare-cell">Gratuito</div>';
  html += '<div class="plus-compare-cell">Plus</div>';
  html += '</div>';

  var features = [
    ['Dashboard', true, true],
    ['Tarefas e lembretes', true, true],
    ['Calendario', true, true],
    ['Materias, Provas, Trabalhos', true, true],
    ['Metas basicas', true, true],
    ['Habitos e rastreadores', true, true],
    ['Notas', true, true],
    ['Pesquisa global', true, true],
    ['Pomodoro basico', true, true],
    ['Revisao basica', true, true],
    ['OrganizaIA (assistente IA)', false, true],
    ['Estatisticas avancadas', false, true],
    ['Planejamento inteligente', false, true],
    ['Planos de estudo personalizados', false, true],
    ['Personalizacao avancada', false, true],
    ['Temas adicionais', false, true],
    ['Relatorios de progresso', false, true],
    ['Recursos avancados de organizacao', false, true],
    ['Pomodoro avancado', false, true],
    ['Revisao avancada', false, true],
    ['Suporte prioritario', false, true]
  ];

  for (var i = 0; i < features.length; i++) {
    var f = features[i];
    html += '<div class="plus-compare-row">';
    html += '<div class="plus-compare-cell">' + esc(f[0]) + '</div>';
    html += '<div class="plus-compare-cell">' + (f[1] ? '<span class="check">✓</span>' : '<span class="cross">✗</span>') + '</div>';
    html += '<div class="plus-compare-cell">' + (f[2] ? '<span class="check">✓</span>' : '<span class="cross">✗</span>') + '</div>';
    html += '</div>';
  }
  html += '</div></div>';

  // FAQ
  html += '<div class="plus-faq">';
  html += '<div class="plus-faq-title">Perguntas frequentes</div>';

  var faqs = [
    ['O plano Gratuito vai continuar funcionando?', 'Sim! O plano Gratuito segue gratuito para sempre com todas as funcionalidades atuais. Nada vai ser removido. O Plus e totalmente opcional e so adiciona recursos extras.'],
    ['Preciso pagar para usar o OrganizaJa?', 'Nao! O OrganizaJa e gratuito e funcional sem pagar nada. O Plus e para quem quer recursos avancados, mas a versao gratuita resolve perfeitamente.'],
    ['Posso cancelar a qualquer momento?', 'Sim, voce pode cancelar quando quiser. Sem multas, sem burocracia, sem pegadinha.'],
    ['O Plus vai estar disponivel quando?', 'Estamos preparando tudo com cuidado! Em breve voce podera assinar direto pelo app.'],
    ['Meus dados estao seguros?', 'Absolutamente. Nao coletamos dados pessoais sensiveis, nao compartilhamos nada com terceiros, e respeitamos sua privacidade. O app e pensado para estudantes, inclusive menores de idade.'],
    ['Posso usar o Plus no computador e no celular?', 'Sim! Sua assinatura funciona em todos os seus dispositivos.'],
    ['O preco vai mudar?', 'O preco pode ser ajustado no futuro, mas assinantes atuais mantem o preco original. Sempre avisaremos antes de qualquer mudanca.']
  ];

  for (var j = 0; j < faqs.length; j++) {
    html += '<div class="plus-faq-item" onclick="toggleFaqItem(this)">';
    html += '<div class="plus-faq-q">' + esc(faqs[j][0]) + '</div>';
    html += '<div class="plus-faq-a">' + esc(faqs[j][1]) + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // Test area (development only)
  html += '<div class="plus-test-area">';
  html += '<div class="plus-test-title">🛠️ Area de Teste</div>';
  html += '<div class="plus-test-desc">Simule a experiencia de usuario Gratuito e Plus para testar o app.</div>';
  if (!ativo) {
    html += '<button class="plus-test-btn" onclick="ativarPlusTeste()">✨ Ativar modo Plus (teste)</button>';
  } else {
    html += '<button class="plus-test-btn" onclick="desativarPlusTeste()">🔄 Voltar ao Gratuito</button>';
  }
  html += '</div>';

  // Privacy note
  html += '<div class="plus-privacy-note">';
  html += '<div class="plus-privacy-icon">🔒</div>';
  html += '<div class="plus-privacy-text"><strong>Privacidade e Seguranca</strong><br>Nao coletamos dados pessoais sensiveis. Nao compartilhamos informacoes com terceiros. Respeitamos a privacidade de todos os usuarios, inclusive menores de idade. Nenhum pagamento real sera processado nesta versao.</div>';
  html += '</div>';

  html += '</div>';
  container.innerHTML = html;
}

function toggleFaqItem(el) {
  if (!el) return;
  if (el.classList.contains('open')) {
    el.classList.remove('open');
  } else {
    var items = el.parentElement.querySelectorAll('.plus-faq-item.open');
    for (var i = 0; i < items.length; i++) items[i].classList.remove('open');
    el.classList.add('open');
  }
}

function togglePricing(tipo, el) {
  var detail = document.getElementById('plusPricingDetail');
  var opts = el.parentElement.querySelectorAll('.plus-pricing-option');
  for (var i = 0; i < opts.length; i++) opts[i].classList.remove('active');
  el.classList.add('active');
  if (!detail) return;
  if (tipo === 'mensal') {
    detail.innerHTML = '<div class="plus-pricing-line">Plano Mensal: <strong>' + PLUS_CONFIG.mensal.label + '</strong></div>' +
      '<div class="plus-pricing-line">Plano Anual: <strong>' + PLUS_CONFIG.anual.label + '</strong> <span class="plus-pricing-savings">(economia de ' + PLUS_CONFIG.anual.economia + ')</span></div>';
  } else {
    detail.innerHTML = '<div class="plus-pricing-line">Plano Anual: <strong>' + PLUS_CONFIG.anual.label + '</strong> <span class="plus-pricing-savings">(economia de ' + PLUS_CONFIG.anual.economia + ')</span></div>' +
      '<div class="plus-pricing-line">Equivalente a <strong>R$ ' + (PLUS_CONFIG.anual.preco / 12).toFixed(2) + '/mes</strong></div>';
  }
}


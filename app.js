// ============================================================
// OrganizaJá v2 — app.js
// ============================================================

// ---- STATE ----
var estado = {
  tarefas: [],
  tarefasLixeira: [],
  tarefasArquivadas: [],
  filtroEtiqueta: '',
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
  // Estudos v3: sessoes de estudo, cronograma semanal, pomodoro persistente
  sessoes: [],
  cronograma: [],
  pomoConfig: {foco: 25, pausa: 5},
  pomoSessao: null,
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
  notifConfig: {global:true, tarefas:1, provas:3, trabalhos:2, eventos:1, lembretes:true, quietHours:{on:false, start:'22:00', end:'08:00'}},
  notifLog: [],
  perfil: {nome:'', avatar:'', serie:''},
  plus: {ativo: false, expira: '', plano: '', inicio: '', cancelado: false, metodo: '', gatewayId: ''}
};

var modalCallback = null;

// ---- PERFORMANCE HELPERS ----
function debounce(fn,ms){var t;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){fn.apply(c,a)},ms||100)}}
var _domCache={};
function $(id){return _domCache[id]||(_domCache[id]=document.getElementById(id))}
function $flushCache(){_domCache={}}
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
// Flag global: dados carregados com seguranca? Se o parse falhar,
// NAO deixamos o salvarEstado() final sobrescrever os dados brutos.
var _estadoCarregadoOk = true;

function carregarEstado() {
  var raw = null;
  try {
    raw = localStorage.getItem('organizaja');
  } catch(e) {
    // localStorage indisponivel (modo privado / bloqueado pelo navegador)
    console.warn('localStorage indisponivel ao carregar:', e);
    _estadoCarregadoOk = false;
    _avisarStorageIndisponivel();
  }

  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      // Merge with defaults
      Object.keys(estado).forEach(function(k) {
        if (parsed[k] !== undefined) estado[k] = parsed[k];
      });
    } catch(e) {
      // JSON corrompido/truncado: NAO sobrescrever. Guardar copia bruta
      // para eventual recuperacao manual e avisar o usuario.
      console.warn('Dados salvos corrompidos, preservando copia bruta:', e);
      _estadoCarregadoOk = false;
      try { localStorage.setItem('organizaja_backup_corrompido', raw); } catch(_){}
      try { setTimeout(function(){ showToast('Aviso: houve um problema ao ler os dados salvos. Uma copia de seguranca foi mantida.', 'error'); }, 1200); } catch(_){}
    }
  }

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
    if (h.descricao === undefined) h.descricao = '';
    if (h.freq === undefined) h.freq = 'diario';       // diario | dias | xsemana
    if (!Array.isArray(h.dias)) h.dias = [0,1,2,3,4,5,6]; // getDay() indices agendados
    if (h.metaSemana === undefined) h.metaSemana = 7;   // usado quando freq === 'xsemana'
    if (h.objetivo === undefined) h.objetivo = '';
    if (h.horario === undefined) h.horario = '';
    if (h.categoria === undefined) h.categoria = 'saude';
    if (h.cor === undefined) h.cor = '#00b894';
    if (h.ativo === undefined) h.ativo = true;
    if (h.melhorStreak === undefined) h.melhorStreak = 0;
    if (h.criado === undefined) h.criado = '';
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
    if (m.prioridade === undefined) m.prioridade = 'media'; // baixa | media | alta
    if (m.alvo === undefined) m.alvo = 0;                    // valor numerico alvo (0 = sem meta numerica)
    if (m.valorAtual === undefined) m.valorAtual = 0;
    if (m.unidade === undefined) m.unidade = '';
    if (!Array.isArray(m.etapas)) m.etapas = [];             // [{id,texto,feito}]
    if (m.pausada === undefined) m.pausada = false;
  });
  if (!estado.metasXpTotal) estado.metasXpTotal = 0;
  if (!estado.metasStreak) estado.metasStreak = 0;
  if (!estado.metasStreakData) estado.metasStreakData = '';

  // Migration: notas — novos campos + lixeira
  if (!Array.isArray(estado.notas)) estado.notas = [];
  estado.notas.forEach(function(n) {
    if (n.titulo === undefined) n.titulo = '';
    if (n.texto === undefined) n.texto = '';
    if (n.categoria === undefined) n.categoria = 'geral';
    if (!Array.isArray(n.tags)) n.tags = [];
    if (n.prioridade === undefined) n.prioridade = 'media';
    if (n.favorito === undefined) n.favorito = false;
    if (n.arquivada === undefined) n.arquivada = false;
    if (n.criada === undefined) n.criada = n.data || new Date().toISOString();
    if (n.data === undefined) n.data = n.criada;
    if (n.atualizada === undefined) n.atualizada = n.criada;
  });
  if (!Array.isArray(estado.notasLixeira)) estado.notasLixeira = [];
  (function(){
    var limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    estado.notasLixeira = estado.notasLixeira.filter(function(n){
      if (!n.excluidoEm) return true;
      var ts = Date.parse(n.excluidoEm);
      return isNaN(ts) ? true : ts >= limite;
    });
  })();

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
  // Migration ESTUDOS v3: prioridade em provas/trabalhos, sessoes, cronograma, pomodoro persistente
  estado.estudos.provas.forEach(function(p){ if (!p.prioridade) p.prioridade = 'media'; });
  estado.estudos.trabalhos.forEach(function(tr){ if (!tr.prioridade) tr.prioridade = 'media'; });
  if (!Array.isArray(estado.sessoes)) estado.sessoes = [];
  if (!Array.isArray(estado.cronograma)) estado.cronograma = [];
  if (!estado.pomoConfig || typeof estado.pomoConfig !== 'object') estado.pomoConfig = {foco: 25, pausa: 5};
  if (!estado.pomoConfig.foco) estado.pomoConfig.foco = 25;
  if (!estado.pomoConfig.pausa) estado.pomoConfig.pausa = 5;
  if (estado.pomoSessao === undefined) estado.pomoSessao = null;
  // normaliza sessoes (garante campos)
  estado.sessoes.forEach(function(s){
    if (!s.id) s.id = uid();
    if (!s.data) s.data = new Date().toISOString().slice(0,10);
    if (typeof s.min !== 'number') s.min = parseInt(s.min) || 0;
    if (!s.origem) s.origem = 'manual';
  });
  estado.cronograma.forEach(function(c){
    if (!c.id) c.id = uid();
    if (typeof c.dia !== 'number') c.dia = 0;
    if (typeof c.dur !== 'number') c.dur = parseInt(c.dur) || 30;
  });
  if (!estado.calView) estado.calView = 'mes';
  if (!estado.calEventos) estado.calEventos = [];
  if (estado.calDiaSel === undefined) estado.calDiaSel = null;
  if (!estado.ordemTarefas) estado.ordemTarefas = 'data';
  if (estado.ordemTarefasDesc === undefined) estado.ordemTarefasDesc = false;
  var filtrosValidos = ['todas','hoje','amanha','semana','atrasadas','concluidas','arquivadas'];
  if (filtrosValidos.indexOf(estado.filtroTarefas) < 0) {
    estado.filtroTarefas = estado.filtroTarefas === 'feitas' ? 'concluidas' : 'todas';
  }
  // Lixeira / Arquivo — garante arrays e normaliza itens
  if (!Array.isArray(estado.tarefasLixeira)) estado.tarefasLixeira = [];
  if (!Array.isArray(estado.tarefasArquivadas)) estado.tarefasArquivadas = [];
  if (estado.filtroEtiqueta === undefined) estado.filtroEtiqueta = '';
  estado.tarefasLixeira.forEach(tkNorm);
  estado.tarefasArquivadas.forEach(tkNorm);
  // Auto-limpeza da lixeira: remove itens excluidos ha mais de 30 dias
  (function(){
    var limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    estado.tarefasLixeira = estado.tarefasLixeira.filter(function(t){
      if (!t.excluidoEm) return true;
      var ts = Date.parse(t.excluidoEm);
      return isNaN(ts) ? true : ts >= limite;
    });
  })();
  migrarTarefas();

  // notifConfig migration
  if (!estado.notifConfig) {
    estado.notifConfig = {global:true, tarefas:1, provas:3, trabalhos:2, eventos:1, lembretes:true, quietHours:{on:false, start:'22:00', end:'08:00'}};
  } else {
    if (estado.notifConfig.global === undefined) estado.notifConfig.global = true;
    if (estado.notifConfig.tarefas === undefined) estado.notifConfig.tarefas = 1;
    if (estado.notifConfig.provas === undefined) estado.notifConfig.provas = 3;
    if (estado.notifConfig.trabalhos === undefined) estado.notifConfig.trabalhos = 2;
    if (estado.notifConfig.eventos === undefined) estado.notifConfig.eventos = 1;
    if (estado.notifConfig.lembretes === undefined) estado.notifConfig.lembretes = true;
    if (!estado.notifConfig.quietHours) estado.notifConfig.quietHours = {on:false, start:'22:00', end:'08:00'};
  }

  // notifLog (central de notificacoes) migration
  if (!Array.isArray(estado.notifLog)) estado.notifLog = [];

  // lembretes migration: novos campos (ETAPA 8)
  if (!Array.isArray(estado.lembretes)) estado.lembretes = [];
  estado.lembretes.forEach(function(l) {
    if (l.texto === undefined) l.texto = '';
    if (l.titulo === undefined) l.titulo = l.texto;
    if (l.descricao === undefined) l.descricao = '';
    if (l.categoria === undefined) l.categoria = 'geral';
    if (l.prioridade === undefined) l.prioridade = 'media';
    if (l.data === undefined) l.data = '';
    if (l.hora === undefined) l.hora = '';
    if (l.ativo === undefined) l.ativo = true;
    if (l.concluido === undefined) l.concluido = false;
    if (!l.repeticao) l.repeticao = {tipo:'nenhuma', dias:[]};
    if (!Array.isArray(l.repeticao.dias)) l.repeticao.dias = [];
    if (l.criada === undefined) l.criada = new Date().toISOString();
    // mantem texto e titulo sincronizados (texto usado por busca/dashboard/calendario)
    if (!l.texto && l.titulo) l.texto = l.titulo;
    if (!l.titulo && l.texto) l.titulo = l.texto;
  });

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
  if (estado.calEventos) { for (i = 0; i < estado.calEventos.length; i++) { if (estado.calEventos[i].lembrete === undefined) estado.calEventos[i].lembrete = estado.notifConfig.eventos; if (typeof calNormEvento === 'function') calNormEvento(estado.calEventos[i]); } }

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

  // So persiste as migracoes se o carregamento foi seguro.
  // Se os dados estavam corrompidos, NAO sobrescrevemos a copia bruta.
  if (_estadoCarregadoOk) salvarEstado();
}

// Aviso unico caso o navegador nao permita armazenamento local
var _avisouStorageIndisponivel = false;
function _avisarStorageIndisponivel() {
  if (_avisouStorageIndisponivel) return;
  _avisouStorageIndisponivel = true;
  try {
    setTimeout(function() {
      showToast('Atencao: seu navegador esta bloqueando o armazenamento. Os dados podem nao ser salvos (verifique o modo privado/anonimo).', 'error');
    }, 1500);
  } catch(_) {}
}

// Verifica de fato se localStorage funciona (grava e le de volta)
function storageDisponivel() {
  try {
    var k = '__oj_test__';
    localStorage.setItem(k, '1');
    var ok = localStorage.getItem(k) === '1';
    localStorage.removeItem(k);
    return ok;
  } catch(e) { return false; }
}

function salvarEstado() {
  try {
    var dados = JSON.stringify(estado);
    localStorage.setItem('organizaja', dados);
    // Verificacao de gravacao: confirma que realmente persistiu
    var check = localStorage.getItem('organizaja');
    if (check !== dados) {
      console.warn('Falha na verificacao de gravacao do estado.');
      return false;
    }
    return true;
  } catch(e) {
    console.warn('Erro ao salvar:', e);
    var quota = e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
    try {
      if (quota) {
        showToast('Armazenamento cheio. Libere espaco (ex.: remova a foto de perfil ou itens antigos) para nao perder dados.', 'error');
      } else {
        _avisarStorageIndisponivel();
      }
    } catch(_) {}
    return false;
  }
}

// ---- NAVIGATION ----
var pageNames = {
  inicio:'Início', meudia:'Meu Dia', tarefas:'Tarefas', calendario:'Calendário',
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

  // Registra a pagina atual (usada por timers como a contagem regressiva
  // que se auto-atualizam a cada minuto). Antes nunca era atribuida,
  // entao a atualizacao automatica da pagina Regressiva nao acontecia.
  estado.paginaAtual = pagina;

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
    return (n.titulo && n.titulo.toLowerCase().indexOf(q) >= 0)
      || (n.texto && n.texto.toLowerCase().indexOf(q) >= 0)
      || (Array.isArray(n.tags) && n.tags.some(function(t){ return t.toLowerCase().indexOf(q) >= 0; }))
      || (n.categoria && n.categoria.toLowerCase().indexOf(q) >= 0);
  });
  if (notas.length) categorias.push({ icon: '📝', titulo: 'Notas (' + notas.length + ')', items: notas.map(function(n) {
    var sub = (typeof notaCatLabel === 'function' ? notaCatLabel(n.categoria) : '') + (n.arquivada ? ' · arquivada' : '') + (n.favorito ? ' · ⭐' : '');
    return { id: n.id, texto: n.titulo || 'Sem título', sub: sub.replace(/^ · /, ''), acao: "buscarIrPara('notas','" + n.id + "')" };
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
  try { if (typeof lembreteRolarRecorrentes === 'function') lembreteRolarRecorrentes(); } catch (e) {}
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
        enviarNotificacao(titulo, corpo, key);
      }, delay);
    }
    return;
  }
  enviarNotificacao(titulo, corpo, key);
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
  if (estado.notifConfig.lembretes !== false) {
    estado.lembretes.forEach(function(l) {
      if (!l.ativo || l.concluido) return;
      var dtStr = (l.data ? l.data + 'T' : hojeStr() + 'T') + (l.hora || '09:00');
      var dt = new Date(dtStr).getTime();
      var diff = dt - agora;
      if (diff > 0 && diff < DIA) {
        notifTimers['lembrete_' + l.id] = setTimeout(function() {
          enviarNotificacaoDedup('🔔 ' + (l.titulo || l.texto), l.descricao || '', 'lembrete_' + l.id);
        }, diff);
      }
    });
  }

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

function enviarNotificacao(titulo, corpo, tipo) {
  try { if (typeof notifCentralRegistrar === 'function') notifCentralRegistrar(titulo, corpo, tipo); } catch (e) {}
  if (notifPermission === 'granted') {
    try { new Notification(titulo, { body: corpo, icon: 'icon-192.png' }); } catch (e) {}
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
// Injeta (uma unica vez) os estilos das novas secoes do Dashboard.
// Como a entrega e apenas do app.js, garantimos aqui a aparencia das
// secoes de Prioridades, Metas e estados vazios sem depender do CSS externo.
var _dashStylesOk = false;
function ensureDashStyles() {
  if (_dashStylesOk) return;
  _dashStylesOk = true;
  try {
    if (document.getElementById('dashExtraStyles')) return;
    var st = document.createElement('style');
    st.id = 'dashExtraStyles';
    st.textContent = ''
      + '.dash-prio-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:var(--card,#fff);border:1px solid rgba(128,128,128,.15);border-left:4px solid #6c5ce7;margin-bottom:8px;cursor:pointer;transition:transform .1s}'
      + '.dash-prio-item:hover{transform:translateY(-1px)}'
      + '.dash-prio-item.dp-alert{border-left-color:#e74c3c}'
      + '.dash-prio-item.dp-warn{border-left-color:#e67e22}'
      + '.dash-prio-item.dp-info{border-left-color:#6c5ce7}'
      + '.dpi-icon{font-size:1.1rem;line-height:1.4}'
      + '.dpi-body{flex:1;min-width:0}'
      + '.dpi-texto{font-weight:600;font-size:.9rem}'
      + '.dpi-meta{font-size:.75rem;opacity:.7;margin-top:2px}'
      + '.dash-meta-item{padding:8px 0;cursor:pointer;border-bottom:1px solid rgba(128,128,128,.1)}'
      + '.dash-meta-item:last-child{border-bottom:none}'
      + '.dm-top{display:flex;justify-content:space-between;font-size:.88rem;font-weight:600;margin-bottom:4px}'
      + '.dm-pct{opacity:.7}'
      + '.dm-bar{height:7px;border-radius:6px;background:rgba(128,128,128,.18);overflow:hidden}'
      + '.dm-fill{height:100%;background:linear-gradient(90deg,#6c5ce7,#a29bfe);border-radius:6px}'
      + '.dm-meta{font-size:.72rem;opacity:.7;margin-top:4px}'
      + '.dash-empty-btn{margin-left:8px;background:rgba(108,92,231,.12);color:#6c5ce7;border:none;padding:4px 10px;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer}'
      + '.dash-empty-btn:hover{background:rgba(108,92,231,.22)}'
      + '.dc-semdata .dc-num{color:#0984e3}'
      + '.dash-section-prio{border:1px solid rgba(230,126,34,.25)}';
    document.head.appendChild(st);
  } catch(_) {}
}

function renderDashboard() {
  ensureDashStyles();
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

  var hoje = hojeStr();

  // === GRUPOS DE TAREFAS ===
  // Tarefas de hoje: apenas com data de hoje.
  // Tarefas sem data: aparecem em secao propria (mantendo a correcao das
  // tarefas sem data, que continuam visiveis no Dashboard).
  // Atrasadas: com data no passado e nao concluidas.
  // Proximas: com data futura.
  var pendentes = estado.tarefas.filter(function(t){ return !t.feito; });
  var tarefasHoje = pendentes.filter(function(t){ return t.data === hoje; });
  var tarefasSemData = pendentes.filter(function(t){ return !t.data; });
  var atrasadas = estado.tarefas.filter(eAtrasada);
  var proximas = pendentes.filter(function(t){ return t.data && t.data > hoje; })
    .sort(function(a,b){ return (a.data + (a.hora||'')).localeCompare(b.data + (b.hora||'')); });

  var pomos = (estado.pomodorosData === hoje) ? estado.pomodorosHoje : 0;
  var agua = (estado.aguaData === hoje) ? estado.aguaHoje : 0;

  // Helper: renderiza uma linha de tarefa com checkbox
  function dashTarefaRow(t, extra) {
    var catE = catEmojis[t.categoria] || '';
    var prioC = t.prio === 'alta' ? 'prio-alta' : t.prio === 'baixa' ? 'prio-baixa' : '';
    var s = '<div class="dash-tarefa-item ' + prioC + '">';
    s += '<div class="dt-check" onclick="dashToggleTarefa(\'' + t.id + '\')">' + (t.feito ? '✅' : '⬜') + '</div>';
    s += '<div class="dt-body">';
    s += '<div class="dt-texto">' + (catE ? catE + ' ' : '') + esc(t.texto) + '</div>';
    var metaTxt = extra || '';
    if (!metaTxt && t.hora) metaTxt = '🕐 ' + t.hora;
    else if (extra && t.hora) metaTxt = extra + ' · ' + t.hora;
    if (metaTxt) s += '<div class="dt-meta">' + metaTxt + '</div>';
    s += '</div></div>';
    return s;
  }

  // === STATUS HERO ===
  var totalFazer = tarefasHoje.length + tarefasSemData.length;
  var statusText = '';
  if (atrasadas.length > 0) {
    statusText = '<span class="dhs-alert">' + atrasadas.length + ' atrasada' + (atrasadas.length > 1 ? 's' : '') + '</span>';
  } else if (totalFazer === 0) {
    statusText = '<span class="dhs-ok">Tudo em dia ✨</span>';
  } else {
    statusText = '<span class="dhs-normal">' + totalFazer + ' tarefa' + (totalFazer > 1 ? 's' : '') + ' para fazer</span>';
  }
  document.getElementById('dashHeroStatus').innerHTML = statusText;

  // === CARDS ===
  var feitasHoje = estado.tarefas.filter(function(t){ return t.feito && (t.data === hoje || !t.data); }).length;
  var cards = '';
  cards += '<div class="dash-card dc-tarefas"><span class="dc-num">' + tarefasHoje.length + '</span><span class="dc-label">Tarefas hoje</span></div>';
  if (tarefasSemData.length > 0) {
    cards += '<div class="dash-card dc-semdata"><span class="dc-num">' + tarefasSemData.length + '</span><span class="dc-label">Sem data</span></div>';
  }
  if (atrasadas.length > 0) {
    cards += '<div class="dash-card dc-atrasadas"><span class="dc-num">' + atrasadas.length + '</span><span class="dc-label">Atrasadas</span></div>';
  }
  cards += '<div class="dash-card dc-feitas"><span class="dc-num">' + feitasHoje + '</span><span class="dc-label">Concluídas</span></div>';
  cards += '<div class="dash-card dc-pomo"><span class="dc-num">' + pomos + '</span><span class="dc-label">Pomodoros</span></div>';
  cards += '<div class="dash-card dc-agua"><span class="dc-num">' + agua + '/8</span><span class="dc-label">Copos de água</span></div>';
  document.getElementById('dashCards').innerHTML = cards;

  // Dados de estudos usados em varias secoes
  var provasFuturas = (estado.estudos && estado.estudos.provas) ? estado.estudos.provas.filter(function(p){ return p.data && p.data >= hoje && !p.concluido; }).sort(function(a,b){ return a.data.localeCompare(b.data); }) : [];
  var trabsFuturos = (estado.estudos && estado.estudos.trabalhos) ? estado.estudos.trabalhos.filter(function(tr){ return tr.data && tr.data >= hoje && tr.status !== 'concluido'; }).sort(function(a,b){ return a.data.localeCompare(b.data); }) : [];
  function diasAte(dataStr){ return Math.ceil((new Date(dataStr + 'T12:00:00') - new Date()) / 86400000); }
  function labelDias(n){ return n <= 0 ? 'hoje' : n === 1 ? 'amanhã' : 'em ' + n + ' dias'; }

  // === PRIORIDADES ===
  var prio = [];
  atrasadas.slice(0, 4).forEach(function(t){
    prio.push({ icon: '🚨', texto: t.texto, meta: 'Tarefa atrasada · venceu ' + dataLocal(t.data), cls: 'dp-alert', acao: "navegarPara('tarefas')" });
  });
  provasFuturas.forEach(function(p){
    var n = diasAte(p.data);
    if (n <= 3) prio.push({ icon: '📝', texto: 'Prova: ' + p.texto + (p.materia ? ' (' + p.materia + ')' : ''), meta: 'Prova ' + labelDias(n) + ' · ' + dataLocal(p.data), cls: n <= 1 ? 'dp-alert' : 'dp-warn', acao: "navegarPara('estudos')" });
  });
  trabsFuturos.forEach(function(tr){
    var n = diasAte(tr.data);
    if (n <= 3) prio.push({ icon: '📄', texto: 'Trabalho: ' + tr.texto + (tr.materia ? ' (' + tr.materia + ')' : ''), meta: 'Entrega ' + labelDias(n) + ' · ' + dataLocal(tr.data), cls: n <= 1 ? 'dp-alert' : 'dp-warn', acao: "navegarPara('estudos')" });
  });
  // Tarefas de prioridade alta (hoje / sem data / proximas), sem repetir atrasadas
  pendentes.filter(function(t){ return t.prio === 'alta' && !eAtrasada(t); }).slice(0, 4).forEach(function(t){
    var quando = t.data === hoje ? 'Hoje' : (!t.data ? 'Sem data' : dataLocal(t.data));
    prio.push({ icon: '🔺', texto: t.texto, meta: 'Prioridade alta · ' + quando, cls: 'dp-warn', acao: "navegarPara('tarefas')" });
  });
  // Eventos do calendario proximos (<= 2 dias)
  (estado.calEventos || []).filter(function(c){ return c.data && c.data >= hoje; }).sort(function(a,b){ return a.data.localeCompare(b.data); }).forEach(function(c){
    var n = diasAte(c.data);
    if (n <= 2) prio.push({ icon: '📅', texto: c.titulo, meta: 'Evento ' + labelDias(n) + (c.hora ? ' · ' + c.hora : ''), cls: 'dp-info', acao: "navegarPara('calendario')" });
  });
  // Metas perto do prazo (<= 7 dias) e nao concluidas
  (estado.metas || []).filter(function(m){ return !m.feito && m.prazo && m.prazo >= hoje; }).sort(function(a,b){ return a.prazo.localeCompare(b.prazo); }).forEach(function(m){
    var n = diasAte(m.prazo);
    if (n <= 7) prio.push({ icon: '🎯', texto: 'Meta: ' + m.texto, meta: 'Prazo ' + labelDias(n) + ' · ' + (m.progresso || 0) + '%', cls: n <= 2 ? 'dp-warn' : 'dp-info', acao: "navegarPara('metas')" });
  });
  prio = prio.slice(0, 8);
  var prioSec = document.getElementById('dashPrioridadesSection');
  if (prio.length === 0) {
    if (prioSec) prioSec.style.display = 'none';
  } else {
    if (prioSec) prioSec.style.display = '';
    document.getElementById('dashPrioridadesCount').textContent = '(' + prio.length + ')';
    var htmlPrio = '';
    prio.forEach(function(p){
      htmlPrio += '<div class="dash-prio-item ' + p.cls + '" onclick="' + p.acao + '">';
      htmlPrio += '<div class="dpi-icon">' + p.icon + '</div>';
      htmlPrio += '<div class="dpi-body"><div class="dpi-texto">' + esc(p.texto) + '</div><div class="dpi-meta">' + esc(p.meta) + '</div></div>';
      htmlPrio += '</div>';
    });
    document.getElementById('dashPrioridades').innerHTML = htmlPrio;
  }

  // === TAREFAS DE HOJE ===
  document.getElementById('dashTarefasCount').textContent = tarefasHoje.length ? '(' + tarefasHoje.length + ')' : '';
  var htmlTh = '';
  tarefasHoje.forEach(function(t){ htmlTh += dashTarefaRow(t); });
  if (!htmlTh) htmlTh = '<div class="dash-empty">Nenhuma tarefa para hoje 🎉 <button class="dash-empty-btn" onclick="dashQuickTarefa()">+ Nova tarefa</button></div>';
  document.getElementById('dashTarefasHoje').innerHTML = htmlTh;

  // === TAREFAS SEM DATA ===
  var semSec = document.getElementById('dashSemDataSection');
  if (tarefasSemData.length === 0) {
    if (semSec) semSec.style.display = 'none';
  } else {
    if (semSec) semSec.style.display = '';
    document.getElementById('dashSemDataCount').textContent = '(' + tarefasSemData.length + ')';
    var htmlSd = '';
    tarefasSemData.slice(0, 6).forEach(function(t){ htmlSd += dashTarefaRow(t, 'Sem data'); });
    if (tarefasSemData.length > 6) htmlSd += '<div class="duc-mais" onclick="navegarPara(\'tarefas\')">+' + (tarefasSemData.length - 6) + ' mais →</div>';
    document.getElementById('dashSemData').innerHTML = htmlSd;
  }

  // === PRÓXIMAS TAREFAS ===
  var proxSec = document.getElementById('dashProximasSection');
  if (proximas.length === 0) {
    if (proxSec) proxSec.style.display = 'none';
  } else {
    if (proxSec) proxSec.style.display = '';
    document.getElementById('dashProximasCount').textContent = '(' + proximas.length + ')';
    var htmlPx = '';
    proximas.slice(0, 5).forEach(function(t){
      var n = diasAte(t.data);
      htmlPx += dashTarefaRow(t, labelDias(n).charAt(0).toUpperCase() + labelDias(n).slice(1) + ' · ' + dataLocal(t.data));
    });
    if (proximas.length > 5) htmlPx += '<div class="duc-mais" onclick="navegarPara(\'tarefas\')">+' + (proximas.length - 5) + ' mais →</div>';
    document.getElementById('dashProximas').innerHTML = htmlPx;
  }

  // === ATRASADAS ===
  document.getElementById('dashAtrasadasCount').textContent = atrasadas.length ? '(' + atrasadas.length + ')' : '';
  var htmlAtr = '';
  atrasadas.forEach(function(t) {
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
  var htmlProva = '';
  if (provasFuturas.length > 0) {
    var p = provasFuturas[0];
    var diasRest = diasAte(p.data);
    var corMat = (estado.estudos.materias.find(function(m){return m.nome===p.materia})||{}).cor || 'var(--cor2)';
    var urgente = diasRest <= 3;
    htmlProva += '<div class="duc-evento' + (urgente ? ' duc-urgente' : '') + '" style="border-left:3px solid ' + corMat + '">';
    htmlProva += '<div class="duce-nome">' + esc(p.texto) + (p.materia ? ' <small>(' + esc(p.materia) + ')</small>' : '') + '</div>';
    if (p.hora) htmlProva += '<div class="duce-hora">🕐 ' + esc(p.hora) + '</div>';
    if (p.conteudo) htmlProva += '<div class="duce-extra">📋 ' + esc(p.conteudo) + '</div>';
    htmlProva += '<div class="duce-data' + (urgente ? ' duce-data-alert' : '') + '">em ' + diasRest + ' dia' + (diasRest !== 1 ? 's' : '') + ' · ' + dataLocal(p.data) + '</div>';
    htmlProva += '</div>';
    if (provasFuturas.length > 1) {
      htmlProva += '<div class="duc-mais" onclick="navegarPara(\'estudos\')">+' + (provasFuturas.length - 1) + ' mais →</div>';
    }
  } else {
    htmlProva = '<div class="duc-empty">Nenhuma prova registrada <button class="dash-empty-btn" onclick="dashQuickProva()">+ Prova</button></div>';
  }
  document.getElementById('dashProximaProvaBody').innerHTML = htmlProva;

  // === PRÓXIMO TRABALHO ===
  var htmlTrab = '';
  if (trabsFuturos.length > 0) {
    var tr = trabsFuturos[0];
    var diasTr = diasAte(tr.data);
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
      htmlTrab += '<div class="duc-mais" onclick="navegarPara(\'estudos\')">+' + (trabsFuturos.length - 1) + ' mais →</div>';
    }
  } else {
    htmlTrab = '<div class="duc-empty">Nenhum trabalho pendente <button class="dash-empty-btn" onclick="dashQuickTrabalho()">+ Trabalho</button></div>';
  }
  document.getElementById('dashProximoTrabalhoBody').innerHTML = htmlTrab;

  // === PRÓXIMOS COMPROMISSOS ===
  var compromissos = [];
  estado.tarefas.filter(function(t){return !t.feito && t.data && t.data >= hoje}).forEach(function(t){
    compromissos.push({texto:t.texto, data:t.data, hora:t.hora, icon:catEmojis[t.categoria]||'📌', tipo:'tarefa', acao:"navegarPara('tarefas')"});
  });
  estado.lembretes.filter(function(l){return l.ativo && l.data && l.data >= hoje}).forEach(function(l){
    compromissos.push({texto:l.texto, data:l.data, hora:l.hora, icon:'🔔', tipo:'lembrete', acao:"navegarPara('lembretes')"});
  });
  (estado.calEventos||[]).filter(function(c){return c.data && c.data >= hoje}).forEach(function(c){
    compromissos.push({texto:c.titulo, data:c.data, hora:c.hora, icon:'📅', tipo:'evento', acao:"navegarPara('calendario')"});
  });
  compromissos.sort(function(a,b){return (a.data+(a.hora||'')).localeCompare(b.data+(b.hora||''));});
  document.getElementById('dashCompromissosCount').textContent = compromissos.length ? '(' + compromissos.length + ')' : '';
  var htmlComp = '';
  if (compromissos.length > 0) {
    compromissos.slice(0, 4).forEach(function(c){
      var diasC = diasAte(c.data);
      var labelC = diasC <= 0 ? 'Hoje' : diasC === 1 ? 'Amanhã' : 'em ' + diasC + ' dias';
      htmlComp += '<div class="dash-comp-item" onclick="' + c.acao + '">';
      htmlComp += '<div class="dci-icon">' + c.icon + '</div>';
      htmlComp += '<div class="dci-body">';
      htmlComp += '<div class="dci-texto">' + esc(c.texto) + '</div>';
      htmlComp += '<div class="dci-meta">' + labelC + (c.hora ? ' · ' + c.hora : '') + ' · ' + dataLocal(c.data) + '</div>';
      htmlComp += '</div>';
      htmlComp += '</div>';
    });
    if (compromissos.length > 4) {
      htmlComp += '<div class="duc-mais" onclick="navegarPara(\'calendario\')">+' + (compromissos.length - 4) + ' mais →</div>';
    }
  } else {
    htmlComp = '<div class="dash-empty">Nenhum compromisso próximo <button class="dash-empty-btn" onclick="dashQuickEvento()">+ Evento</button></div>';
  }
  document.getElementById('dashProximoCompromisso').innerHTML = htmlComp;

  // === HÁBITOS DE HOJE ===
  var diaIdx = getDiaSemana();
  var sk = getSemanaKey();
  var htmlHab = '';
  var habsHoje = estado.habitos.filter(function(h){ return h.ativo !== false && habAgendadoHoje(h, diaIdx); });
  habsHoje.forEach(function(h) {
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    var feito = arr[diaIdx];
    var streak = calcularStreak(h);
    htmlHab += '<div class="dash-habito-item ' + (feito ? 'feito' : '') + '" onclick="toggleHabitoDash(\''+h.id+'\')">';
    htmlHab += '<div class="dh-check">' + (feito ? '✅' : '⬜') + '</div>';
    htmlHab += '<div class="dh-body">';
    htmlHab += '<div class="dh-texto">' + (h.emoji||'✨') + ' ' + esc(h.nome) + (h.horario ? ' <span class="dh-hora">⏰ '+esc(h.horario)+'</span>' : '') + '</div>';
    htmlHab += '</div>';
    if (streak > 0) htmlHab += '<div class="dh-streak">🔥 ' + streak + '</div>';
    htmlHab += '</div>';
  });
  if (!htmlHab) {
    var temHabitos = estado.habitos.some(function(h){ return h.ativo !== false; });
    htmlHab = temHabitos
      ? '<div class="dash-empty">Nenhum hábito agendado para hoje 🌟</div>'
      : '<div class="dash-empty">Nenhum hábito criado ainda <button class="dash-empty-btn" onclick="dashQuickHabito()">+ Hábito</button></div>';
  }
  document.getElementById('dashHabitosHoje').innerHTML = htmlHab;

  // === METAS ===
  var metasAtivas = (estado.metas || []).filter(function(m){ return !m.feito && !m.pausada; });
  document.getElementById('dashMetasCount').textContent = metasAtivas.length ? '(' + metasAtivas.length + ')' : '';
  var htmlMetas = '';
  if (metasAtivas.length > 0) {
    var metasOrd = metasAtivas.slice().sort(function(a,b){
      var pa = a.prazo || '9999-99-99', pb = b.prazo || '9999-99-99';
      return pa.localeCompare(pb);
    });
    metasOrd.slice(0, 3).forEach(function(m){
      var pct = metaProgresso(m);
      var prazoTxt = m.prazo ? dataLocal(m.prazo) : 'Sem prazo';
      var atr = m.prazo && m.prazo < hoje;
      htmlMetas += '<div class="dash-meta-item" onclick="navegarPara(\'metas\')">';
      htmlMetas += '<div class="dm-top"><span class="dm-nome">' + (m.prioridade==='alta'?'🔴 ':m.prioridade==='baixa'?'🔵 ':'🎯 ') + esc(m.texto) + '</span><span class="dm-pct">' + pct + '%</span></div>';
      htmlMetas += '<div class="dm-bar"><div class="dm-fill" style="width:' + pct + '%"></div></div>';
      htmlMetas += '<div class="dm-meta' + (atr ? ' dt-meta-alert' : '') + '">' + (atr ? '⏰ Atrasada · ' : '📅 ') + prazoTxt + '</div>';
      htmlMetas += '</div>';
    });
    if (metasAtivas.length > 3) htmlMetas += '<div class="duc-mais" onclick="navegarPara(\'metas\')">+' + (metasAtivas.length - 3) + ' mais →</div>';
  } else {
    htmlMetas = '<div class="dash-empty">Nenhuma meta ativa 🎯 <button class="dash-empty-btn" onclick="dashQuickMeta()">+ Nova meta</button></div>';
  }
  document.getElementById('dashMetas').innerHTML = htmlMetas;

  // === LEMBRETES ===
  var lembretesAtivos = (estado.lembretes || []).filter(function(l){ return l.ativo && !l.concluido; });
  document.getElementById('dashLembretesCount').textContent = lembretesAtivos.length ? '(' + lembretesAtivos.length + ')' : '';
  var htmlLem = '';
  if (lembretesAtivos.length > 0) {
    var lemOrd = lembretesAtivos.slice().sort(function(a,b){
      var da = (a.data || '9999-99-99') + (a.hora || ''), db = (b.data || '9999-99-99') + (b.hora || '');
      return da.localeCompare(db);
    });
    lemOrd.slice(0, 4).forEach(function(l){
      var metaL = '';
      if (l.data) { var nL = diasAte(l.data); metaL = (nL < 0 ? 'venceu ' : labelDias(nL).charAt(0).toUpperCase() + labelDias(nL).slice(1) + ' · ') + dataLocal(l.data); }
      if (l.hora) metaL += (metaL ? ' · ' : '') + l.hora;
      if (!metaL) metaL = 'Sem data';
      htmlLem += '<div class="dash-comp-item" onclick="navegarPara(\'lembretes\')">';
      htmlLem += '<div class="dci-icon">🔔</div>';
      htmlLem += '<div class="dci-body"><div class="dci-texto">' + esc(l.texto) + '</div><div class="dci-meta">' + metaL + '</div></div>';
      htmlLem += '</div>';
    });
    if (lembretesAtivos.length > 4) htmlLem += '<div class="duc-mais" onclick="navegarPara(\'lembretes\')">+' + (lembretesAtivos.length - 4) + ' mais →</div>';
  } else {
    htmlLem = '<div class="dash-empty">Nenhum lembrete ativo 🔔 <button class="dash-empty-btn" onclick="dashQuickLembrete()">+ Lembrete</button></div>';
  }
  document.getElementById('dashLembretes').innerHTML = htmlLem;

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
  if (typeof abrirProvaModal === 'function') { abrirProvaModal(); return; }
  var txt = prompt('Nome da prova:');
  if (!txt || !txt.trim()) return;
  var mat = prompt('Matéria (opcional):') || '';
  var data = prompt('Data (AAAA-MM-DD):') || '';
  estado.estudos.provas.push({texto:txt.trim(), materia:mat.trim(), data:data.trim(), hora:'', conteudo:'', concluido:false, id:uid()});
  salvarEstado(); renderDashboard();
}

function dashQuickTrabalho() {
  if (typeof abrirTrabalhoModal === 'function') { abrirTrabalhoModal(); return; }
  var txt = prompt('Nome do trabalho:');
  if (!txt || !txt.trim()) return;
  var mat = prompt('Matéria (opcional):') || '';
  var data = prompt('Data (AAAA-MM-DD):') || '';
  estado.estudos.trabalhos.push({texto:txt.trim(), materia:mat.trim(), data:data.trim(), status:'pendente', descricao:'', hora:'', id:uid()});
  salvarEstado(); renderDashboard();
}

function dashQuickTarefa() {
  var txt = prompt('Nova tarefa (deixe a data para hoje):');
  if (!txt || !txt.trim()) return;
  estado.tarefas.push({texto:txt.trim(), prio:'media', feito:false, id:uid(), data:hojeStr(), hora:'', categoria:'', status:'pendente', descricao:'', obs:'', materia:'', lembrete: (estado.notifConfig ? estado.notifConfig.tarefas : 1)});
  salvarEstado();
  if (typeof showToast === 'function') showToast('Tarefa criada ✓');
  renderDashboard();
}

function dashQuickNota() {
  var titulo = prompt('Título da nota:');
  if (titulo === null) return;
  var texto = prompt('Conteúdo da nota:') || '';
  if (!titulo.trim() && !texto.trim()) return;
  var _agoraDQ = new Date().toISOString();
  estado.notas.push({id:uid(), titulo:titulo.trim(), texto:texto.trim(), categoria:'geral', prioridade:'media', tags:[], favorito:false, arquivada:false, criada:_agoraDQ, data:_agoraDQ, atualizada:_agoraDQ});
  salvarEstado();
  if (typeof showToast === 'function') showToast('Nota salva ✓');
  renderDashboard();
}

function dashQuickHabito() {
  var nome = prompt('Nome do novo hábito:');
  if (!nome || !nome.trim()) return;
  estado.habitos.push({nome:nome.trim(), emoji:'✨', id:uid(), semanas:{}});
  salvarEstado();
  if (typeof showToast === 'function') showToast('Hábito criado ✓');
  renderDashboard();
}

function dashQuickMeta() {
  if (typeof abrirMetaModal === 'function') { abrirMetaModal(); return; }
  var texto = prompt('Nova meta:');
  if (!texto || !texto.trim()) return;
  estado.metas.push({id:uid(), texto:texto.trim(), descricao:'', prazo:'', categoria:'pessoal', progresso:0, feito:false, criada:hojeStr(), concluidaData:'', xp:0});
  salvarEstado(); renderDashboard();
}

function dashQuickLembrete() {
  var texto = prompt('Novo lembrete:');
  if (!texto || !texto.trim()) return;
  var data = prompt('Data (AAAA-MM-DD, opcional):') || '';
  var hora = prompt('Hora (HH:MM, opcional):') || '';
  estado.lembretes.push({texto:texto.trim(), data:data.trim(), hora:hora.trim(), id:uid(), ativo:true});
  salvarEstado();
  if (typeof scheduleLembretes === 'function') scheduleLembretes();
  if (typeof showToast === 'function') showToast('Lembrete criado ✓');
  renderDashboard();
}

function dashQuickEvento() {
  if (typeof abrirCalEventoModal === 'function') { abrirCalEventoModal(); return; }
  navegarPara('calendario');
}

// Atualiza o Dashboard somente se a pagina Inicio estiver visivel.
// Usado apos operacoes de CRUD feitas por modais globais (evento, meta),
// para que o painel reflita as mudancas sem precisar navegar de novo.
function atualizarDashboardSeVisivel() {
  try {
    var pg = document.getElementById('page-inicio');
    if (pg && pg.classList.contains('ativo')) renderDashboard();
  } catch(_) {}
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
  // --- Novos campos (etiquetas, subtarefas, recorrencia) ---
  if (!Array.isArray(t.etiquetas)) t.etiquetas = [];
  // normaliza etiquetas: strings unicas, sem vazios
  t.etiquetas = t.etiquetas.map(function(x){ return String(x||'').trim(); })
    .filter(function(x, i, arr){ return x && arr.indexOf(x) === i; });
  if (!Array.isArray(t.subtarefas)) t.subtarefas = [];
  t.subtarefas = t.subtarefas.filter(function(s){ return s && typeof s === 'object'; })
    .map(function(s){
      if (!s.id) s.id = uid();
      if (s.texto === undefined) s.texto = String(s.nome || '');
      s.feito = !!s.feito;
      return s;
    });
  // recorrencia: null (nenhuma) ou {tipo, intervalo}
  if (t.recorrencia === undefined) t.recorrencia = null;
  if (t.recorrencia && (!t.recorrencia.tipo || t.recorrencia.tipo === 'nenhuma')) t.recorrencia = null;
  if (t.recorrencia && !t.recorrencia.intervalo) t.recorrencia.intervalo = 1;
  if (t.recorrenciaFim === undefined) t.recorrenciaFim = '';
  if (t.recorrencia && !t.recorrenciaOrigem) t.recorrenciaOrigem = t.id;
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
  var cls = 'toast-inner toast-inner--' + (type||'default');
  el.innerHTML = '<div class="' + cls + '">' + icon + esc(msg) + '</div>';
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
  } else if (u.tipo === 'lixeira') {
    // remove da lixeira e devolve para a lista de tarefas
    estado.tarefasLixeira = estado.tarefasLixeira.filter(function(x){ return x.id !== u.dados.id; });
    var d = JSON.parse(JSON.stringify(u.dados));
    delete d.excluidoEm;
    var pos2 = u.pos;
    if (pos2 < 0 || pos2 > estado.tarefas.length) pos2 = estado.tarefas.length;
    estado.tarefas.splice(pos2, 0, d);
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
  atualizarDashboardSeVisivel();
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
  tkSet('tarefaEtiquetas', '');
  tkSet('tarefaRecorrencia', 'nenhuma');
  tkSet('tarefaRecorrenciaAte', '');
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
    etiquetas: tkParseEtiquetas(tkVal('tarefaEtiquetas')),
    recorrencia: tkLerRecorrenciaForm('tarefaRecorrencia'),
    recorrenciaFim: tkVal('tarefaRecorrenciaAte') || '',
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
  // limpa tambem os campos novos
  tkSet('tarefaEtiquetas', '');
  var inp2 = document.getElementById('tarefaInput');
  if (inp2) inp2.focus();

  atualizarMateriasTarefa();
  renderTarefas();
  atualizarDashboardSeVisivel();
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
  var msgRec = '';
  if (t.feito) msgRec = tkGerarRecorrencia(t);
  salvarEstado();
  renderTarefas();
  atualizarDashboardSeVisivel();
  tkToast(t.feito ? ('Tarefa concluída 🎉' + msgRec) : 'Tarefa reaberta', true);
  if (t.feito) registrarUsoPlus();
}

// Gera a proxima ocorrencia de uma tarefa recorrente ao concluir.
// Retorna um sufixo de mensagem (ou string vazia). Seguro para
// mudancas de mes/ano/fuso: usa datas locais Y-M-D, sem UTC.
function tkGerarRecorrencia(t) {
  if (!t || !t.recorrencia || !t.data) return '';
  var tipo = t.recorrencia.tipo;
  var intervalo = t.recorrencia.intervalo || 1;
  var prox = proximaDataRecorrente(t.data, tipo, intervalo);
  if (!prox) return '';
  if (t.recorrenciaFim && prox > t.recorrenciaFim) return ''; // fim da serie
  var origem = t.recorrenciaOrigem || t.id;
  var jaExiste = estado.tarefas.some(function(x){
    return !x.feito && (x.recorrenciaOrigem === origem) && x.data === prox;
  });
  if (jaExiste) return '';
  var nova = JSON.parse(JSON.stringify(t));
  nova.id = uid();
  nova.feito = false;
  nova.status = 'pendente';
  nova.concluidoEm = '';
  nova.data = prox;
  nova.recorrenciaOrigem = origem;
  nova.criado = new Date().toISOString();
  // reinicia subtarefas (novas copias, nao concluidas)
  nova.subtarefas = (t.subtarefas || []).map(function(s){
    return { id: uid(), texto: s.texto, feito: false };
  });
  delete nova.excluidoEm;
  estado.tarefas.push(nova);
  return ' · 🔁 próxima ' + dataLocal(prox);
}

function mudarStatusTarefa(id, st) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (!t) return;
  tarefaUndo = {tipo:'editar', dados:JSON.parse(JSON.stringify(t))};
  t.status = st;
  t.feito = st === 'concluida';
  salvarEstado();
  renderTarefas();
  atualizarDashboardSeVisivel();
  tkToast('Status: ' + (tkStatusLabel[st] || st), true);
}

function delTarefa(id) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (!t) return;
  confirmar('Mover a tarefa "' + t.texto + '" para a lixeira?', function(){
    var pos = -1;
    estado.tarefas.forEach(function(x, i){ if (x.id === id) pos = i; });
    var copia = JSON.parse(JSON.stringify(t));
    copia.excluidoEm = new Date().toISOString();
    estado.tarefas = estado.tarefas.filter(function(x){return x.id!==id;});
    estado.tarefasLixeira.unshift(copia);
    salvarEstado();
    renderTarefas();
    atualizarDashboardSeVisivel();
    // Desfazer restaura da lixeira para a posicao original
    tarefaUndo = {tipo:'lixeira', dados:copia, pos:pos};
    tkToast('Tarefa movida para a lixeira', true);
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
  tkSet('edTarefaEtiquetas', (t.etiquetas || []).join(', '));
  tkSet('edTarefaRecorrencia', t.recorrencia ? t.recorrencia.tipo : 'nenhuma');
  tkSet('edTarefaRecorrenciaAte', t.recorrenciaFim || '');
  tkRenderSubtarefasEditor(id);
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
  t.etiquetas = tkParseEtiquetas(tkVal('edTarefaEtiquetas'));
  t.recorrencia = tkLerRecorrenciaForm('edTarefaRecorrencia');
  t.recorrenciaFim = tkVal('edTarefaRecorrenciaAte') || '';
  if (t.recorrencia && !t.recorrenciaOrigem) t.recorrenciaOrigem = t.id;
  tkNorm(t);
  salvarEstado();
  fecharEdicaoTarefa();
  atualizarMateriasTarefa();
  renderTarefas();
  atualizarDashboardSeVisivel();
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
  tkEnsureStyles();
  tkEnsureUI();
  migrarTarefas();
  atualizarMateriasTarefa();

  var pesquisa = tkVal('tarefaPesquisa') || '';
  var filtro = estado.filtroTarefas || 'todas';
  var ordem = estado.ordemTarefas || 'data';
  var hoje = hojeStr();
  var amanha = amanhaStr();
  var fimSem = fimSemanaStr();
  var arquivo = filtro === 'arquivadas';

  // contadores dos filtros (sempre sobre tarefas ativas)
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
  var elArq = document.getElementById('tkfN-arquivadas');
  if (elArq) elArq.textContent = estado.tarefasArquivadas.length;
  document.querySelectorAll('#tarefaFiltros .tk-chip').forEach(function(b){
    b.classList.toggle('ativo', b.getAttribute('data-f') === filtro);
  });
  var selO = document.getElementById('tarefaOrdem');
  if (selO && selO.value !== ordem) selO.value = ordem;
  var dirB = document.getElementById('tarefaOrdemDir');
  if (dirB) dirB.textContent = estado.ordemTarefasDesc ? '↓' : '↑';

  // fonte da lista: arquivo ou tarefas ativas
  var fonte = arquivo ? estado.tarefasArquivadas : estado.tarefas;
  var lista = arquivo ? fonte.slice() : fonte.filter(function(t){
    return tkPassaFiltro(t, filtro, hoje, amanha, fimSem);
  });

  // filtro por etiqueta
  if (estado.filtroEtiqueta) {
    lista = lista.filter(function(t){
      return (t.etiquetas || []).indexOf(estado.filtroEtiqueta) >= 0;
    });
  }

  if (pesquisa.trim()) {
    var q = pesquisa.toLowerCase();
    lista = lista.filter(function(t){
      var subTxt = (t.subtarefas || []).map(function(s){return s.texto;}).join(' ');
      var tagTxt = (t.etiquetas || []).join(' ');
      var alvo = [t.texto, t.descricao, t.materia, t.obs, t.categoria, tagTxt, subTxt].join(' ').toLowerCase();
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
  } else if (ordem === 'etiqueta') {
    cmp = function(a,b){
      var ta = (a.etiquetas && a.etiquetas.length) ? a.etiquetas.slice().sort()[0] : 'zzz';
      var tb = (b.etiquetas && b.etiquetas.length) ? b.etiquetas.slice().sort()[0] : 'zzz';
      return ta.localeCompare(tb, 'pt-BR');
    };
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
    if (arquivo) {
      resumo.textContent = estado.tarefasArquivadas.length + (estado.tarefasArquivadas.length === 1 ? ' tarefa arquivada' : ' tarefas arquivadas');
    } else {
      var totalAtivas = contas.pendentes;
      var txtR = lista.length + (lista.length === 1 ? ' tarefa' : ' tarefas') + ' nesta visão';
      if (estado.filtroEtiqueta) txtR += ' · #' + estado.filtroEtiqueta;
      if (contas.atrasadas > 0) txtR += ' · 🚨 ' + contas.atrasadas + ' atrasada' + (contas.atrasadas > 1 ? 's' : '');
      txtR += ' · ' + totalAtivas + ' pendente' + (totalAtivas === 1 ? '' : 's') + ' · ✅ ' + contas.concluidas + ' concluída' + (contas.concluidas === 1 ? '' : 's');
      resumo.textContent = txtR;
    }
  }

  var html = '';
  lista.forEach(function(t) {
    var catE = catEmojis[t.categoria] || '';
    var catC = catCores[t.categoria] || 'var(--txt2)';
    var prioC = t.prio === 'alta' ? 'prio-alta' : t.prio === 'baixa' ? 'prio-baixa' : '';
    var atrasada = eAtrasada(t);
    var aberta = !!tarefasAbertas[t.id];
    var subs = t.subtarefas || [];
    var subFeitas = subs.filter(function(s){return s.feito;}).length;
    var temSub = subs.length > 0;
    var temDetalhe = !!(t.descricao || t.obs || temSub);
    var classe = 'tarefa-item tk-item' + (t.feito ? ' feito' : '') + (atrasada ? ' atrasada' : '') + (prioC ? ' ' + prioC : '');
    html += '<li class="' + classe + '" data-busca-id="' + t.id + '">'; 
    html += '<div class="tk-row">';
    if (arquivo) {
      html += '<div class="tarefa-check" style="opacity:.5;cursor:default">🗃️</div>';
    } else {
      html += '<div class="tarefa-check" onclick="toggleTarefa(\'' + t.id + '\')" role="checkbox" aria-checked="' + (t.feito ? 'true' : 'false') + '" aria-label="' + (t.feito ? 'Desfazer conclusão' : 'Concluir tarefa') + '" tabindex="0">' + (t.feito ? '✅' : '⬜') + '</div>';
    }
    html += '<div class="tarefa-info">';
    html += '<div class="tarefa-texto">' + (catE ? '<span style="margin-right:.3rem">' + catE + '</span>' : '') + esc(t.texto);
    if (t.prio === 'alta' && !t.feito) html += ' <span class="tk-badge tk-badge-alta">Alta</span>';
    if (t.status === 'fazendo') html += ' <span class="tk-badge tk-badge-fazendo">Fazendo</span>';
    if (t.recorrencia) html += ' <span class="tk-badge tk-badge-rec" title="Tarefa recorrente">🔁 ' + tkRecLabelCurta(t.recorrencia) + '</span>';
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
    // etiquetas
    if ((t.etiquetas || []).length) {
      html += '<div class="tk-tags">';
      t.etiquetas.forEach(function(tag){
        html += '<span class="tk-tag" onclick="filtrarPorEtiqueta(\'' + esc(tag).replace(/\'/g,"\\'") + '\')">#' + esc(tag) + '</span>';
      });
      html += '</div>';
    }
    // barra de progresso das subtarefas
    if (temSub) {
      var pct = Math.round(subFeitas / subs.length * 100);
      html += '<div class="tk-sub-prog" title="' + subFeitas + ' de ' + subs.length + ' subtarefas">';
      html += '<div class="tk-sub-prog-bar"><span style="width:' + pct + '%"></span></div>';
      html += '<span class="tk-sub-prog-txt">' + subFeitas + '/' + subs.length + '</span>';
      html += '</div>';
    }
    if (temDetalhe) {
      html += '<button class="tk-toggle-det" onclick="toggleDetalheTarefa(\'' + t.id + '\')">' + (aberta ? '▲ Ocultar detalhes' : '▼ Ver detalhes' + (temSub ? ' (' + subs.length + ' subtarefa' + (subs.length>1?'s':'') + ')' : '')) + '</button>';
    }
    html += '</div>';
    html += '<div class="tk-acoes">';
    if (arquivo) {
      html += '<button class="tk-acao" onclick="desarquivarTarefa(\'' + t.id + '\')" title="Desarquivar">↩️</button>';
      html += '<button class="tk-acao tk-acao-del" onclick="lixeiraDoArquivo(\'' + t.id + '\')" title="Mover para lixeira">🗑️</button>';
    } else {
      html += '<button class="tk-acao" onclick="editarTarefa(\'' + t.id + '\')" title="Editar">✏️</button>';
      if (!t.feito) {
        var prox = t.status === 'fazendo' ? 'pendente' : 'fazendo';
        html += '<button class="tk-acao" onclick="mudarStatusTarefa(\'' + t.id + '\',\'' + prox + '\')" title="' + (prox === 'fazendo' ? 'Marcar como fazendo' : 'Voltar para pendente') + '">🔄</button>';
      }
      html += '<button class="tk-acao" onclick="arquivarTarefa(\'' + t.id + '\')" title="Arquivar">🗃️</button>';
      html += '<button class="tk-acao tk-acao-del" onclick="delTarefa(\'' + t.id + '\')" title="Mover para lixeira">🗑️</button>';
    }
    html += '</div>';
    html += '</div>';
    if (temDetalhe && aberta) {
      html += '<div class="tk-detalhe">';
      if (t.descricao) html += '<div class="tk-det-bloco"><span class="tk-det-lbl">📝 Descrição</span><p>' + esc(t.descricao).replace(/\n/g, '<br>') + '</p></div>';
      if (t.obs) html += '<div class="tk-det-bloco"><span class="tk-det-lbl">📌 Observações</span><p>' + esc(t.obs).replace(/\n/g, '<br>') + '</p></div>';
      // subtarefas (editáveis apenas fora do arquivo)
      html += '<div class="tk-det-bloco"><span class="tk-det-lbl">☑️ Subtarefas' + (temSub ? ' (' + subFeitas + '/' + subs.length + ')' : '') + '</span>';
      html += '<ul class="tk-sublist">';
      subs.forEach(function(s){
        html += '<li class="tk-subitem' + (s.feito ? ' feito' : '') + '">';
        if (arquivo) {
          html += '<span class="tk-sub-check" style="cursor:default;opacity:.6">' + (s.feito ? '✅' : '⬜') + '</span>';
          html += '<span class="tk-sub-txt">' + esc(s.texto) + '</span>';
        } else {
          html += '<span class="tk-sub-check" onclick="toggleSubtarefa(\'' + t.id + '\',\'' + s.id + '\')">' + (s.feito ? '✅' : '⬜') + '</span>';
          html += '<span class="tk-sub-txt">' + esc(s.texto) + '</span>';
          html += '<button class="tk-sub-del" onclick="delSubtarefa(\'' + t.id + '\',\'' + s.id + '\')" title="Remover subtarefa">✕</button>';
        }
        html += '</li>';
      });
      html += '</ul>';
      if (!arquivo) {
        html += '<div class="tk-sub-add">';
        html += '<input type="text" class="campo tk-sub-input" id="tkSubInput-' + t.id + '" placeholder="Nova subtarefa..." onkeydown="tkSubKey(event,\'' + t.id + '\')">';
        html += '<button class="btn btn-s" onclick="addSubtarefa(\'' + t.id + '\')">+ Adicionar</button>';
        html += '</div>';
      }
      html += '</div>';
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
      concluidas:'Você ainda não concluiu nenhuma tarefa.',
      arquivadas:'Nenhuma tarefa arquivada.'
    };
    var msgV;
    if (pesquisa.trim()) msgV = 'Nenhuma tarefa encontrada para "' + esc(pesquisa.trim()) + '"';
    else if (estado.filtroEtiqueta) msgV = 'Nenhuma tarefa com a etiqueta #' + esc(estado.filtroEtiqueta);
    else msgV = (vazio[filtro] || 'Nenhuma tarefa encontrada');
    html = '<div class="tk-vazio">' + msgV + '</div>';
  }
  listaEl.innerHTML = html;

  // barra de etiquetas + painel da lixeira
  tkRenderBarraEtiquetas();
  tkRenderLixeiraPainel();
}

function limparTarefas() {
  var antes = JSON.parse(JSON.stringify(estado.tarefas));
  var n = estado.tarefas.filter(function(t){return t.feito;}).length;
  if (!n) { tkToast('Nenhuma tarefa concluída para limpar'); return; }
  estado.tarefas = estado.tarefas.filter(function(t){return !t.feito;});
  salvarEstado(); renderTarefas(); atualizarDashboardSeVisivel();
  tarefaUndo = {tipo:'excluirVarias', dados:antes};
  tkToast(n + (n === 1 ? ' tarefa removida' : ' tarefas removidas'), true);
}

// ---- CALENDARIO ----
function renderCalendario() {
  if (estado.calMes === null || estado.calMes === undefined || estado.calAno === null || estado.calAno === undefined) {
    var d = new Date();
    estado.calMes = d.getMonth();
    estado.calAno = d.getFullYear();
  }
  calEnsureStyles();
  if (estado.calView === 'mes') renderCalMes();
  else if (estado.calView === 'semana') renderCalSemana();
  else if (estado.calView === 'dia') renderCalDia();
}

function setCalView(v, btn) {
  estado.calView = v;
  if (v === 'dia' && !estado.calDiaSel) estado.calDiaSel = hojeStr();
  document.querySelectorAll('.cal-view-toggle button').forEach(function(b){b.classList.remove('ativo');});
  if (btn) btn.classList.add('ativo');
  salvarEstado();
  renderCalendario();
}

function calNav(dir) {
  if (estado.calView === 'mes') {
    estado.calMes += dir;
    if (estado.calMes > 11) { estado.calMes = 0; estado.calAno++; }
    if (estado.calMes < 0) { estado.calMes = 11; estado.calAno--; }
  } else if (estado.calView === 'semana') {
    var ss = estado.calSemanaStart;
    if (ss instanceof Date) ss = calDataStr(ss);
    if (typeof ss === 'string' && ss.indexOf('T') >= 0) ss = ss.slice(0,10);
    if (!ss) ss = hojeStr();
    var d = calParseData(ss);
    d.setDate(d.getDate() + dir * 7);
    estado.calSemanaStart = calDataStr(d);
  } else if (estado.calView === 'dia') {
    if (!estado.calDiaSel) estado.calDiaSel = hojeStr();
    var dd = new Date(estado.calDiaSel + 'T12:00:00');
    dd.setDate(dd.getDate() + dir);
    estado.calDiaSel = dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
  }
  salvarEstado();
  renderCalendario();
}

function calHoje() {
  var d = new Date();
  estado.calMes = d.getMonth();
  estado.calAno = d.getFullYear();
  estado.calSemanaStart = hojeStr();
  estado.calDiaSel = hojeStr();
  salvarEstado();
  renderCalendario();
}

function getCalEvents(dateStr) {
  var evts = [];
  estado.tarefas.forEach(function(t) {
    if (t.data === dateStr) evts.push({id: t.id, texto: t.texto, cor: catCores[t.categoria] || '#6c5ce7', tipo: 'tarefa', hora: t.hora || '', materia: t.materia || '', origem: 'tarefa', dur: 0, feito: !!t.feito});
  });
  estado.lembretes.forEach(function(l) {
    if (l.data === dateStr) evts.push({id: l.id, texto: l.texto, cor: '#fdcb6e', tipo: 'lembrete', hora: l.hora || '', materia: '', origem: 'lembrete', dur: 0});
  });
  if (estado.estudos && estado.estudos.provas) {
    estado.estudos.provas.forEach(function(p) {
      if (p.data === dateStr) evts.push({id: p.id, texto: p.texto, cor: '#e17055', tipo: 'prova', hora: p.hora || '', materia: p.materia || '', origem: 'prova', dur: 0});
    });
  }
  if (estado.estudos && estado.estudos.trabalhos) {
    estado.estudos.trabalhos.forEach(function(tr) {
      if (tr.data === dateStr) evts.push({id: tr.id, texto: tr.texto, cor: '#0984e3', tipo: 'trabalho', hora: tr.hora || '', materia: tr.materia || '', origem: 'trabalho', dur: 0});
    });
  }
  (estado.metas || []).forEach(function(mt) {
    if (mt.prazo === dateStr && !mt.feito && !mt.pausada) {
      evts.push({id: mt.id, texto: '🎯 ' + mt.texto, cor: '#a29bfe', tipo: 'meta', hora: '', materia: '', origem: 'meta', dur: 0});
    }
  });
  (estado.calEventos || []).forEach(function(c) {
    if (calRecorreNoDia(c, dateStr)) {
      var rec = c.recorrencia && c.recorrencia !== 'nenhuma';
      evts.push({id: c.id, texto: c.titulo, cor: calTipoCor(c.tipo), tipo: c.tipo, hora: c.hora || '', materia: c.materia || '', origem: 'calEvento', dur: c.duracao || 0, recorrente: !!rec, descricao: c.descricao || '', baseData: c.data});
    }
  });
  // Ordena por hora (sem hora = dia todo, vem primeiro)
  evts.sort(function(a, b) {
    var ha = a.hora || '00:00';
    var hb = b.hora || '00:00';
    if (!a.hora && b.hora) return -1;
    if (a.hora && !b.hora) return 1;
    if (ha < hb) return -1;
    if (ha > hb) return 1;
    return 0;
  });
  return evts;
}

// ---- CALENDARIO: datas locais (tz-safe) e recorrencia ----
function calParseData(s) {
  var p = (s || '').split('-');
  if (p.length !== 3) return null;
  return new Date(parseInt(p[0],10), parseInt(p[1],10) - 1, parseInt(p[2],10));
}

function calDataStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function calDiffDias(baseStr, alvoStr) {
  var a = calParseData(baseStr), b = calParseData(alvoStr);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}

// Retorna o tipo/intervalo da recorrencia de um evento (aceita string antiga ou objeto)
function calRecInfo(ev) {
  var rec = ev.recorrencia;
  if (!rec || rec === 'nenhuma') return null;
  if (typeof rec === 'string') return {tipo: rec, intervalo: 1};
  if (typeof rec === 'object' && rec.tipo && rec.tipo !== 'nenhuma') return {tipo: rec.tipo, intervalo: rec.intervalo || 1};
  return null;
}

// Verifica se o evento (possivelmente recorrente) ocorre em dateStr (tz-safe, clamp mes/ano)
function calRecorreNoDia(ev, dateStr) {
  var base = ev.data;
  if (!base) return false;
  if (dateStr === base) return true;
  var info = calRecInfo(ev);
  if (!info) return false;
  if (dateStr < base) return false;
  if (ev.recorrenciaFim && dateStr > ev.recorrenciaFim) return false;
  var db = calParseData(base), dd = calParseData(dateStr);
  if (!db || !dd) return false;
  var iv = info.intervalo || 1;
  if (info.tipo === 'diaria') {
    var n = calDiffDias(base, dateStr);
    return n > 0 && n % iv === 0;
  }
  if (info.tipo === 'semanal') {
    var n2 = calDiffDias(base, dateStr);
    return n2 > 0 && n2 % (7 * iv) === 0;
  }
  if (info.tipo === 'mensal') {
    var mdiff = (dd.getFullYear() - db.getFullYear()) * 12 + (dd.getMonth() - db.getMonth());
    if (mdiff <= 0 || mdiff % iv !== 0) return false;
    var ultimo = new Date(dd.getFullYear(), dd.getMonth() + 1, 0).getDate();
    var diaEsperado = Math.min(db.getDate(), ultimo);
    return dd.getDate() === diaEsperado;
  }
  if (info.tipo === 'anual') {
    var ydiff = dd.getFullYear() - db.getFullYear();
    if (ydiff <= 0 || ydiff % iv !== 0) return false;
    // Caso especial 29/fev em ano nao bissexto -> 28/fev
    if (db.getMonth() === 1 && db.getDate() === 29) {
      var ultFev = new Date(dd.getFullYear(), 2, 0).getDate();
      return dd.getMonth() === 1 && dd.getDate() === Math.min(29, ultFev);
    }
    if (dd.getMonth() !== db.getMonth()) return false;
    var ult2 = new Date(dd.getFullYear(), dd.getMonth() + 1, 0).getDate();
    return dd.getDate() === Math.min(db.getDate(), ult2);
  }
  return false;
}

// Converte 'HH:MM' em minutos; retorna -1 se invalido
function calHoraMin(h) {
  if (!h || h.indexOf(':') < 0) return -1;
  var p = h.split(':');
  var mm = parseInt(p[0],10) * 60 + parseInt(p[1],10);
  return isNaN(mm) ? -1 : mm;
}

// Detecta conflitos de horario entre eventos com hora definida.
// Retorna objeto {id: true} para eventos em conflito.
function calDetectarConflitos(evts) {
  var comHora = evts.filter(function(e){ return calHoraMin(e.hora) >= 0; }).map(function(e){
    var ini = calHoraMin(e.hora);
    var dur = (e.dur && e.dur > 0) ? e.dur : 60; // assume 60min quando sem duracao
    return {id: e.id, ini: ini, fim: ini + dur, ref: e};
  });
  var conflitos = {};
  for (var i = 0; i < comHora.length; i++) {
    for (var j = i + 1; j < comHora.length; j++) {
      var a = comHora[i], b = comHora[j];
      if (a.ini < b.fim && b.ini < a.fim) {
        conflitos[a.id] = true;
        conflitos[b.id] = true;
      }
    }
  }
  return conflitos;
}

// Normaliza um evento do calendario garantindo os novos campos
function calNormEvento(c) {
  if (!c) return c;
  if (c.duracao === undefined) c.duracao = 0;
  if (c.recorrencia === undefined) c.recorrencia = 'nenhuma';
  if (typeof c.recorrencia === 'object' && (!c.recorrencia || !c.recorrencia.tipo)) c.recorrencia = 'nenhuma';
  if (c.recorrenciaFim === undefined) c.recorrenciaFim = '';
  return c;
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
    var conf = calDetectarConflitos(evts);
    var temConflito = Object.keys(conf).length > 0;
    var isHoje = dateStr === hoje;
    var cls = 'cal-dia' + (isHoje ? ' hoje' : '') + (evts.length ? ' has-events' : '');
    html += '<div class="' + cls + '" onclick="abrirCalDia(\'' + dateStr + '\')" >';
    html += '<div class="cal-dia-num">' + dia + (temConflito ? ' <span class="cal-conflito-dot" title="Conflito de horários">⚠</span>' : '') + '</div>';
    if (evts.length) {
      html += '<div class="cal-dia-eventos">';
      evts.slice(0,3).forEach(function(e){
        var icon = calTipoIcon(e.tipo);
        var recMark = e.recorrente ? '<span class="cal-rec-mini">🔁</span>' : '';
        html += '<div class="cal-evento" data-busca-id="' + e.id + '" style="background:' + e.cor + (e.feito ? ';opacity:.5' : '') + '" title="' + esc(e.texto) + (e.hora ? ' · ' + esc(e.hora) : '') + '">' + icon + recMark + '</div>';
      });
      if (evts.length > 3) html += '<div class="cal-evento-mais">+' + (evts.length-3) + '</div>';
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  document.getElementById('calCorpo').innerHTML = html;
  calEnsureUI();
  renderCalProximos();
}

function renderCalSemana() {
  // calSemanaStart guardado como 'YYYY-MM-DD' (tz-safe). Migra Date/ISO antigo.
  var startStr = estado.calSemanaStart;
  if (startStr instanceof Date) startStr = calDataStr(startStr);
  if (typeof startStr === 'string' && startStr.indexOf('T') >= 0) startStr = startStr.slice(0,10);
  if (!startStr) startStr = hojeStr();
  var start = calParseData(startStr);
  start.setDate(start.getDate() - start.getDay()); // volta ao domingo

  var diasSem = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var end = new Date(start); end.setDate(end.getDate()+6);
  document.getElementById('calTitulo').textContent = start.getDate() + ' ' + meses[start.getMonth()] + ' – ' + end.getDate() + ' ' + meses[end.getMonth()] + ' ' + end.getFullYear();

  var hoje = hojeStr();
  // Cabecalhos dos dias
  var dias = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(start); d.setDate(d.getDate()+i);
    var ds = calDataStr(d);
    dias.push({ds: ds, dow: d.getDay(), num: d.getDate(), evts: getCalEvents(ds), conf: null});
    dias[i].conf = calDetectarConflitos(dias[i].evts);
  }

  var html = '<div class="cal-semana-wrap">';
  // Faixa "dia todo" (eventos sem hora)
  html += '<div class="cal-sem-head">';
  html += '<div class="cal-sem-hcell cal-sem-hlabel">Hora</div>';
  dias.forEach(function(dd){
    var isH = dd.ds === hoje;
    html += '<div class="cal-sem-hcell' + (isH ? ' hoje' : '') + '" onclick="abrirCalDia(\'' + dd.ds + '\')">';
    html += '<span class="csh-nome">' + diasSem[dd.dow].slice(0,3) + '</span><span class="csh-num">' + dd.num + '</span></div>';
  });
  html += '</div>';

  // Linha de eventos sem hora (dia todo)
  var temAllDay = dias.some(function(dd){ return dd.evts.some(function(e){ return !e.hora; }); });
  if (temAllDay) {
    html += '<div class="cal-sem-allday">';
    html += '<div class="cal-sem-hora-lbl">dia todo</div>';
    dias.forEach(function(dd){
      html += '<div class="cal-sem-allday-cell' + (dd.ds === hoje ? ' hoje' : '') + '">';
      dd.evts.filter(function(e){ return !e.hora; }).forEach(function(e){
        html += '<div class="cal-sem-chip" style="border-left:3px solid ' + e.cor + (e.feito?';opacity:.55':'') + '" title="' + esc(e.texto) + '" onclick="abrirCalDia(\'' + dd.ds + '\')">' + calTipoIcon(e.tipo) + ' ' + esc(e.texto) + (e.recorrente?' 🔁':'') + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  }

  // Grade por horario
  var horas = [];
  var minH = 7, maxH = 22;
  // expande faixa para cobrir todos os eventos com hora
  dias.forEach(function(dd){ dd.evts.forEach(function(e){ var mm = calHoraMin(e.hora); if (mm >= 0){ var h = Math.floor(mm/60); if (h < minH) minH = h; if (h > maxH) maxH = h; } }); });
  html += '<div class="cal-sem-body">';
  for (var h = minH; h <= maxH; h++) {
    html += '<div class="cal-sem-row">';
    html += '<div class="cal-sem-hora-lbl">' + String(h).padStart(2,'0') + ':00</div>';
    dias.forEach(function(dd){
      var isH = dd.ds === hoje;
      html += '<div class="cal-sem-cell' + (isH ? ' hoje' : '') + '" onclick="abrirCalDia(\'' + dd.ds + '\')">';
      dd.evts.filter(function(e){ var mm = calHoraMin(e.hora); return mm >= 0 && Math.floor(mm/60) === h; }).forEach(function(e){
        var confCls = dd.conf[e.id] ? ' conflito' : '';
        html += '<div class="cal-sem-evt' + confCls + '" style="background:' + e.cor + (e.feito?';opacity:.55':'') + '" title="' + esc(e.hora + ' ' + e.texto) + '">' + esc(e.hora) + ' ' + esc(e.texto) + (dd.conf[e.id] ? ' ⚠' : '') + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>'; // body
  html += '</div>'; // wrap
  document.getElementById('calCorpo').innerHTML = html;
  calEnsureUI();
  renderCalProximos();
}

// ---- CALENDARIO: VISUALIZAÇÃO DIA ----
function abrirCalDia(dateStr) {
  estado.calDiaSel = dateStr;
  estado.calView = 'dia';
  document.querySelectorAll('.cal-view-toggle button').forEach(function(b){b.classList.remove('ativo');});
  var diaBtn = document.querySelector('.cal-view-toggle button[data-view="dia"]');
  if (diaBtn) diaBtn.classList.add('ativo');
  salvarEstado();
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
  var conf = calDetectarConflitos(evts);
  var numConf = Object.keys(conf).length;
  var isHoje = sel === hojeStr();
  var agoraMin = -1;
  if (isHoje) { var ag = new Date(); agoraMin = ag.getHours()*60 + ag.getMinutes(); }

  var comHora = evts.filter(function(e){ return calHoraMin(e.hora) >= 0; });
  var semHora = evts.filter(function(e){ return calHoraMin(e.hora) < 0; });

  var html = '<div class="cal-dia-view">';
  html += '<div class="cdv-header">';
  html += '<span class="cdv-date">' + d.getDate() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear() + '</span>';
  if (isHoje) html += '<span class="cdv-hoje-badge">Hoje</span>';
  html += '<button class="btn btn-p cdv-add-btn" onclick="abrirCalEventoModal()">＋ Adicionar evento</button>';
  html += '</div>';

  if (numConf > 0) {
    html += '<div class="cdv-conflito-banner">⚠️ ' + numConf + ' evento(s) com horários sobrepostos neste dia.</div>';
  }

  if (isHoje && comHora.length) {
    var prox = comHora.filter(function(e){ return calHoraMin(e.hora) >= agoraMin; }).slice(0,3);
    if (prox.length) {
      html += '<div class="cdv-proximos"><div class="cdv-proximos-tit">⏭️ Próximos horários</div>';
      prox.forEach(function(e){
        html += '<div class="cdv-proximo-item"><span class="cdv-proximo-hora">' + esc(e.hora) + '</span> ' + calTipoIcon(e.tipo) + ' ' + esc(e.texto) + '</div>';
      });
      html += '</div>';
    }
  }

  if (evts.length) {
    if (semHora.length) {
      html += '<div class="cdv-grupo-lbl">Dia todo</div>';
      html += '<div class="cdv-list">';
      semHora.forEach(function(e){ html += calDiaEvtHtml(e, conf); });
      html += '</div>';
    }
    if (comHora.length) {
      html += '<div class="cdv-grupo-lbl">Agenda</div>';
      html += '<div class="cdv-list">';
      comHora.forEach(function(e){ html += calDiaEvtHtml(e, conf); });
      html += '</div>';
    }
  } else {
    html += '<div class="cdv-empty">';
    html += '<div class="cdv-empty-icon">📭</div>';
    html += '<div class="cdv-empty-text">Nenhum evento neste dia</div>';
    html += '<button class="btn btn-p" onclick="abrirCalEventoModal()">＋ Adicionar evento</button>';
    html += '</div>';
  }

  html += '</div>';
  document.getElementById('calCorpo').innerHTML = html;
  calEnsureUI();
  renderCalProximos();
}

function calDiaEvtHtml(e, conf) {
  var icon = calTipoIcon(e.tipo);
  var emConflito = conf && conf[e.id];
  var horaStr = e.hora ? '<span class="cdv-evt-hora">' + esc(e.hora) + '</span>' : '';
  var durStr = '';
  if (e.origem === 'calEvento' && e.dur > 0 && calHoraMin(e.hora) >= 0) {
    var fimMin = calHoraMin(e.hora) + e.dur;
    var fh = String(Math.floor(fimMin/60) % 24).padStart(2,'0') + ':' + String(fimMin % 60).padStart(2,'0');
    durStr = '<span class="cdv-evt-dur">→ ' + fh + ' (' + e.dur + 'min)</span>';
  }
  var matStr = e.materia ? '<span class="cdv-evt-mat">' + esc(e.materia) + '</span>' : '';
  var recStr = e.recorrente ? '<span class="cdv-evt-rec">🔁 recorrente</span>' : '';
  var isCalEvt = e.origem === 'calEvento';
  var html = '<div class="cdv-evt' + (emConflito ? ' conflito' : '') + (e.feito ? ' feito' : '') + '" style="border-left:4px solid ' + e.cor + '">';
  html += '<div class="cdv-evt-top">';
  html += '<span class="cdv-evt-icon">' + icon + '</span>';
  html += '<span class="cdv-evt-tipo">' + esc(e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)) + '</span>';
  html += horaStr + durStr + matStr + recStr;
  if (emConflito) html += '<span class="cdv-evt-conflito">⚠ conflito</span>';
  html += '</div>';
  html += '<div class="cdv-evt-titulo">' + esc(e.texto) + '</div>';
  if (isCalEvt) {
    if (e.descricao) html += '<div class="cdv-evt-desc">' + esc(e.descricao) + '</div>';
    html += '<div class="cdv-evt-acoes">';
    html += '<button class="btn btn-s cdv-evt-edit" onclick="abrirCalEventoModal(\'' + e.id + '\')">✏️ Editar</button>';
    html += '<button class="btn btn-d cdv-evt-del" onclick="delCalEvento(\'' + e.id + '\')">🗑️ Excluir</button>';
    html += '</div>';
  } else {
    var alvo = e.origem === 'tarefa' ? 'tarefas' : (e.origem === 'lembrete' ? 'lembretes' : 'estudos');
    var rotulo = e.origem === 'tarefa' ? 'Tarefa' : e.origem === 'lembrete' ? 'Lembrete' : e.origem === 'prova' ? 'Prova' : 'Trabalho';
    html += '<div class="cdv-evt-origem">' + rotulo + ' · <a href="javascript:void(0)" onclick="navegarPara(\'' + alvo + '\')">abrir</a></div>';
  }
  html += '</div>';
  return html;
}

// ---- CALENDARIO: CRUD EVENTOS ----
var calEventoEditId = null;

function abrirCalEventoModal(editId) {
  calEventoEditId = editId || null;
  var modal = document.getElementById('calEventModal');
  if (!modal) return;
  calEnsureUI();
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
  var setV = function(id, v){ var el = document.getElementById(id); if (el) el.value = v; };
  if (calEventoEditId) {
    var ce = estado.calEventos.find(function(c){ return c.id === calEventoEditId; });
    if (ce) {
      calNormEvento(ce);
      setV('calEvtTitulo', ce.titulo || '');
      setV('calEvtData', ce.data || estado.calDiaSel || hojeStr());
      setV('calEvtHora', ce.hora || '');
      setV('calEvtMateria', ce.materia || '');
      setV('calEvtTipo', ce.tipo || 'evento');
      setV('calEvtDesc', ce.descricao || '');
      setV('calEvtLembrete', ce.lembrete !== undefined ? String(ce.lembrete) : String(estado.notifConfig.eventos));
      setV('calEvtDuracao', ce.duracao ? String(ce.duracao) : '');
      var recInfo = calRecInfo(ce);
      setV('calEvtRecorrencia', recInfo ? recInfo.tipo : 'nenhuma');
      setV('calEvtRecorrenciaAte', ce.recorrenciaFim || '');
      document.getElementById('calEvtModalTitle').textContent = '✏️ Editar evento';
    }
  } else {
    setV('calEvtTitulo', '');
    setV('calEvtData', estado.calDiaSel || hojeStr());
    setV('calEvtHora', '');
    setV('calEvtMateria', '');
    setV('calEvtTipo', 'evento');
    setV('calEvtDesc', '');
    setV('calEvtLembrete', String(estado.notifConfig.eventos));
    setV('calEvtDuracao', '');
    setV('calEvtRecorrencia', 'nenhuma');
    setV('calEvtRecorrenciaAte', '');
    document.getElementById('calEvtModalTitle').textContent = '＋ Novo evento';
  }
  calToggleRecAte();
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
  var durEl = document.getElementById('calEvtDuracao');
  var duracao = durEl && durEl.value ? Math.max(0, parseInt(durEl.value, 10) || 0) : 0;
  var recEl = document.getElementById('calEvtRecorrencia');
  var recorrencia = recEl ? recEl.value : 'nenhuma';
  if (!recorrencia) recorrencia = 'nenhuma';
  var recAteEl = document.getElementById('calEvtRecorrenciaAte');
  var recorrenciaFim = (recorrencia !== 'nenhuma' && recAteEl) ? (recAteEl.value || '') : '';
  if (!titulo) {
    var tEl = document.getElementById('calEvtTitulo');
    if (tEl) { tEl.classList.add('tk-erro'); tEl.focus(); setTimeout(function(){ tEl.classList.remove('tk-erro'); }, 1200); }
    return;
  }
  if (!data) data = estado.calDiaSel || hojeStr();
  // Aviso de conflito (nao bloqueia)
  var msgConf = calAvisoConflito(data, hora, duracao, calEventoEditId);
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
      ce.duracao = duracao;
      ce.recorrencia = recorrencia;
      ce.recorrenciaFim = recorrenciaFim;
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
      lembrete: lembrete,
      duracao: duracao,
      recorrencia: recorrencia,
      recorrenciaFim: recorrenciaFim
    });
  }
  salvarEstado();
  fecharCalEventoModal();
  renderCalendario();
  atualizarDashboardSeVisivel();
  if (typeof tkToast === 'function') tkToast(msgConf ? ('Evento salvo · ' + msgConf) : 'Evento salvo ✓');
}

// Retorna mensagem de aviso se houver conflito de horario no mesmo dia
function calAvisoConflito(data, hora, duracao, ignoraId) {
  if (calHoraMin(hora) < 0) return '';
  var evts = getCalEvents(data).filter(function(e){ return e.id !== ignoraId; });
  var ini = calHoraMin(hora);
  var fim = ini + (duracao > 0 ? duracao : 60);
  var conflita = evts.some(function(e){
    var ei = calHoraMin(e.hora);
    if (ei < 0) return false;
    var ef = ei + (e.dur > 0 ? e.dur : 60);
    return ini < ef && ei < fim;
  });
  return conflita ? '⚠️ possível conflito de horário' : '';
}

function delCalEvento(id) {
  var ce = (estado.calEventos || []).find(function(c){ return c.id === id; });
  var recorrente = ce && calRecInfo(ce);
  var msg = recorrente ? 'Excluir este evento recorrente e toda a série?' : 'Excluir este evento do calendário?';
  showConfirm(msg, function() {
    estado.calEventos = estado.calEventos.filter(function(c){ return c.id !== id; });
    salvarEstado();
    renderCalendario();
    atualizarDashboardSeVisivel();
    if (typeof tkToast === 'function') tkToast('Evento excluído');
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
      th = '<div class="txt3-small">Nenhuma tarefa nesta matéria.</div>';
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
      pvh = '<div class="txt3-small">Nenhuma prova nesta matéria.</div>';
    } else {
      provas.forEach(function(p) {
        pvh += '<div class="pv-card" style="border-left:4px solid #e17055">';
        pvh += '<div class="duce-nome">' + esc(p.texto) + '</div>';
        pvh += '<div class="duce-info">📅 ' + dataLocal(p.data) + (p.hora ? ' ' + p.hora : '') + '</div>';
        if (p.conteudo) pvh += '<div class="duce-info">📋 ' + esc(p.conteudo) + '</div>';
        pvh += '<div class="duce-botoes"><button class="btn btn-s btn-p-sm" onclick="abrirProvaModal(\'' + p.id + '\')">✏️</button>';
        pvh += '<button class="btn btn-d btn-p-sm" onclick="delProva(\'' + p.id + '\')">🗑️</button></div>';
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
      trh = '<div class="txt3-small">Nenhum trabalho nesta matéria.</div>';
    } else {
      trabs.forEach(function(t) {
        var statusIcon = t.status === 'concluido' ? '✅' : t.status === 'fazendo' ? '🔄' : '⏳';
        trh += '<div class="pv-card" style="border-left:4px solid #0984e3">';
        trh += '<div class="duce-nome">' + statusIcon + ' ' + esc(t.texto) + '</div>';
        trh += '<div class="duce-info">📅 ' + dataLocal(t.data) + (t.hora ? ' ' + t.hora : '') + ' · ' + (t.status === 'concluido' ? 'Concluído' : t.status === 'fazendo' ? 'Fazendo' : 'Pendente') + '</div>';
        if (t.descricao) trh += '<div class="duce-info">📋 ' + esc(t.descricao) + '</div>';
        trh += '<div class="duce-botoes"><button class="btn btn-s btn-p-sm" onclick="abrirTrabalhoModal(\'' + t.id + '\')">✏️</button>';
        trh += '<button class="btn btn-d btn-p-sm" onclick="delTrabalho(\'' + t.id + '\')">🗑️</button></div>';
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
    h = '<div class="txt3-small">Nenhuma anotação. Clique em ＋ Adicionar.</div>';
  } else {
    anotacoes.forEach(function(a, i) {
      h += '<div class="anot-card">';
      h += '<div class="anot-titulo">📌 ' + esc(a.titulo) + '</div>';
      if (a.conteudo) h += '<div class="anot-conteudo">' + esc(a.conteudo).replace(/\n/g, '<br>') + '</div>';
      h += '<div class="anot-data">' + (a.editada ? '✏️ ' + esc(a.editada) : '📅 ' + esc(a.data || '')) + '</div>';
      h += '<div class="anot-botoes">';
      h += '<button class="btn btn-s btn-p-sm" onclick="editarAnotacao(' + i + ')">✏️</button>';
      h += '<button class="btn btn-d btn-p-sm" onclick="delAnotacao(' + i + ')">🗑️</button>';
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
  esEnsurePrioridadeCampos();
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
      var _prvP = document.getElementById('prvPrioridade'); if (_prvP) _prvP.value = p.prioridade || 'media';
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
  var _prvPN = document.getElementById('prvPrioridade'); if (_prvPN) _prvPN.value = 'media';
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
  var _prvPrio = document.getElementById('prvPrioridade');
  var prioridade = _prvPrio ? _prvPrio.value : 'media';
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
      p.prioridade = prioridade;
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
      prioridade: prioridade,
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
  estado.estudos.provas.sort(function(a,b){
    var pr = (esPrioRank[a.prioridade||'media']) - (esPrioRank[b.prioridade||'media']);
    if (pr !== 0) return pr;
    return (a.data||'z').localeCompare(b.data||'z');
  });
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
    html += esPrioBadge(p.prioridade);
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
  esEnsurePrioridadeCampos();
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
      var _trbP = document.getElementById('trbPrioridade'); if (_trbP) _trbP.value = tr.prioridade || 'media';
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
  var _trbPN = document.getElementById('trbPrioridade'); if (_trbPN) _trbPN.value = 'media';
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
  var _trbPrio = document.getElementById('trbPrioridade');
  var prioridade = _trbPrio ? _trbPrio.value : 'media';
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
      tr.prioridade = prioridade;
    }
  } else {
    estado.estudos.trabalhos.push({
      id: uid(),
      texto: titulo,
      materia: materia,
      data: prazo,
      descricao: descricao,
      status: status,
      lembrete: lembrete,
      prioridade: prioridade
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
  estado.estudos.trabalhos.sort(function(a,b){
    var pr = (esPrioRank[a.prioridade||'media']) - (esPrioRank[b.prioridade||'media']);
    if (pr !== 0) return pr;
    return (a.data||'z').localeCompare(b.data||'z');
  });
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
    html += esPrioBadge(tr.prioridade);
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
  atualizarDashboardSeVisivel();
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
  calcularStreakMetas();
  salvarEstado();
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
  if (!html) html = '<div class="txt3-small">Nenhuma nota salva.</div>';
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
  salvarEstado(); renderLembretes(); scheduleLembretes(); atualizarDashboardSeVisivel();
}

function toggleLembrete(id) {
  var l = estado.lembretes.find(function(x){return x.id===id;});
  if (l) { l.ativo = !l.ativo; salvarEstado(); renderLembretes(); scheduleLembretes(); atualizarDashboardSeVisivel(); }
}

function delLembrete(id) {
  estado.lembretes = estado.lembretes.filter(function(x){return x.id!==id;});
  salvarEstado(); renderLembretes(); scheduleLembretes(); atualizarDashboardSeVisivel();
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
  if (!html) html = '<div class="txt3-small">Nenhum lembrete.</div>';
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
  if (!html) html = '<div class="txt3-small">Adicione pelo menos 2 opções.</div>';
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
  if (!html) html = '<div class="txt3-small">Nenhum exercício registrado hoje.</div>';
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
  document.getElementById('humorHistorico').innerHTML = hhtml || '<div class="txt3-small">Sem histórico.</div>';
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
  if (!html) html = '<div class="txt3-small">Comece registrando algo pelo qual é grato.</div>';
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
  if (!html) html = '<div class="txt3-small">Nenhuma despesa este mês.</div>';
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
  if (!html) html = '<div class="txt3-small">Lista vazia.</div>';
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
  if (!html) html = '<div class="txt3-small">Nenhum planejamento.</div>';
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
  if (!html) html = '<div class="txt3-small">Nenhuma contagem regressiva.</div>';
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
  if (!html) html = '<div class="txt3-small">Nenhuma senha salva. ⚠️ Use com cautela — dados ficam no navegador.</div>';
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
  if (!html) html = '<div class="txt3-small">Nenhum livro ' + (filtro==='todos'?'':'com filtro "'+filtro+'"') + ' na lista.</div>';
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
  if (!html) html = '<div class="txt3-small">Nenhuma revisão. Adicione um tema para revisar!</div>';
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
  var vidaPainel = document.getElementById('vidaPainel');
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
function showConfirm(msg, onOk) { confirmar(msg, onOk); }
function closeConfirm() { fecharModal(); }

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
  if (!isUsuarioPlus()) {
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
    case 'meudia': renderMeuDia(); break;
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

// ---- MEU DIA ----

function renderMeuDia() {
  var hoje = hojeStr();
  var el = document.getElementById('meudiaConteudo');
  if (!el) return;

  // === Saudação ===
  var h = new Date().getHours();
  var greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  var nome = estado.perfil && estado.perfil.nome ? estado.perfil.nome : '';
  var grel = document.getElementById('meudiaGreeting');
  if (grel) grel.textContent = greet + (nome ? ', ' + nome : '') + '! ☀️';

  // === Data ===
  var dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var d = new Date();
  var dateEl = document.getElementById('meudiaDate');
  if (dateEl) dateEl.textContent = dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()];

  // === Coletar todos os itens do dia ===
  var itens = [];

  // Tarefas de hoje + atrasadas
  estado.tarefas.forEach(function(t) {
    if (t.feito) return;
    var ehHoje = t.data === hoje;
    var ehAtrasada = eAtrasada(t);
    if (!ehHoje && !ehAtrasada) return;
    var nivel = ehAtrasada ? 'urgente' : (t.prio === 'alta' ? 'urgente' : t.prio === 'media' ? 'importante' : 'depois');
    itens.push({
      id: t.id, tipo: 'tarefa', texto: t.texto, hora: t.hora || '',
      materia: t.materia || '', categoria: t.categoria || '',
      prio: t.prio || 'media', nivel: nivel, atrasada: ehAtrasada,
      feito: t.feito, acao: "dashToggleTarefa('" + t.id + "')"
    });
  });

  // Provas de hoje ou até 3 dias
  if (estado.estudos && estado.estudos.provas) {
    estado.estudos.provas.forEach(function(p) {
      if (p.concluido) return;
      if (!p.data) return;
      var diasRest = Math.ceil((new Date(p.data + 'T12:00:00') - new Date()) / 86400000);
      if (diasRest > 3) return;
      var nivel = diasRest <= 0 ? 'urgente' : diasRest <= 2 ? 'importante' : 'depois';
      itens.push({
        id: p.id, tipo: 'prova', texto: p.texto, hora: p.hora || '',
        materia: p.materia || '', categoria: '', prio: nivel === 'urgente' ? 'alta' : 'media',
        nivel: nivel, atrasada: diasRest <= 0,
        feito: false, acao: "navegarPara('estudos')"
      });
    });
  }

  // Trabalhos de hoje ou até 3 dias
  if (estado.estudos && estado.estudos.trabalhos) {
    estado.estudos.trabalhos.forEach(function(tr) {
      if (tr.status === 'concluido') return;
      if (!tr.data) return;
      var diasRest = Math.ceil((new Date(tr.data + 'T12:00:00') - new Date()) / 86400000);
      if (diasRest > 3) return;
      var nivel = diasRest <= 0 ? 'urgente' : diasRest <= 2 ? 'importante' : 'depois';
      itens.push({
        id: tr.id, tipo: 'trabalho', texto: tr.texto, hora: '',
        materia: tr.materia || '', categoria: '', prio: nivel === 'urgente' ? 'alta' : 'media',
        nivel: nivel, atrasada: diasRest <= 0,
        feito: false, acao: "navegarPara('estudos')",
        status: tr.status
      });
    });
  }

  // Eventos de hoje
  estado.calEventos.forEach(function(ev) {
    if (ev.data !== hoje) return;
    itens.push({
      id: ev.id, tipo: 'evento', texto: ev.titulo, hora: ev.hora || '',
      materia: ev.materia || '', categoria: '', prio: 'media',
      nivel: 'importante', atrasada: false,
      feito: false, acao: "navegarPara('calendario')"
    });
  });

  // Lembretes de hoje
  estado.lembretes.forEach(function(l) {
    if (!l.ativo) return;
    if (l.data !== hoje) return;
    itens.push({
      id: l.id, tipo: 'lembrete', texto: l.texto, hora: l.hora || '',
      materia: '', categoria: '', prio: 'media',
      nivel: 'importante', atrasada: false,
      feito: false, acao: "navegarPara('lembretes')"
    });
  });

  // Hábitos pendentes de hoje
  var diaIdx = getDiaSemana();
  var sk = getSemanaKey();
  estado.habitos.forEach(function(h) {
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    if (arr[diaIdx]) return;
    itens.push({
      id: h.id, tipo: 'habito', texto: h.nome, hora: '',
      materia: '', categoria: '', prio: 'baixa',
      nivel: 'depois', atrasada: false,
      feito: false, acao: "toggleHabitoDash('" + h.id + "')",
      emoji: h.emoji || '✨'
    });
  });

  // === Contagem para progresso ===
  var totalHoje = itens.length;
  var totalGeral = estado.tarefas.filter(function(t){return t.data === hoje}).length;
  var feitasHoje = estado.tarefas.filter(function(t){return t.feito && t.data === hoje}).length;
  var habitosFeitos = estado.habitos.filter(function(h){
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    return arr[diaIdx];
  }).length;
  var completos = feitasHoje + habitosFeitos;
  var totalTudo = totalGeral + estado.habitos.length;
  var pct = totalTudo > 0 ? Math.round(completos / totalTudo * 100) : 0;

  // === Ordenar itens por prioridade ===
  var ordemNivel = {urgente:0, importante:1, depois:2};
  itens.sort(function(a,b){
    var diff = ordemNivel[a.nivel] - ordemNivel[b.nivel];
    if (diff !== 0) return diff;
    if (a.atrasada && !b.atrasada) return -1;
    if (!a.atrasada && b.atrasada) return 1;
    var diffP = prioridadeValor(b.prio) - prioridadeValor(a.prio);
    if (diffP !== 0) return diffP;
    if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
    if (a.hora && !b.hora) return -1;
    if (!a.hora && b.hora) return 1;
    return 0;
  });

  // === Agrupar por nível ===
  var urgente = itens.filter(function(i){return i.nivel === 'urgente'});
  var importante = itens.filter(function(i){return i.nivel === 'importante'});
  var depois = itens.filter(function(i){return i.nivel === 'depois'});

  // === Construir HTML ===
  var html = '';

  // --- Progresso do dia ---
  html += '<div class="meudia-progresso">';
  html += '<div class="meudia-prog-header">';
  html += '<div class="meudia-prog-label">Progresso do dia</div>';
  html += '<div class="meudia-prog-count">' + completos + '/' + totalTudo + '</div>';
  html += '</div>';
  html += '<div class="meudia-prog-bar"><div class="meudia-prog-fill" style="width:' + pct + '%"></div></div>';
  html += '<div class="meudia-prog-pct">' + pct + '% concluído</div>';
  html += '</div>';

  // --- Seções de prioridade ---
  var tipoIcons = {tarefa:'✅', prova:'📝', trabalho:'📄', evento:'🔔', lembrete:'⏰', habito:'🔥'};
  var tipoLabels = {tarefa:'Tarefa', prova:'Prova', trabalho:'Trabalho', evento:'Evento', lembrete:'Lembrete', habito:'Hábito'};

  function renderGrupo(arr, emoji, titulo, corClasse) {
    var h2 = '';
    if (arr.length === 0) {
      h2 += '<div class="meudia-secao ' + corClasse + '">';
      h2 += '<div class="meudia-sec-header"><span class="meudia-sec-badge">' + emoji + '</span><span class="meudia-sec-titulo">' + titulo + '</span><span class="meudia-sec-count meudia-sec-count-zero">0</span></div>';
      h2 += '<div class="meudia-sec-empty">Nada por aqui 🎉</div>';
      h2 += '</div>';
      return h2;
    }
    h2 += '<div class="meudia-secao ' + corClasse + '">';
    h2 += '<div class="meudia-sec-header"><span class="meudia-sec-badge">' + emoji + '</span><span class="meudia-sec-titulo">' + titulo + '</span><span class="meudia-sec-count">' + arr.length + '</span></div>';
    h2 += '<div class="meudia-sec-list">';
    arr.forEach(function(item) {
      var icon = item.tipo === 'habito' ? (item.emoji || '✨') : (tipoIcons[item.tipo] || '📌');
      var catE = item.categoria ? (catEmojis[item.categoria] || '') + ' ' : '';
      var matE = item.materia ? '<span class="meudia-item-mat">(' + esc(item.materia) + ')</span> ' : '';
      var atrasadaTag = item.atrasada ? '<span class="meudia-item-atrasada">atrasada</span>' : '';
      var statusTag = item.status ? '<span class="meudia-item-status">' + (statusTrabIcons[item.status]||'') + ' ' + esc(item.status) + '</span>' : '';
      h2 += '<div class="meudia-item ' + corClasse + '">';
      h2 += '<div class="meudia-item-icon">' + icon + '</div>';
      h2 += '<div class="meudia-item-body">';
      h2 += '<div class="meudia-item-top">' + catE + esc(item.texto) + ' ' + matE + atrasadaTag + statusTag + '</div>';
      if (item.hora) h2 += '<div class="meudia-item-hora">🕐 ' + esc(item.hora) + '</div>';
      h2 += '</div>';
      h2 += '<button class="meudia-item-go" onclick="' + item.acao + '" title="Ver">→</button>';
      h2 += '</div>';
    });
    h2 += '</div>';
    h2 += '</div>';
    return h2;
  }

  html += renderGrupo(urgente, '🔴', 'Urgente', 'meudia-urg');
  html += renderGrupo(importante, '🟡', 'Importante', 'meudia-imp');
  html += renderGrupo(depois, '🟢', 'Depois', 'meudia-dep');

  // --- Por onde começar? ---
  if (itens.length > 0) {
    html += '<div class="meudia-sugestao">';
    html += '<div class="meudia-sug-titulo">💡 Por onde começar?</div>';
    html += '<div class="meudia-sug-list">';
    var sugestoes = itens.slice(0, 5);
    sugestoes.forEach(function(item, idx) {
      var num = idx + 1;
      var icon = item.tipo === 'habito' ? (item.emoji || '✨') : (tipoIcons[item.tipo] || '📌');
      var motivo = '';
      if (item.atrasada) motivo = 'Já passou do prazo';
      else if (item.nivel === 'urgente') motivo = 'Alta prioridade';
      else if (item.nivel === 'importante') motivo = 'Importante para hoje';
      else motivo = 'Pode ficar para depois';
      if (item.tipo === 'prova' && !item.atrasada) motivo = 'Prova se aproximando, revise!';
      if (item.tipo === 'trabalho' && !item.atrasada) motivo = 'Entrega se aproximando';
      html += '<div class="meudia-sug-item">';
      html += '<div class="meudia-sug-num">' + num + '</div>';
      html += '<div class="meudia-sug-body">';
      html += '<div class="meudia-sug-texto">' + icon + ' ' + esc(item.texto) + '</div>';
      html += '<div class="meudia-sug-motivo">' + motivo + '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // --- Seção de hábitos de hoje (se houver) ---
  var habitosFeitos2 = estado.habitos.filter(function(h){
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    return arr[diaIdx];
  });
  if (estado.habitos.length > 0) {
    html += '<div class="meudia-habitos">';
    html += '<div class="meudia-hab-header">🔥 Hábitos de Hoje <span class="meudia-hab-count">' + habitosFeitos2.length + '/' + estado.habitos.length + '</span></div>';
    html += '<div class="meudia-hab-list">';
    estado.habitos.forEach(function(h) {
      var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
      var feito = arr[diaIdx];
      html += '<div class="meudia-hab-item ' + (feito ? 'feito' : '') + '" onclick="toggleHabitoDash(\'' + h.id + '\')">';
      html += '<div class="meudia-hab-check">' + (feito ? '✅' : '⬜') + '</div>';
      html += '<div class="meudia-hab-nome">' + (h.emoji||'✨') + ' ' + esc(h.nome) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // --- Botão OrganizaIA ---
  html += '<div class="meudia-oia-wrap">';
  html += '<button class="meudia-oia-btn" onclick="abrirOrganizaIA();setTimeout(function(){oiaEnviarSugestao(\'Organizar meu dia\')},300)">🧠 Organizar meu dia com IA</button>';
  html += '</div>';

  // --- Dia vazio ---
  if (itens.length === 0 && estado.habitos.length === 0) {
    html += '<div class="meudia-empty">';
    html += '<div class="meudia-empty-icon">☀️</div>';
    html += '<div class="meudia-empty-text">Seu dia está livre! Adicione tarefas, provas ou hábitos para começar.</div>';
    html += '<div class="meudia-empty-actions">';
    html += '<button class="meudia-empty-btn" onclick="navegarPara(\'tarefas\')">✅ Nova Tarefa</button>';
    html += '<button class="meudia-empty-btn" onclick="navegarPara(\'estudos\')">📝 Nova Prova</button>';
    html += '<button class="meudia-empty-btn" onclick="navegarPara(\'habitos\')">🔥 Novo Hábito</button>';
    html += '</div>';
    html += '</div>';
  }

  el.innerHTML = html;
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

  // Verifica se o armazenamento local esta funcionando (modo privado, etc.)
  if (!storageDisponivel()) { _avisarStorageIndisponivel(); }

  // Rede de seguranca: salva ao fechar/minimizar a aba.
  // 'visibilitychange' (hidden) e o mais confiavel no celular;
  // 'pagehide' cobre o fechamento/refresh.
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') { salvarEstado(); }
  });
  window.addEventListener('pagehide', function() { salvarEstado(); });
  window.addEventListener('beforeunload', function() { salvarEstado(); });

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

  // Keyboard support for role="checkbox"
  document.addEventListener('keydown', function(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'checkbox') {
      e.preventDefault();
      e.target.click();
    }
  });

  // Apoie banner
  if (localStorage.getItem('apoieBannerFechado')) {
    var ab = document.getElementById('apoieBanner');
    if (ab) ab.style.display = 'none';
  }

  // Register service worker if available
  if ('serviceWorker' in navigator) {
    // Caminho RELATIVO: funciona tanto na raiz quanto em subpastas
    // (ex.: GitHub Pages em https://usuario.github.io/repo/).
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }

  // Update regressivas every minute
  setInterval(function() {
    if (estado.paginaAtual === 'regressiva') renderRegressivas();
  }, 60000);

  // Banner de apoio: mostra apos 30s nas primeiras visitas.
  // NOTA: a contagem de visitas (oj_visits) e feita uma unica vez em
  // carregarEstado(). Aqui apenas LEMOS o valor ja incrementado — antes
  // este bloco re-incrementava oj_visits (contagem dobrada por load) e
  // reutilizava oj_visits_d, que carregarEstado() guarda como DATA, entao
  // parseInt(data) < 3 nunca era verdadeiro e o banner nunca aparecia.
  try {
    var totalVisitas = parseInt(localStorage.getItem('oj_visits') || '0');
    if (totalVisitas <= 3 && !localStorage.getItem('apoieBannerFechado')) {
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
    var diasSemana = semanas[semanaAtual] || [false,false,false,false,false,false,false];
    var feitos = 0; var total = 7;
    for (var d = 0; d < diasSemana.length; d++) { if (diasSemana[d]) feitos++; }
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
  if (!plusConversionShown && plusUsageCount >= PLUS_CONVERSION_THRESHOLD && !isUsuarioPlus()) {
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
  var ativo = isUsuarioPlus();
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


// ============================================================
// OrganizaJa — Evolucao do sistema de Tarefas
// Etiquetas, subtarefas, recorrencia, lixeira, arquivo.
// Modulo aditivo: nao altera persistencia nem remove nada.
// ============================================================

// ---- Datas seguras (mes/ano/fuso) ----
function tkPad2(n){ return String(n).padStart(2,'0'); }
function tkYmd(y,m,d){ return y + '-' + tkPad2(m) + '-' + tkPad2(d); }
function tkDiasNoMes(y,m){ return new Date(y, m, 0).getDate(); } // m 1-based

// Calcula a proxima data de uma recorrencia a partir de uma data YYYY-MM-DD.
// Usa apenas componentes locais (sem UTC) para ser seguro em qualquer fuso;
// trata corretamente virada de mes, ano e meses com menos dias (clamp).
function proximaDataRecorrente(dataStr, tipo, intervalo){
  if (!dataStr) return '';
  var p = String(dataStr).split('-');
  if (p.length !== 3) return '';
  var y = parseInt(p[0],10), m = parseInt(p[1],10), d = parseInt(p[2],10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
  intervalo = intervalo || 1;
  if (tipo === 'diaria' || tipo === 'semanal') {
    var dias = tipo === 'diaria' ? intervalo : intervalo * 7;
    var dt = new Date(y, m-1, d);
    dt.setDate(dt.getDate() + dias);
    return tkYmd(dt.getFullYear(), dt.getMonth()+1, dt.getDate());
  }
  if (tipo === 'mensal') {
    var tm = m + intervalo;
    var ty = y + Math.floor((tm - 1) / 12);
    var mm = ((tm - 1) % 12) + 1;
    var maxd = tkDiasNoMes(ty, mm);
    return tkYmd(ty, mm, Math.min(d, maxd));
  }
  if (tipo === 'anual') {
    var ty2 = y + intervalo;
    var maxd2 = tkDiasNoMes(ty2, m);
    return tkYmd(ty2, m, Math.min(d, maxd2));
  }
  return '';
}

var tkRecLabels = { diaria:'Diaria', semanal:'Semanal', mensal:'Mensal', anual:'Anual' };
var tkRecCurta  = { diaria:'diaria', semanal:'semanal', mensal:'mensal', anual:'anual' };
function tkRecLabelCurta(rec){ if(!rec) return ''; return tkRecCurta[rec.tipo] || ''; }

// ---- Parsers de formulario ----
function tkParseEtiquetas(str){
  if (!str) return [];
  return String(str).split(/[,;]+/).map(function(s){
    return s.trim().replace(/^#+/, '').trim();
  }).filter(function(s, i, arr){ return s && arr.indexOf(s) === i; });
}

function tkLerRecorrenciaForm(selId){
  var v = tkVal(selId);
  if (!v || v === 'nenhuma') return null;
  return { tipo: v, intervalo: 1 };
}

// ============================================================
// SUBTAREFAS
// ============================================================
function tkAcharTarefa(id){
  return estado.tarefas.find(function(x){ return x.id === id; }) ||
         estado.tarefasArquivadas.find(function(x){ return x.id === id; });
}

function addSubtarefa(taskId){
  var t = tkAcharTarefa(taskId);
  if (!t) return;
  var inp = document.getElementById('tkSubInput-' + taskId);
  var txt = inp ? inp.value.trim() : '';
  // Tambem suporta o editor do modal
  if (!txt) {
    var inpM = document.getElementById('edSubInput');
    if (inpM && tarefaEditId === taskId) txt = inpM.value.trim();
  }
  if (!txt) { tkToast('Escreva a subtarefa'); return; }
  if (!Array.isArray(t.subtarefas)) t.subtarefas = [];
  t.subtarefas.push({ id: uid(), texto: txt, feito: false });
  salvarEstado();
  if (inp) inp.value = '';
  var inpM2 = document.getElementById('edSubInput');
  if (inpM2) inpM2.value = '';
  tarefasAbertas[taskId] = true;
  if (tarefaEditId === taskId) tkRenderSubtarefasEditor(taskId);
  renderTarefas();
  atualizarDashboardSeVisivel();
}

function toggleSubtarefa(taskId, subId){
  var t = tkAcharTarefa(taskId);
  if (!t || !t.subtarefas) return;
  var s = t.subtarefas.find(function(x){ return x.id === subId; });
  if (!s) return;
  s.feito = !s.feito;
  salvarEstado();
  tarefasAbertas[taskId] = true;
  if (tarefaEditId === taskId) tkRenderSubtarefasEditor(taskId);
  renderTarefas();
  atualizarDashboardSeVisivel();
}

function delSubtarefa(taskId, subId){
  var t = tkAcharTarefa(taskId);
  if (!t || !t.subtarefas) return;
  t.subtarefas = t.subtarefas.filter(function(x){ return x.id !== subId; });
  salvarEstado();
  tarefasAbertas[taskId] = true;
  if (tarefaEditId === taskId) tkRenderSubtarefasEditor(taskId);
  renderTarefas();
  atualizarDashboardSeVisivel();
}

function tkSubKey(e, taskId){
  if (e.key === 'Enter') { e.preventDefault(); addSubtarefa(taskId); }
}

// Editor de subtarefas dentro do modal de edicao
function tkRenderSubtarefasEditor(taskId){
  var box = document.getElementById('edTarefaSubs');
  if (!box) return;
  var t = tkAcharTarefa(taskId);
  if (!t) { box.innerHTML = ''; return; }
  var subs = t.subtarefas || [];
  var feitas = subs.filter(function(s){ return s.feito; }).length;
  var h = '<span class="tk-lbl">☑️ Subtarefas' + (subs.length ? ' (' + feitas + '/' + subs.length + ')' : '') + '</span>';
  h += '<ul class="tk-sublist">';
  subs.forEach(function(s){
    h += '<li class="tk-subitem' + (s.feito ? ' feito' : '') + '">';
    h += '<span class="tk-sub-check" onclick="toggleSubtarefa(\'' + t.id + '\',\'' + s.id + '\')">' + (s.feito ? '✅' : '⬜') + '</span>';
    h += '<span class="tk-sub-txt">' + esc(s.texto) + '</span>';
    h += '<button class="tk-sub-del" onclick="delSubtarefa(\'' + t.id + '\',\'' + s.id + '\')" title="Remover">✕</button>';
    h += '</li>';
  });
  h += '</ul>';
  h += '<div class="tk-sub-add"><input type="text" class="campo tk-sub-input" id="edSubInput" placeholder="Nova subtarefa..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();addSubtarefa(\'' + t.id + '\');}"><button class="btn btn-s" onclick="addSubtarefa(\'' + t.id + '\')">+ Adicionar</button></div>';
  box.innerHTML = h;
}

// ============================================================
// ARQUIVO
// ============================================================
function arquivarTarefa(id){
  var t = estado.tarefas.find(function(x){ return x.id === id; });
  if (!t) return;
  var copia = JSON.parse(JSON.stringify(t));
  copia.arquivadoEm = new Date().toISOString();
  estado.tarefas = estado.tarefas.filter(function(x){ return x.id !== id; });
  estado.tarefasArquivadas.unshift(copia);
  salvarEstado();
  renderTarefas();
  atualizarDashboardSeVisivel();
  tkToast('Tarefa arquivada 🗃️');
}

function desarquivarTarefa(id){
  var t = estado.tarefasArquivadas.find(function(x){ return x.id === id; });
  if (!t) return;
  var copia = JSON.parse(JSON.stringify(t));
  delete copia.arquivadoEm;
  estado.tarefasArquivadas = estado.tarefasArquivadas.filter(function(x){ return x.id !== id; });
  estado.tarefas.push(copia);
  salvarEstado();
  renderTarefas();
  atualizarDashboardSeVisivel();
  tkToast('Tarefa restaurada do arquivo ↩️');
}

function lixeiraDoArquivo(id){
  var t = estado.tarefasArquivadas.find(function(x){ return x.id === id; });
  if (!t) return;
  confirmar('Mover a tarefa arquivada "' + t.texto + '" para a lixeira?', function(){
    var copia = JSON.parse(JSON.stringify(t));
    delete copia.arquivadoEm;
    copia.excluidoEm = new Date().toISOString();
    estado.tarefasArquivadas = estado.tarefasArquivadas.filter(function(x){ return x.id !== id; });
    estado.tarefasLixeira.unshift(copia);
    salvarEstado();
    renderTarefas();
    tkToast('Tarefa movida para a lixeira');
  });
}

// ============================================================
// LIXEIRA (recuperacao / exclusao definitiva)
// ============================================================
function restaurarTarefa(id){
  var t = estado.tarefasLixeira.find(function(x){ return x.id === id; });
  if (!t) return;
  var copia = JSON.parse(JSON.stringify(t));
  delete copia.excluidoEm;
  estado.tarefasLixeira = estado.tarefasLixeira.filter(function(x){ return x.id !== id; });
  estado.tarefas.push(copia);
  salvarEstado();
  renderTarefas();
  atualizarDashboardSeVisivel();
  tkToast('Tarefa restaurada ↩️');
}

function excluirDefinitivo(id){
  var t = estado.tarefasLixeira.find(function(x){ return x.id === id; });
  if (!t) return;
  confirmar('Excluir DEFINITIVAMENTE a tarefa "' + t.texto + '"? Esta ação não pode ser desfeita.', function(){
    estado.tarefasLixeira = estado.tarefasLixeira.filter(function(x){ return x.id !== id; });
    salvarEstado();
    renderTarefas();
    tkToast('Tarefa excluída definitivamente');
  });
}

function esvaziarLixeira(){
  if (!estado.tarefasLixeira.length) { tkToast('A lixeira já está vazia'); return; }
  var n = estado.tarefasLixeira.length;
  confirmar('Esvaziar a lixeira? ' + n + (n === 1 ? ' tarefa será excluída' : ' tarefas serão excluídas') + ' definitivamente. Esta ação não pode ser desfeita.', function(){
    estado.tarefasLixeira = [];
    salvarEstado();
    renderTarefas();
    tkToast('Lixeira esvaziada');
  });
}

function restaurarTudoLixeira(){
  if (!estado.tarefasLixeira.length) return;
  estado.tarefasLixeira.forEach(function(t){
    var copia = JSON.parse(JSON.stringify(t));
    delete copia.excluidoEm;
    estado.tarefas.push(copia);
  });
  estado.tarefasLixeira = [];
  salvarEstado();
  renderTarefas();
  atualizarDashboardSeVisivel();
  tkToast('Todas as tarefas foram restauradas ↩️');
}

var tkLixeiraAberta = false;
function toggleLixeiraPainel(){
  tkLixeiraAberta = !tkLixeiraAberta;
  tkRenderLixeiraPainel();
}

function tkRenderLixeiraPainel(){
  var box = document.getElementById('tkLixeiraPainel');
  if (!box) return;
  var n = estado.tarefasLixeira.length;
  var h = '';
  h += '<div class="tk-lix-head" onclick="toggleLixeiraPainel()">';
  h += '<span>🗑️ Lixeira <span class="tk-chip-n">' + n + '</span></span>';
  h += '<span class="tk-lix-toggle">' + (tkLixeiraAberta ? '▲' : '▼') + '</span>';
  h += '</div>';
  if (tkLixeiraAberta) {
    h += '<div class="tk-lix-body">';
    if (!n) {
      h += '<div class="tk-vazio">A lixeira está vazia. Itens removidos ficam aqui por até 30 dias.</div>';
    } else {
      h += '<div class="tk-lix-actions">';
      h += '<button class="btn btn-s" onclick="restaurarTudoLixeira()">↩️ Restaurar tudo</button>';
      h += '<button class="btn btn-d" onclick="esvaziarLixeira()">🗑️ Esvaziar lixeira</button>';
      h += '</div>';
      h += '<ul class="lista tk-lista">';
      estado.tarefasLixeira.forEach(function(t){
        h += '<li class="tarefa-item tk-item tk-lix-item">';
        h += '<div class="tk-row">';
        h += '<div class="tarefa-info">';
        h += '<div class="tarefa-texto">' + esc(t.texto) + '</div>';
        var meta = [];
        if (t.data) meta.push('📅 ' + dataLocal(t.data));
        if (t.excluidoEm) meta.push('excluída ' + dataLocal(String(t.excluidoEm).slice(0,10)));
        h += '<div class="tarefa-meta">' + meta.join(' · ') + '</div>';
        h += '</div>';
        h += '<div class="tk-acoes">';
        h += '<button class="tk-acao" onclick="restaurarTarefa(\'' + t.id + '\')" title="Restaurar">↩️</button>';
        h += '<button class="tk-acao tk-acao-del" onclick="excluirDefinitivo(\'' + t.id + '\')" title="Excluir definitivamente">❌</button>';
        h += '</div>';
        h += '</div>';
        h += '</li>';
      });
      h += '</ul>';
    }
    h += '</div>';
  }
  box.innerHTML = h;
}

// ============================================================
// ETIQUETAS — barra de filtro rapido
// ============================================================
function filtrarPorEtiqueta(tag){
  estado.filtroEtiqueta = (estado.filtroEtiqueta === tag) ? '' : tag;
  salvarEstado();
  renderTarefas();
}

function limparFiltroEtiqueta(){
  estado.filtroEtiqueta = '';
  salvarEstado();
  renderTarefas();
}

function tkRenderBarraEtiquetas(){
  var box = document.getElementById('tkBarraEtiquetas');
  if (!box) return;
  var mapa = {};
  estado.tarefas.forEach(function(t){
    (t.etiquetas || []).forEach(function(tag){ mapa[tag] = (mapa[tag] || 0) + 1; });
  });
  var tags = Object.keys(mapa).sort(function(a,b){ return a.localeCompare(b, 'pt-BR'); });
  if (!tags.length && !estado.filtroEtiqueta) { box.innerHTML = ''; box.style.display = 'none'; return; }
  box.style.display = '';
  var h = '<span class="tk-etq-lbl">🏷️ Etiquetas:</span>';
  tags.forEach(function(tag){
    var ativo = estado.filtroEtiqueta === tag;
    h += '<button class="tk-etq-chip' + (ativo ? ' ativo' : '') + '" onclick="filtrarPorEtiqueta(\'' + esc(tag).replace(/\'/g,"\\'") + '\')">#' + esc(tag) + ' <span class="tk-chip-n">' + mapa[tag] + '</span></button>';
  });
  if (estado.filtroEtiqueta) {
    h += '<button class="tk-etq-clear" onclick="limparFiltroEtiqueta()">✕ limpar</button>';
  }
  box.innerHTML = h;
}

// ============================================================
// INJECAO DE UI (idempotente) — entregue so via app.js
// ============================================================
var _tkUIInjetada = false;
function tkEnsureUI(){
  // 1) Campos extras no formulario avancado
  var adv = document.getElementById('tarefaAvancado');
  if (adv && !document.getElementById('tarefaEtiquetas')) {
    var actions = adv.querySelector('.tk-adv-actions');
    var wrap = document.createElement('div');
    wrap.className = 'tk-adv-grid tk-extra-grid';
    wrap.innerHTML =
      '<div class="tk-field">' +
        '<label class="tk-lbl" for="tarefaEtiquetas">🏷️ Etiquetas (separe por vírgula)</label>' +
        '<input class="campo" id="tarefaEtiquetas" placeholder="Ex: prova, urgente, casa" autocomplete="off">' +
      '</div>' +
      '<div class="tk-field">' +
        '<label class="tk-lbl" for="tarefaRecorrencia">🔁 Repetir</label>' +
        '<select class="select" id="tarefaRecorrencia">' +
          '<option value="nenhuma">Não repetir</option>' +
          '<option value="diaria">Diariamente</option>' +
          '<option value="semanal">Semanalmente</option>' +
          '<option value="mensal">Mensalmente</option>' +
          '<option value="anual">Anualmente</option>' +
        '</select>' +
      '</div>' +
      '<div class="tk-field">' +
        '<label class="tk-lbl" for="tarefaRecorrenciaAte">🔁 Repetir até (opcional)</label>' +
        '<input class="campo" id="tarefaRecorrenciaAte" type="date">' +
      '</div>';
    if (actions) adv.insertBefore(wrap, actions);
    else adv.appendChild(wrap);
  }

  // 2) Opcao de ordenar por etiqueta
  var selO = document.getElementById('tarefaOrdem');
  if (selO && !selO.querySelector('option[value="etiqueta"]')) {
    var opt = document.createElement('option');
    opt.value = 'etiqueta';
    opt.textContent = '🏷️ Etiqueta';
    selO.appendChild(opt);
  }

  // 3) Chip de filtro "Arquivadas"
  var filtros = document.getElementById('tarefaFiltros');
  if (filtros && !filtros.querySelector('[data-f="arquivadas"]')) {
    var b = document.createElement('button');
    b.className = 'tk-chip';
    b.setAttribute('data-f', 'arquivadas');
    b.setAttribute('onclick', "filtroTarefa('arquivadas')");
    b.innerHTML = '🗃️ Arquivadas <span class="tk-chip-n" id="tkfN-arquivadas">0</span>';
    filtros.appendChild(b);
  }

  // 4) Barra de etiquetas (apos os filtros)
  if (filtros && !document.getElementById('tkBarraEtiquetas')) {
    var bar = document.createElement('div');
    bar.id = 'tkBarraEtiquetas';
    bar.className = 'tk-barra-etiquetas';
    filtros.parentNode.insertBefore(bar, filtros.nextSibling);
  }

  // 5) Painel da lixeira (apos a lista)
  var listaEl = document.getElementById('tarefasLista');
  if (listaEl && !document.getElementById('tkLixeiraPainel')) {
    var lp = document.createElement('div');
    lp.id = 'tkLixeiraPainel';
    lp.className = 'tk-lix-painel';
    listaEl.parentNode.insertBefore(lp, listaEl.nextSibling);
  }

  // 6) Campos extras no modal de edicao
  var modalBody = document.querySelector('#tarefaEditModal .tk-modal-body');
  if (modalBody && !document.getElementById('edTarefaEtiquetas')) {
    var ediv = document.createElement('div');
    ediv.className = 'tk-field';
    ediv.innerHTML = '<label class="tk-lbl" for="edTarefaEtiquetas">🏷️ Etiquetas (separe por vírgula)</label>' +
      '<input class="campo" id="edTarefaEtiquetas" placeholder="Ex: prova, urgente">';
    modalBody.appendChild(ediv);

    var rgrid = document.createElement('div');
    rgrid.className = 'tk-adv-grid';
    rgrid.innerHTML =
      '<div class="tk-field">' +
        '<label class="tk-lbl" for="edTarefaRecorrencia">🔁 Repetir</label>' +
        '<select class="select" id="edTarefaRecorrencia">' +
          '<option value="nenhuma">Não repetir</option>' +
          '<option value="diaria">Diariamente</option>' +
          '<option value="semanal">Semanalmente</option>' +
          '<option value="mensal">Mensalmente</option>' +
          '<option value="anual">Anualmente</option>' +
        '</select>' +
      '</div>' +
      '<div class="tk-field">' +
        '<label class="tk-lbl" for="edTarefaRecorrenciaAte">🔁 Repetir até (opcional)</label>' +
        '<input class="campo" id="edTarefaRecorrenciaAte" type="date">' +
      '</div>';
    modalBody.appendChild(rgrid);

    var sbox = document.createElement('div');
    sbox.className = 'tk-field';
    sbox.id = 'edTarefaSubs';
    modalBody.appendChild(sbox);
  }

  _tkUIInjetada = true;
}

// ============================================================
// ESTILOS (injetados via JS — style.css nao e entregue)
// ============================================================
var _tkStylesInjetados = false;
function tkEnsureStyles(){
  if (_tkStylesInjetados || document.getElementById('tkEnhanceStyles')) { _tkStylesInjetados = true; return; }
  var css = '' +
    '.tk-extra-grid{margin-top:.5rem}' +
    '.tk-tags{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.35rem}' +
    '.tk-tag{display:inline-block;font-size:.7rem;padding:.1rem .45rem;border-radius:999px;background:var(--cor,#6c5ce7);color:#fff;opacity:.85;cursor:pointer;line-height:1.4}' +
    '.tk-tag:hover{opacity:1}' +
    '.tk-badge-rec{background:#00b894;color:#fff;font-size:.65rem;padding:.05rem .4rem;border-radius:999px;margin-left:.25rem}' +
    '.tk-sub-prog{display:flex;align-items:center;gap:.5rem;margin-top:.4rem}' +
    '.tk-sub-prog-bar{flex:1;height:6px;background:rgba(127,127,127,.25);border-radius:999px;overflow:hidden;max-width:180px}' +
    '.tk-sub-prog-bar span{display:block;height:100%;background:linear-gradient(90deg,#6c5ce7,#00b894);border-radius:999px;transition:width .3s}' +
    '.tk-sub-prog-txt{font-size:.7rem;color:var(--txt3,#888);font-weight:600}' +
    '.tk-sublist{list-style:none;padding:0;margin:.3rem 0}' +
    '.tk-subitem{display:flex;align-items:center;gap:.5rem;padding:.25rem 0;font-size:.9rem}' +
    '.tk-subitem.feito .tk-sub-txt{text-decoration:line-through;opacity:.6}' +
    '.tk-sub-check{cursor:pointer;font-size:1rem;user-select:none}' +
    '.tk-sub-txt{flex:1}' +
    '.tk-sub-del{background:none;border:none;color:var(--vermelho,#d63031);cursor:pointer;font-size:.85rem;opacity:.6}' +
    '.tk-sub-del:hover{opacity:1}' +
    '.tk-sub-add{display:flex;gap:.5rem;margin-top:.4rem;align-items:center}' +
    '.tk-sub-input{flex:1;min-width:0}' +
    '.tk-barra-etiquetas{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:.5rem 0}' +
    '.tk-etq-lbl{font-size:.75rem;color:var(--txt3,#888);font-weight:600}' +
    '.tk-etq-chip{border:1px solid rgba(127,127,127,.3);background:transparent;color:var(--txt2,#555);font-size:.72rem;padding:.15rem .5rem;border-radius:999px;cursor:pointer}' +
    '.tk-etq-chip.ativo{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}' +
    '.tk-etq-clear{border:none;background:none;color:var(--vermelho,#d63031);font-size:.72rem;cursor:pointer}' +
    '.tk-lix-painel{margin-top:1rem;border:1px dashed rgba(127,127,127,.35);border-radius:12px;overflow:hidden}' +
    '.tk-lix-head{display:flex;justify-content:space-between;align-items:center;padding:.7rem 1rem;cursor:pointer;font-weight:600;font-size:.9rem;background:rgba(127,127,127,.06)}' +
    '.tk-lix-body{padding:.5rem 1rem 1rem}' +
    '.tk-lix-actions{display:flex;gap:.5rem;margin:.3rem 0 .6rem;flex-wrap:wrap}' +
    '.tk-lix-item{opacity:.85}' +
    '@media (max-width:820px){.tk-sub-prog-bar{max-width:120px}.tk-adv-grid{grid-template-columns:1fr 1fr}}' +
    '@media (max-width:520px){.tk-adv-grid{grid-template-columns:1fr}.tk-sub-add{flex-direction:column;align-items:stretch}}';
  var st = document.createElement('style');
  st.id = 'tkEnhanceStyles';
  st.textContent = css;
  document.head.appendChild(st);
  _tkStylesInjetados = true;
}

// ============================================================
// ORGANIZAJA - MODULO CALENDARIO/AGENDA (melhorias)
// UI injetada via JS + estilos, sem depender de edicoes no index.html
// ============================================================

var _calStylesInjetados = false;
var _calUIInjetada = false;

// Injeta campos novos no modal de evento (duracao, recorrencia, ate)
// e o painel "Proximos eventos" abaixo do calendario.
function calEnsureUI() {
  // --- Campos do modal ---
  if (!document.getElementById('calEvtDuracao')) {
    var body = document.querySelector('#calEventModal .tk-modal-body');
    if (body) {
      var wrap = document.createElement('div');
      wrap.innerHTML =
        '<div class="tk-adv-grid">' +
          '<div class="tk-field">' +
            '<label class="tk-lbl" for="calEvtDuracao">\u23f1\ufe0f Dura\u00e7\u00e3o (min)</label>' +
            '<input class="campo" id="calEvtDuracao" type="number" min="0" step="5" placeholder="Ex: 60">' +
          '</div>' +
          '<div class="tk-field">' +
            '<label class="tk-lbl" for="calEvtRecorrencia">\ud83d\udd01 Recorr\u00eancia</label>' +
            '<select class="select" id="calEvtRecorrencia" onchange="calToggleRecAte()">' +
              '<option value="nenhuma">N\u00e3o repetir</option>' +
              '<option value="diaria">Diariamente</option>' +
              '<option value="semanal">Semanalmente</option>' +
              '<option value="mensal">Mensalmente</option>' +
              '<option value="anual">Anualmente</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="tk-field" id="calEvtRecAteWrap" style="display:none">' +
          '<label class="tk-lbl" for="calEvtRecorrenciaAte">\ud83d\udcc6 Repetir at\u00e9 (opcional)</label>' +
          '<input class="campo" id="calEvtRecorrenciaAte" type="date">' +
        '</div>';
      body.appendChild(wrap);
    }
  }
  // --- Painel proximos eventos ---
  if (!document.getElementById('calProximos')) {
    var corpo = document.getElementById('calCorpo');
    if (corpo && corpo.parentNode) {
      var painel = document.createElement('div');
      painel.id = 'calProximos';
      painel.className = 'cal-proximos';
      corpo.parentNode.insertBefore(painel, corpo.nextSibling);
    }
  }
  _calUIInjetada = true;
}

// Mostra/esconde o campo "repetir ate" conforme a recorrencia
function calToggleRecAte() {
  var sel = document.getElementById('calEvtRecorrencia');
  var wrap = document.getElementById('calEvtRecAteWrap');
  if (!sel || !wrap) return;
  wrap.style.display = (sel.value && sel.value !== 'nenhuma') ? '' : 'none';
}

// Rotulo relativo amigavel para uma data 'YYYY-MM-DD'
function calLabelData(ds) {
  var hoje = hojeStr();
  var n = calDiffDias(hoje, ds);
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanh\u00e3';
  if (n > 1 && n <= 6) return 'em ' + n + ' dias';
  return dataLocal(ds);
}

// Renderiza o painel "Proximos eventos" (proximos 60 dias, ate 8 itens)
function renderCalProximos() {
  var cont = document.getElementById('calProximos');
  if (!cont) return;
  var hoje = hojeStr();
  var base = calParseData(hoje);
  var itens = [];
  for (var i = 0; i < 60 && itens.length < 60; i++) {
    var dd = new Date(base); dd.setDate(dd.getDate() + i);
    var ds = calDataStr(dd);
    getCalEvents(ds).forEach(function(e) {
      if (e.origem === 'tarefa' && e.feito) return;
      itens.push({ds: ds, e: e});
    });
  }
  itens.sort(function(a, b) {
    return (a.ds + (a.e.hora || '99:99')).localeCompare(b.ds + (b.e.hora || '99:99'));
  });
  var top = itens.slice(0, 8);
  var html = '<div class="cal-prox-head">\ud83d\udd1c Pr\u00f3ximos eventos</div>';
  if (!top.length) {
    html += '<div class="cal-prox-vazio">Nenhum evento nos pr\u00f3ximos 60 dias.</div>';
  } else {
    html += '<div class="cal-prox-list">';
    top.forEach(function(it) {
      var e = it.e;
      var horaStr = e.hora ? '<span class="cal-prox-hora">' + esc(e.hora) + '</span>' : '<span class="cal-prox-hora dim">dia todo</span>';
      var recStr = e.recorrente ? ' \ud83d\udd01' : '';
      html += '<div class="cal-prox-item" onclick="abrirCalDia(\'' + it.ds + '\')">';
      html += '<span class="cal-prox-icon" style="background:' + e.cor + '">' + calTipoIcon(e.tipo) + '</span>';
      html += '<div class="cal-prox-body">';
      html += '<div class="cal-prox-titulo">' + esc(e.texto) + recStr + '</div>';
      html += '<div class="cal-prox-meta">' + calLabelData(it.ds) + ' \u00b7 ' + dataLocal(it.ds) + ' ' + horaStr + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }
  cont.innerHTML = html;
}

// Estilos do modulo calendario
function calEnsureStyles() {
  if (_calStylesInjetados) return;
  var css = ''
    + '.cal-conflito-dot{color:#e17055;font-size:.7rem;margin-left:2px}'
    + '.cal-rec-mini{font-size:.6rem;margin-left:1px}'
    // --- semana por horario ---
    + '.cal-semana-wrap{border:1px solid var(--borda,#e6e6ef);border-radius:12px;overflow:hidden;font-size:.78rem}'
    + '.cal-sem-head{display:grid;grid-template-columns:52px repeat(7,1fr);background:var(--fundo2,#f6f6fb);position:sticky;top:0;z-index:2}'
    + '.cal-sem-hcell{padding:.4rem .2rem;text-align:center;border-left:1px solid var(--borda,#e6e6ef);cursor:pointer;display:flex;flex-direction:column;line-height:1.1}'
    + '.cal-sem-hlabel{cursor:default;color:#999;font-size:.62rem;justify-content:center}'
    + '.cal-sem-hcell.hoje{background:#6c5ce7;color:#fff;border-radius:6px}'
    + '.csh-nome{font-size:.6rem;text-transform:uppercase;letter-spacing:.03em;opacity:.8}'
    + '.csh-num{font-weight:700;font-size:.95rem}'
    + '.cal-sem-allday{display:grid;grid-template-columns:52px repeat(7,1fr);border-top:1px solid var(--borda,#e6e6ef);background:var(--fundo,#fff)}'
    + '.cal-sem-allday-cell{border-left:1px solid var(--borda,#e6e6ef);padding:2px;min-height:24px}'
    + '.cal-sem-allday-cell.hoje{background:rgba(108,92,231,.06)}'
    + '.cal-sem-chip{font-size:.62rem;background:var(--fundo2,#f6f6fb);border-radius:4px;padding:1px 4px;margin:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}'
    + '.cal-sem-body{max-height:60vh;overflow:auto}'
    + '.cal-sem-row{display:grid;grid-template-columns:52px repeat(7,1fr);border-top:1px solid var(--borda,#eee);min-height:38px}'
    + '.cal-sem-hora-lbl{font-size:.6rem;color:#999;padding:2px 4px;text-align:right}'
    + '.cal-sem-cell{border-left:1px solid var(--borda,#eee);padding:1px;cursor:pointer}'
    + '.cal-sem-cell.hoje{background:rgba(108,92,231,.05)}'
    + '.cal-sem-evt{font-size:.6rem;color:#fff;border-radius:4px;padding:1px 4px;margin:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.cal-sem-evt.conflito{outline:2px solid #e17055;outline-offset:-2px}'
    // --- dia ---
    + '.cdv-conflito-banner{background:#fff3f0;color:#c0392b;border:1px solid #f3c6ba;border-radius:8px;padding:.5rem .7rem;font-size:.8rem;margin-bottom:.6rem}'
    + '.cdv-proximos{background:var(--fundo2,#f6f6fb);border-radius:10px;padding:.5rem .7rem;margin-bottom:.7rem}'
    + '.cdv-proximos-tit{font-size:.72rem;font-weight:700;opacity:.7;margin-bottom:.3rem}'
    + '.cdv-proximo-item{font-size:.8rem;padding:2px 0}'
    + '.cdv-proximo-hora{font-weight:700;color:#6c5ce7;margin-right:.3rem}'
    + '.cdv-grupo-lbl{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;opacity:.55;margin:.6rem 0 .3rem}'
    + '.cdv-evt.conflito{outline:2px solid #e17055;outline-offset:1px}'
    + '.cdv-evt.feito .cdv-evt-titulo{text-decoration:line-through;opacity:.6}'
    + '.cdv-evt-dur{font-size:.68rem;color:#888;margin-left:.3rem}'
    + '.cdv-evt-rec{font-size:.66rem;color:#6c5ce7;margin-left:.3rem}'
    + '.cdv-evt-conflito{font-size:.66rem;color:#c0392b;font-weight:700;margin-left:.3rem}'
    + '.cdv-evt-origem{font-size:.68rem;color:#999;margin-top:.2rem}'
    + '.cdv-evt-origem a{color:#6c5ce7;text-decoration:none}'
    // --- proximos eventos ---
    + '.cal-proximos{margin-top:1rem;border:1px solid var(--borda,#e6e6ef);border-radius:12px;padding:.7rem .8rem;background:var(--fundo,#fff)}'
    + '.cal-prox-head{font-size:.85rem;font-weight:700;margin-bottom:.5rem}'
    + '.cal-prox-vazio{font-size:.78rem;color:#999;padding:.3rem 0}'
    + '.cal-prox-list{display:flex;flex-direction:column;gap:.35rem}'
    + '.cal-prox-item{display:flex;align-items:center;gap:.5rem;padding:.35rem;border-radius:8px;cursor:pointer;transition:background .15s}'
    + '.cal-prox-item:hover{background:var(--fundo2,#f6f6fb)}'
    + '.cal-prox-icon{width:28px;height:28px;min-width:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.85rem;color:#fff}'
    + '.cal-prox-titulo{font-size:.82rem;font-weight:600;line-height:1.2}'
    + '.cal-prox-meta{font-size:.68rem;color:#999}'
    + '.cal-prox-hora{font-weight:700;color:#6c5ce7;margin-left:.2rem}'
    + '.cal-prox-hora.dim{color:#bbb;font-weight:500}'
    // --- responsivo tablet/celular ---
    + '@media(max-width:640px){'
      + '.cal-semana-wrap{font-size:.68rem}'
      + '.cal-sem-head,.cal-sem-allday,.cal-sem-row{grid-template-columns:38px repeat(7,1fr)}'
      + '.cal-sem-hora-lbl{font-size:.55rem}'
      + '.csh-num{font-size:.8rem}'
      + '.cal-sem-evt,.cal-sem-chip{font-size:.55rem}'
      + '.cal-prox-titulo{font-size:.78rem}'
    + '}';
  var st = document.createElement('style');
  st.id = 'calEnhanceStyles';
  st.textContent = css;
  document.head.appendChild(st);
  _calStylesInjetados = true;
}

// ============================================================
// ESTUDOS v3 — Sessões, Cronograma, Pomodoro persistente,
// Prioridades e integrações (Progresso / Dashboard).
// Módulo adicionado ao final: sobrescreve funções do Pomodoro
// e envolve renderEstudos/renderProgresso/renderDashboard.
// ============================================================

// ---- Helpers de prioridade ----
var esPrioRank = { alta: 0, media: 1, baixa: 2 };
var esPrioMeta = {
  alta:  { lbl: 'Alta',  cor: '#e74c3c', ic: '🔴' },
  media: { lbl: 'Média', cor: '#f39c12', ic: '🟡' },
  baixa: { lbl: 'Baixa', cor: '#27ae60', ic: '🟢' }
};
function esPrioBadge(prio) {
  var m = esPrioMeta[prio || 'media'] || esPrioMeta.media;
  return '<span class="es-prio-badge" style="background:' + m.cor + ';color:#fff;font-size:.64rem;font-weight:700;padding:.12rem .42rem;border-radius:7px;margin-left:.3rem;white-space:nowrap">' + m.ic + ' ' + m.lbl + '</span>';
}
function esEnsurePrioridadeCampo(modalId, selId) {
  var modal = document.getElementById(modalId);
  if (!modal) return;
  if (document.getElementById(selId)) return;
  var body = modal.querySelector('.tk-modal-body');
  if (!body) return;
  var field = document.createElement('div');
  field.className = 'tk-field';
  field.innerHTML =
    '<label class="tk-lbl" for="' + selId + '">🎯 Prioridade</label>' +
    '<select class="campo" id="' + selId + '">' +
    '<option value="alta">🔴 Alta</option>' +
    '<option value="media">🟡 Média</option>' +
    '<option value="baixa">🟢 Baixa</option>' +
    '</select>';
  body.appendChild(field);
}
function esEnsurePrioridadeCampos() {
  esEnsurePrioridadeCampo('provaModal', 'prvPrioridade');
  esEnsurePrioridadeCampo('trabalhoModal', 'trbPrioridade');
}

// ---- Helpers de tempo / datas ----
function esFmtMin(min) {
  min = parseInt(min) || 0;
  if (min <= 0) return '0min';
  var h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return h + 'h ' + m + 'min';
  if (h > 0) return h + 'h';
  return m + 'min';
}
function esInicioSemanaStr() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // volta até domingo
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
var esDiasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
var esDiasCurto = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ---- Registro de sessões de estudo ----
function esRegistrarSessao(materiaNome, min, origem) {
  min = parseInt(min) || 0;
  if (min <= 0) return null;
  var s = {
    id: uid(),
    data: hojeStr(),
    ts: Date.now(),
    materia: materiaNome || '',
    min: min,
    origem: origem || 'manual'
  };
  if (!Array.isArray(estado.sessoes)) estado.sessoes = [];
  estado.sessoes.push(s);
  salvarEstado();
  return s;
}

// ============================================================
// POMODORO PERSISTENTE (timestamp-based) — sobrescreve as
// funções originais. Não perde estado ao recarregar a página.
// ============================================================
var esPomoInterval = null;

function esPomoRemainingMs() {
  var ps = estado.pomoSessao;
  if (!ps) return 0;
  if (ps.pausadoRestanteMs != null) return ps.pausadoRestanteMs;
  return ps.fimTs - Date.now();
}
function esPomoRodando() { return !!(estado.pomoSessao && estado.pomoSessao.pausadoRestanteMs == null); }
function esPomoPausado() { return !!(estado.pomoSessao && estado.pomoSessao.pausadoRestanteMs != null); }
function esPomoLabelFor(tipo) {
  if (tipo === 'curta') return '☕ Pausa curta';
  if (tipo === 'longa') return '🌴 Pausa longa';
  return 'Foco';
}
function esPomoMateriaSel() {
  var sel = document.getElementById('pomoMateria');
  return sel ? sel.value : '';
}
function esPomoStartInterval() {
  esPomoStopInterval();
  esPomoInterval = setInterval(esPomoTick, 1000);
}
function esPomoStopInterval() {
  if (esPomoInterval) { clearInterval(esPomoInterval); esPomoInterval = null; }
}
function esPomoStartTipo(tipo, min) {
  esPomoStopInterval();
  var dur = parseInt(min) || 25;
  estado.pomoSessao = {
    tipo: tipo,
    duracaoMin: dur,
    fimTs: Date.now() + dur * 60000,
    pausadoRestanteMs: null,
    materia: (tipo === 'foco') ? esPomoMateriaSel() : '',
    inicioTs: Date.now()
  };
  salvarEstado();
  esPomoStartInterval();
  renderPomodoro();
}
function esPomoConcluir(silencioso) {
  var ps = estado.pomoSessao;
  if (!ps) return;
  esPomoStopInterval();
  if (ps.tipo === 'foco') {
    esRegistrarSessao(ps.materia, ps.duracaoMin, 'pomodoro');
    estado.pomodorosHoje = (estado.pomodorosData === hojeStr()) ? (estado.pomodorosHoje + 1) : 1;
    estado.pomodorosData = hojeStr();
  }
  estado.pomoSessao = null;
  salvarEstado();
  if (!silencioso) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('OrganizaJá', { body: ps.tipo === 'foco' ? 'Pomodoro concluído! Hora da pausa 🎉' : 'Pausa concluída! Bora focar 💪' });
      }
    } catch (e) {}
    playBeep();
  }
  renderPomodoro();
  try { if (typeof atualizarDashboardSeVisivel === 'function') atualizarDashboardSeVisivel(); } catch (e) {}
}
function esPomoTick() {
  var ps = estado.pomoSessao;
  if (!ps) { esPomoStopInterval(); return; }
  if (ps.pausadoRestanteMs != null) return;
  if (ps.fimTs - Date.now() <= 0) { esPomoConcluir(false); return; }
  renderPomodoroTimer();
}
function esPomoRestore() {
  var ps = estado.pomoSessao;
  if (!ps) return;
  if (ps.pausadoRestanteMs != null) return; // pausado: mantém
  if (ps.fimTs - Date.now() <= 0) { esPomoConcluir(true); }
  else { esPomoStartInterval(); }
}

// ---- Funções públicas sobrescritas (chamadas pelo HTML) ----
function startPomodoro() { esPomoStartTipo('foco', (estado.pomoConfig && estado.pomoConfig.foco) || 25); }
function pausarPomodoro() {
  var ps = estado.pomoSessao;
  if (!ps) return;
  if (ps.pausadoRestanteMs == null) {
    ps.pausadoRestanteMs = Math.max(0, ps.fimTs - Date.now());
    esPomoStopInterval();
  } else {
    ps.fimTs = Date.now() + ps.pausadoRestanteMs;
    ps.pausadoRestanteMs = null;
    esPomoStartInterval();
  }
  salvarEstado();
  renderPomodoro();
}
function resetPomodoro() {
  esPomoStopInterval();
  estado.pomoSessao = null;
  salvarEstado();
  renderPomodoro();
}
function setPomoMin(v) {
  var n = parseInt(v) || 25;
  if (!estado.pomoConfig) estado.pomoConfig = { foco: 25, pausa: 5 };
  estado.pomoConfig.foco = n;
  estado.pomodoroMin = n;
  salvarEstado();
  renderPomodoro();
}
function pomoToggle() { if (estado.pomoSessao) { pausarPomodoro(); } else { startPomodoro(); } }
function pomoReset() { resetPomodoro(); }
function pomoPausaCurta() { esPomoStartTipo('curta', (estado.pomoConfig && estado.pomoConfig.pausa) || 5); }
function pomoPausaLonga() { esPomoStartTipo('longa', 15); }
function pomoConfigurar() {
  var foco = parseInt(document.getElementById('pomoFocoMin').value) || 25;
  var pausa = parseInt(document.getElementById('pomoPausaMin').value) || 5;
  if (!estado.pomoConfig) estado.pomoConfig = { foco: 25, pausa: 5 };
  estado.pomoConfig.foco = foco;
  estado.pomoConfig.pausa = pausa;
  estado.pomodoroMin = foco;
  salvarEstado();
  renderPomodoro();
}

// ---- Render do Pomodoro (persistente) ----
function esPomoEnsureUI() {
  var page = document.getElementById('page-pomodoro');
  if (!page) return;
  if (!document.getElementById('pomoExtra')) {
    var tela = page.querySelector('.pomodoro-tela');
    var box = document.createElement('div');
    box.id = 'pomoExtra';
    box.className = 'linha';
    box.style.cssText = 'margin-top:.8rem;flex-wrap:wrap;gap:.5rem;align-items:center';
    box.innerHTML =
      '<label style="font-size:.8rem;color:var(--txt2)">📚 Matéria:</label>' +
      '<select class="campo" id="pomoMateria" style="min-width:150px"></select>' +
      '<span id="pomoResumo" style="font-size:.8rem;color:var(--txt2);margin-left:auto"></span>';
    if (tela && tela.parentNode) { tela.parentNode.insertBefore(box, tela.nextSibling); }
    else { var sec = page.querySelector('.secao'); if (sec) sec.appendChild(box); else page.appendChild(box); }
  }
  esPomoFillMaterias();
}
function esPomoFillMaterias() {
  var sel = document.getElementById('pomoMateria');
  if (!sel) return;
  var cur = sel.value;
  var opts = '<option value="">— Sem matéria —</option>';
  (estado.estudos.materias || []).forEach(function (m) {
    opts += '<option value="' + esc(m.nome) + '">' + esc(m.nome) + '</option>';
  });
  sel.innerHTML = opts;
  if (estado.pomoSessao && estado.pomoSessao.materia) sel.value = estado.pomoSessao.materia;
  else if (cur) sel.value = cur;
}
function esPomoRenderResumo() {
  var el = document.getElementById('pomoResumo');
  if (!el) return;
  var hoje = hojeStr();
  var minHoje = (estado.sessoes || []).filter(function (s) { return s.data === hoje; }).reduce(function (a, s) { return a + (s.min || 0); }, 0);
  el.textContent = '⏱️ Foco hoje: ' + esFmtMin(minHoje);
}
function renderPomodoro() {
  esPomoEnsureUI();
  var hoje = hojeStr();
  var total = (estado.pomodorosData === hoje) ? estado.pomodorosHoje : 0;
  var cic = document.getElementById('pomoCiclos');
  if (cic) cic.textContent = total;
  var btn = document.getElementById('pomoStart');
  if (btn) {
    if (estado.pomoSessao) { btn.textContent = esPomoPausado() ? '▶ Continuar' : '⏸ Pausar'; }
    else { btn.textContent = '▶ Iniciar'; }
  }
  var lbl = document.getElementById('pomoLabel');
  if (lbl) {
    if (estado.pomoSessao) { lbl.textContent = esPomoLabelFor(estado.pomoSessao.tipo) + (esPomoPausado() ? ' (pausado)' : ''); }
    else { lbl.textContent = 'Foco'; }
  }
  var fi = document.getElementById('pomoFocoMin'); if (fi && estado.pomoConfig) fi.value = estado.pomoConfig.foco;
  var pi = document.getElementById('pomoPausaMin'); if (pi && estado.pomoConfig) pi.value = estado.pomoConfig.pausa;
  esPomoRenderResumo();
  renderPomodoroTimer();
}
function renderPomodoroTimer() {
  var el = document.getElementById('pomoTempo');
  if (!el) return;
  var ms;
  if (estado.pomoSessao) { ms = esPomoRemainingMs(); }
  else { ms = ((estado.pomoConfig && estado.pomoConfig.foco) || 25) * 60000; }
  if (ms < 0) ms = 0;
  var totalSec = Math.round(ms / 1000);
  var m = Math.floor(totalSec / 60), s = totalSec % 60;
  el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// ============================================================
// CRONOGRAMA SEMANAL + SESSÕES DE ESTUDO (UI injetada)
// ============================================================
function esEnsureStyles() {
  if (document.getElementById('esV3Styles')) return;
  var st = document.createElement('style');
  st.id = 'esV3Styles';
  st.textContent =
    '.es-crono-dia{margin-bottom:.7rem}' +
    '.es-crono-dia-tit{font-size:.82rem;font-weight:700;color:var(--txt2);margin-bottom:.3rem}' +
    '.es-crono-item{display:flex;align-items:center;gap:.5rem;background:var(--card,#fff);border-radius:10px;padding:.5rem .7rem;margin-bottom:.35rem;border-left:4px solid var(--cor2,#6c5ce7)}' +
    '.es-crono-item .eci-hora{font-weight:700;font-size:.85rem;min-width:48px}' +
    '.es-crono-item .eci-body{flex:1;min-width:0}' +
    '.es-crono-item .eci-mat{font-size:.85rem;font-weight:600}' +
    '.es-crono-item .eci-nota{font-size:.75rem;color:var(--txt3)}' +
    '.es-crono-item .eci-dur{font-size:.75rem;color:var(--txt2);white-space:nowrap}' +
    '.es-mini-btn{background:none;border:none;cursor:pointer;font-size:.9rem;padding:.2rem .3rem;opacity:.7}' +
    '.es-mini-btn:hover{opacity:1}' +
    '.es-sess-cards{display:flex;gap:.5rem;flex-wrap:wrap}' +
    '.es-sess-card{flex:1;min-width:90px;background:var(--card,#fff);border-radius:12px;padding:.6rem;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    '.es-sess-card .esc-num{display:block;font-size:1.15rem;font-weight:800;color:var(--cor2,#6c5ce7)}' +
    '.es-sess-card .esc-lbl{display:block;font-size:.7rem;color:var(--txt2);margin-top:.15rem}' +
    '.es-sess-item{display:flex;align-items:center;gap:.5rem;background:var(--card,#fff);border-radius:10px;padding:.5rem .7rem;margin-bottom:.35rem;border-left:4px solid var(--verde,#27ae60)}' +
    '.es-sess-item .esi-body{flex:1;min-width:0}' +
    '.es-sess-item .esi-mat{font-size:.85rem;font-weight:600}' +
    '.es-sess-item .esi-meta{font-size:.72rem;color:var(--txt3)}' +
    '.es-sess-item .esi-min{font-weight:700;font-size:.85rem;white-space:nowrap}' +
    '.es-vazio{color:var(--txt3);font-size:.82rem;text-align:center;padding:.6rem}';
  document.head.appendChild(st);
}
function esEstudosEnsureUI() {
  var main = document.getElementById('estudosMain');
  if (!main) return;
  esEnsureStyles();
  if (!document.getElementById('esCronogramaSecao')) {
    var sc = document.createElement('div');
    sc.className = 'secao';
    sc.id = 'esCronogramaSecao';
    sc.innerHTML =
      '<div class="secao-header"><h3 style="font-size:1rem;font-weight:700;margin:0">🗓️ Cronograma de estudos</h3>' +
      '<button class="btn btn-p secao-add-btn" onclick="esAbrirCronoModal()">＋ Adicionar</button></div>' +
      '<div id="esCronogramaLista"></div>';
    main.appendChild(sc);
  }
  if (!document.getElementById('esSessoesSecao')) {
    var ss = document.createElement('div');
    ss.className = 'secao';
    ss.id = 'esSessoesSecao';
    ss.innerHTML =
      '<div class="secao-header"><h3 style="font-size:1rem;font-weight:700;margin:0">⏱️ Sessões de estudo</h3>' +
      '<button class="btn btn-p secao-add-btn" onclick="esAbrirSessaoModal()">＋ Registrar</button></div>' +
      '<div id="esSessoesResumo" style="margin-bottom:.6rem"></div>' +
      '<div id="esSessoesLista"></div>';
    main.appendChild(ss);
  }
  esEnsureModals();
}

// ---- Modais (Cronograma + Sessão) injetados no body ----
function esMateriaOptions(sel) {
  var opts = '<option value="">— Sem matéria —</option>';
  (estado.estudos.materias || []).forEach(function (m) {
    opts += '<option value="' + esc(m.nome) + '"' + (m.nome === sel ? ' selected' : '') + '>' + esc(m.nome) + '</option>';
  });
  return opts;
}
function esEnsureModals() {
  if (!document.getElementById('esCronoModal')) {
    var d1 = document.createElement('div');
    d1.className = 'tk-modal-bg';
    d1.id = 'esCronoModal';
    d1.setAttribute('role', 'dialog');
    d1.setAttribute('aria-modal', 'true');
    d1.onclick = function (e) { esFecharCronoModal(e); };
    var diasOpt = '';
    for (var i = 0; i < 7; i++) diasOpt += '<option value="' + i + '">' + esDiasSemana[i] + '</option>';
    d1.innerHTML =
      '<div class="tk-modal" onclick="event.stopPropagation()">' +
      '<div class="tk-modal-head"><h3 id="esCronoModalTitle">＋ Novo horário</h3>' +
      '<button class="tk-modal-x" onclick="esFecharCronoModal()" title="Fechar">✕</button></div>' +
      '<div class="tk-modal-body">' +
      '<div class="tk-field"><label class="tk-lbl" for="crnMateria">📚 Matéria</label><select class="campo" id="crnMateria"></select></div>' +
      '<div class="tk-adv-grid">' +
      '<div class="tk-field"><label class="tk-lbl" for="crnDia">🗓️ Dia da semana</label><select class="campo" id="crnDia">' + diasOpt + '</select></div>' +
      '<div class="tk-field"><label class="tk-lbl" for="crnHora">🕐 Horário</label><input class="campo" id="crnHora" type="time"></div>' +
      '<div class="tk-field"><label class="tk-lbl" for="crnDur">⏳ Duração (min)</label><input class="campo" id="crnDur" type="number" min="5" step="5" value="60"></div>' +
      '</div>' +
      '<div class="tk-field"><label class="tk-lbl" for="crnNota">📝 Nota</label><input class="campo" id="crnNota" placeholder="Ex: Revisar capítulo 3"></div>' +
      '</div>' +
      '<div class="tk-modal-foot"><button class="btn btn-s" onclick="esFecharCronoModal()">Cancelar</button>' +
      '<button class="btn btn-p" onclick="esSalvarCrono()">💾 Salvar</button></div>' +
      '</div>';
    document.body.appendChild(d1);
  }
  if (!document.getElementById('esSessaoModal')) {
    var d2 = document.createElement('div');
    d2.className = 'tk-modal-bg';
    d2.id = 'esSessaoModal';
    d2.setAttribute('role', 'dialog');
    d2.setAttribute('aria-modal', 'true');
    d2.onclick = function (e) { esFecharSessaoModal(e); };
    d2.innerHTML =
      '<div class="tk-modal" onclick="event.stopPropagation()">' +
      '<div class="tk-modal-head"><h3>⏱️ Registrar sessão</h3>' +
      '<button class="tk-modal-x" onclick="esFecharSessaoModal()" title="Fechar">✕</button></div>' +
      '<div class="tk-modal-body">' +
      '<div class="tk-field"><label class="tk-lbl" for="sesMateria">📚 Matéria</label><select class="campo" id="sesMateria"></select></div>' +
      '<div class="tk-adv-grid">' +
      '<div class="tk-field"><label class="tk-lbl" for="sesData">📅 Data</label><input class="campo" id="sesData" type="date"></div>' +
      '<div class="tk-field"><label class="tk-lbl" for="sesMin">⏱️ Minutos estudados</label><input class="campo" id="sesMin" type="number" min="1" step="5" value="30"></div>' +
      '</div>' +
      '<div class="tk-field"><label class="tk-lbl" for="sesNota">📝 Nota</label><input class="campo" id="sesNota" placeholder="O que estudou?"></div>' +
      '</div>' +
      '<div class="tk-modal-foot"><button class="btn btn-s" onclick="esFecharSessaoModal()">Cancelar</button>' +
      '<button class="btn btn-p" onclick="esSalvarSessao()">💾 Salvar</button></div>' +
      '</div>';
    document.body.appendChild(d2);
  }
}

// ---- Cronograma: CRUD ----
var esCronoEditId = null;
function esAbrirCronoModal(editId) {
  esEnsureModals();
  esCronoEditId = editId || null;
  var modal = document.getElementById('esCronoModal');
  document.getElementById('crnMateria').innerHTML = esMateriaOptions('');
  var tit = document.getElementById('esCronoModalTitle');
  if (esCronoEditId) {
    var c = estado.cronograma.find(function (x) { return x.id === esCronoEditId; });
    if (c) {
      if (tit) tit.textContent = '✏️ Editar horário';
      document.getElementById('crnMateria').value = c.materia || '';
      document.getElementById('crnDia').value = String(c.dia || 0);
      document.getElementById('crnHora').value = c.hora || '';
      document.getElementById('crnDur').value = c.dur || 60;
      document.getElementById('crnNota').value = c.nota || '';
    }
  } else {
    if (tit) tit.textContent = '＋ Novo horário';
    document.getElementById('crnMateria').value = '';
    document.getElementById('crnDia').value = '1';
    document.getElementById('crnHora').value = '';
    document.getElementById('crnDur').value = 60;
    document.getElementById('crnNota').value = '';
  }
  modal.classList.add('visivel');
}
function esFecharCronoModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var modal = document.getElementById('esCronoModal');
  if (modal) modal.classList.remove('visivel');
  esCronoEditId = null;
}
function esSalvarCrono() {
  var materia = document.getElementById('crnMateria').value;
  var dia = parseInt(document.getElementById('crnDia').value) || 0;
  var hora = document.getElementById('crnHora').value;
  var dur = parseInt(document.getElementById('crnDur').value) || 30;
  var nota = document.getElementById('crnNota').value.trim();
  if (!Array.isArray(estado.cronograma)) estado.cronograma = [];
  if (esCronoEditId) {
    var c = estado.cronograma.find(function (x) { return x.id === esCronoEditId; });
    if (c) { c.materia = materia; c.dia = dia; c.hora = hora; c.dur = dur; c.nota = nota; }
  } else {
    estado.cronograma.push({ id: uid(), materia: materia, dia: dia, hora: hora, dur: dur, nota: nota });
  }
  salvarEstado();
  esFecharCronoModal();
  esRenderCronograma();
}
function esDelCrono(id) {
  showConfirm('Remover este horário do cronograma?', function () {
    estado.cronograma = estado.cronograma.filter(function (c) { return c.id !== id; });
    salvarEstado();
    esRenderCronograma();
  });
}
function esRenderCronograma() {
  var cont = document.getElementById('esCronogramaLista');
  if (!cont) return;
  var lista = (estado.cronograma || []).slice();
  if (!lista.length) {
    cont.innerHTML = '<div class="es-vazio">Nenhum horário planejado. Clique em <strong>＋ Adicionar</strong> para montar sua rotina de estudos.</div>';
    return;
  }
  var porDia = {};
  lista.forEach(function (c) { (porDia[c.dia] = porDia[c.dia] || []).push(c); });
  var html = '';
  for (var d = 0; d < 7; d++) {
    var arr = porDia[d];
    if (!arr || !arr.length) continue;
    arr.sort(function (a, b) { return (a.hora || 'z').localeCompare(b.hora || 'z'); });
    html += '<div class="es-crono-dia"><div class="es-crono-dia-tit">' + esDiasSemana[d] + '</div>';
    arr.forEach(function (c) {
      var corMat = (estado.estudos.materias.find(function (m) { return m.nome === c.materia; }) || {}).cor || 'var(--cor2,#6c5ce7)';
      html += '<div class="es-crono-item" style="border-left-color:' + corMat + '">';
      html += '<span class="eci-hora">' + (c.hora || '--:--') + '</span>';
      html += '<div class="eci-body"><div class="eci-mat">' + (c.materia ? esc(c.materia) : '— Sem matéria') + '</div>';
      if (c.nota) html += '<div class="eci-nota">' + esc(c.nota) + '</div>';
      html += '</div>';
      html += '<span class="eci-dur">' + esFmtMin(c.dur) + '</span>';
      html += '<button class="es-mini-btn" onclick="esAbrirCronoModal(\'' + c.id + '\')" title="Editar">✏️</button>';
      html += '<button class="es-mini-btn" onclick="esDelCrono(\'' + c.id + '\')" title="Excluir">🗑️</button>';
      html += '</div>';
    });
    html += '</div>';
  }
  cont.innerHTML = html;
}

// ---- Sessões: registrar manual + render ----
function esAbrirSessaoModal() {
  esEnsureModals();
  document.getElementById('sesMateria').innerHTML = esMateriaOptions('');
  document.getElementById('sesMateria').value = '';
  document.getElementById('sesData').value = hojeStr();
  document.getElementById('sesMin').value = 30;
  document.getElementById('sesNota').value = '';
  document.getElementById('esSessaoModal').classList.add('visivel');
}
function esFecharSessaoModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var modal = document.getElementById('esSessaoModal');
  if (modal) modal.classList.remove('visivel');
}
function esSalvarSessao() {
  var materia = document.getElementById('sesMateria').value;
  var data = document.getElementById('sesData').value || hojeStr();
  var min = parseInt(document.getElementById('sesMin').value) || 0;
  var nota = document.getElementById('sesNota').value.trim();
  if (min <= 0) { if (typeof tkToast === 'function') tkToast('Informe os minutos estudados'); return; }
  if (!Array.isArray(estado.sessoes)) estado.sessoes = [];
  estado.sessoes.push({ id: uid(), data: data, ts: Date.now(), materia: materia, min: min, origem: 'manual', nota: nota });
  salvarEstado();
  esFecharSessaoModal();
  esRenderSessoes();
  try { if (typeof atualizarDashboardSeVisivel === 'function') atualizarDashboardSeVisivel(); } catch (e) {}
}
function esDelSessao(id) {
  showConfirm('Excluir esta sessão de estudo?', function () {
    estado.sessoes = estado.sessoes.filter(function (s) { return s.id !== id; });
    salvarEstado();
    esRenderSessoes();
  });
}
function esRenderSessoes() {
  var resumo = document.getElementById('esSessoesResumo');
  var cont = document.getElementById('esSessoesLista');
  if (!cont) return;
  var sess = (estado.sessoes || []).slice();
  var hoje = hojeStr();
  var ini = esInicioSemanaStr();
  var minHoje = sess.filter(function (s) { return s.data === hoje; }).reduce(function (a, s) { return a + (s.min || 0); }, 0);
  var minSemana = sess.filter(function (s) { return s.data >= ini; }).reduce(function (a, s) { return a + (s.min || 0); }, 0);
  var minTotal = sess.reduce(function (a, s) { return a + (s.min || 0); }, 0);
  if (resumo) {
    resumo.innerHTML = '<div class="es-sess-cards">' +
      '<div class="es-sess-card"><span class="esc-num">' + esFmtMin(minHoje) + '</span><span class="esc-lbl">Hoje</span></div>' +
      '<div class="es-sess-card"><span class="esc-num">' + esFmtMin(minSemana) + '</span><span class="esc-lbl">Esta semana</span></div>' +
      '<div class="es-sess-card"><span class="esc-num">' + esFmtMin(minTotal) + '</span><span class="esc-lbl">Total</span></div>' +
      '<div class="es-sess-card"><span class="esc-num">' + sess.length + '</span><span class="esc-lbl">Sessões</span></div>' +
      '</div>';
  }
  sess.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  if (!sess.length) {
    cont.innerHTML = '<div class="es-vazio">Nenhuma sessão registrada. Use o Pomodoro (registra automaticamente) ou clique em <strong>＋ Registrar</strong>.</div>';
    return;
  }
  var html = '';
  sess.slice(0, 30).forEach(function (s) {
    var corMat = (estado.estudos.materias.find(function (m) { return m.nome === s.materia; }) || {}).cor || 'var(--verde,#27ae60)';
    var origemIc = s.origem === 'pomodoro' ? '🍅' : '✍️';
    html += '<div class="es-sess-item" style="border-left-color:' + corMat + '">';
    html += '<div class="esi-body"><div class="esi-mat">' + (s.materia ? esc(s.materia) : '— Sem matéria') + '</div>';
    var meta = origemIc + ' ' + (s.data ? dataLocal(s.data) : '') + (s.nota ? ' · ' + esc(s.nota) : '');
    html += '<div class="esi-meta">' + meta + '</div></div>';
    html += '<span class="esi-min">' + esFmtMin(s.min) + '</span>';
    html += '<button class="es-mini-btn" onclick="esDelSessao(\'' + s.id + '\')" title="Excluir">🗑️</button>';
    html += '</div>';
  });
  cont.innerHTML = html;
}

// ============================================================
// WRAPPERS: integra Cronograma/Sessões à página Estudos e
// injeta tempo de estudo em Progresso e Dashboard.
// ============================================================
(function () {
  if (typeof renderEstudos === 'function') {
    var _origRenderEstudos = renderEstudos;
    renderEstudos = function () {
      _origRenderEstudos();
      try {
        esEstudosEnsureUI();
        esRenderCronograma();
        esRenderSessoes();
        esPomoFillMaterias();
      } catch (e) {}
    };
  }
  if (typeof voltarEstudos === 'function') {
    var _origVoltar = voltarEstudos;
    voltarEstudos = function () {
      _origVoltar();
      try {
        esEstudosEnsureUI();
        esRenderCronograma();
        esRenderSessoes();
      } catch (e) {}
    };
  }
  if (typeof renderProgresso === 'function') {
    var _origProg = renderProgresso;
    renderProgresso = function () {
      _origProg();
      try { esRenderProgressoExtra(); } catch (e) {}
    };
  }
  if (typeof renderDashboard === 'function') {
    var _origDash = renderDashboard;
    renderDashboard = function () {
      _origDash();
      try {
        var dc = document.getElementById('dashCards');
        if (dc) {
          var hoje = hojeStr();
          var minHoje = (estado.sessoes || []).filter(function (s) { return s.data === hoje; }).reduce(function (a, s) { return a + (s.min || 0); }, 0);
          var card = document.createElement('div');
          card.className = 'dash-card dc-estudo';
          card.innerHTML = '<span class="dc-num">' + minHoje + '</span><span class="dc-label">Min. estudo hoje</span>';
          dc.appendChild(card);
        }
      } catch (e) {}
    };
  }
})();

// ---- Progresso: seção de tempo de estudo ----
function esProgCard(lbl, val) {
  return '<div style="flex:1;min-width:80px;background:var(--bg2,#f5f5f7);border-radius:10px;padding:.55rem;text-align:center">' +
    '<div style="font-size:1.05rem;font-weight:800;color:var(--cor2,#6c5ce7)">' + val + '</div>' +
    '<div style="font-size:.68rem;color:var(--txt2);margin-top:.15rem">' + lbl + '</div></div>';
}
function esRenderProgressoExtra() {
  var cont = document.getElementById('progressoConteudo');
  if (!cont) return;
  var hoje = hojeStr();
  var ini = esInicioSemanaStr();
  var sess = estado.sessoes || [];
  var totalMin = sess.reduce(function (a, s) { return a + (s.min || 0); }, 0);
  var minHoje = sess.filter(function (s) { return s.data === hoje; }).reduce(function (a, s) { return a + (s.min || 0); }, 0);
  var minSemana = sess.filter(function (s) { return s.data >= ini; }).reduce(function (a, s) { return a + (s.min || 0); }, 0);
  var porMat = {};
  sess.forEach(function (s) { var k = s.materia || '— Sem matéria'; porMat[k] = (porMat[k] || 0) + (s.min || 0); });
  var arr = Object.keys(porMat).map(function (k) { return { nome: k, min: porMat[k] }; }).sort(function (a, b) { return b.min - a.min; });
  var h = '<div style="background:var(--card,#fff);border-radius:14px;padding:1rem;margin-top:1rem;box-shadow:0 1px 3px rgba(0,0,0,.06)">';
  h += '<div style="font-weight:700;margin-bottom:.6rem">⏱️ Tempo de estudo</div>';
  h += '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.7rem">';
  h += esProgCard('Hoje', esFmtMin(minHoje));
  h += esProgCard('Esta semana', esFmtMin(minSemana));
  h += esProgCard('Total', esFmtMin(totalMin));
  h += esProgCard('Sessões', String(sess.length));
  h += '</div>';
  if (arr.length) {
    h += '<div style="font-size:.8rem;color:var(--txt2);margin-bottom:.4rem">Por matéria</div>';
    var max = arr[0].min || 1;
    arr.slice(0, 8).forEach(function (x) {
      var pct = Math.round((x.min / max) * 100);
      h += '<div style="margin-bottom:.45rem"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.15rem"><span>' + esc(x.nome) + '</span><span>' + esFmtMin(x.min) + '</span></div>';
      h += '<div style="height:6px;background:var(--bg2,#eee);border-radius:4px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:var(--cor2,#6c5ce7)"></div></div></div>';
    });
  } else {
    h += '<div style="font-size:.8rem;color:var(--txt3)">Nenhuma sessão registrada ainda. Use o Pomodoro ou registre manualmente na aba Estudos.</div>';
  }
  h += '</div>';
  var wrap = document.createElement('div');
  wrap.innerHTML = h;
  if (wrap.firstChild) cont.appendChild(wrap.firstChild);
}

// ---- Restaura Pomodoro após carregar (timestamp-based) ----
document.addEventListener('DOMContentLoaded', function () {
  try { esPomoRestore(); } catch (e) {}
});


// ============================================================
// ETAPA 6/20 — Evolucao de HABITOS e METAS
// (append-only; sobrescreve por reatribuicao das funcoes ao final)
// ============================================================

// ---- Estilos injetados uma unica vez ----
var _hbmtStylesOk = false;
function hbmtEnsureStyles() {
  if (_hbmtStylesOk) return;
  _hbmtStylesOk = true;
  try {
    var css = ''
    + '.hb6-topbar{display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin:.2rem 0 .7rem}'
    + '.hb6-topbar .hb6-nova{background:var(--cor,#6c5ce7);color:#fff;border:none;border-radius:10px;padding:.5rem .8rem;font-size:.8rem;font-weight:700;cursor:pointer}'
    + '.hb6-card{background:var(--bg1,#fff);border:1px solid var(--borda,#eee);border-radius:14px;padding:.8rem;margin-bottom:.7rem;box-shadow:0 1px 4px rgba(0,0,0,.04)}'
    + '.hb6-card.pausado{opacity:.6}'
    + '.hb6-head{display:flex;align-items:center;gap:.55rem}'
    + '.hb6-emoji{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex:0 0 auto}'
    + '.hb6-hbody{flex:1;min-width:0}'
    + '.hb6-nome{font-weight:700;font-size:.92rem;display:flex;align-items:center;gap:.35rem;flex-wrap:wrap}'
    + '.hb6-sub{font-size:.7rem;color:var(--txt3,#999);margin-top:.1rem}'
    + '.hb6-badge{font-size:.62rem;padding:.1rem .4rem;border-radius:20px;background:var(--bg2,#f0f0f3);color:var(--txt2,#666);font-weight:600}'
    + '.hb6-badge.cat{background:rgba(108,92,231,.12);color:var(--cor,#6c5ce7)}'
    + '.hb6-badge.pausa{background:rgba(253,203,110,.2);color:#b8860b}'
    + '.hb6-acoes{display:flex;gap:.25rem;flex:0 0 auto}'
    + '.hb6-ic{background:none;border:none;cursor:pointer;font-size:.85rem;padding:.2rem;border-radius:6px}'
    + '.hb6-ic:hover{background:var(--bg2,#f0f0f3)}'
    + '.hb6-stats{display:flex;gap:.4rem;margin:.6rem 0 .5rem}'
    + '.hb6-stat{flex:1;background:var(--bg2,#f5f5f7);border-radius:9px;padding:.4rem;text-align:center}'
    + '.hb6-stat b{display:block;font-size:1rem;font-weight:800;color:var(--txt1,#222)}'
    + '.hb6-stat span{font-size:.6rem;color:var(--txt3,#999)}'
    + '.hb6-diaslbl{font-size:.62rem;color:var(--txt3,#999);margin-bottom:.2rem}'
    + '.hb6-dias{display:flex;gap:.28rem}'
    + '.hb6-dia{flex:1;text-align:center;border-radius:8px;padding:.3rem 0;cursor:pointer;border:1px solid var(--borda,#eee);font-size:.6rem;color:var(--txt2,#666);user-select:none}'
    + '.hb6-dia.feito{background:var(--verde,#00b894);border-color:var(--verde,#00b894);color:#fff}'
    + '.hb6-dia.naoagenda{opacity:.35}'
    + '.hb6-dia .hd-i{display:block;font-size:.8rem;margin-top:.1rem}'
    + '.hb6-hist{display:flex;gap:3px;margin-top:.55rem;align-items:flex-end}'
    + '.hb6-hist .hh{flex:1;height:16px;border-radius:3px;background:var(--bg2,#eee)}'
    + '.hb6-hist .hh.on{background:var(--verde,#00b894)}'
    + '.hb6-hist .hh.hoje{outline:2px solid var(--cor,#6c5ce7);outline-offset:1px}'
    + '.hb6-empty{text-align:center;color:var(--txt3,#999);font-size:.82rem;padding:1.4rem .5rem}'
    + '.hb6-cor-sw{width:26px;height:26px;border-radius:50%;border:2px solid transparent;cursor:pointer}'
    + '.hb6-cor-sw.sel{border-color:var(--txt1,#222)}'
    + '.hb6-diaschk{display:flex;flex-wrap:wrap;gap:.3rem}'
    + '.hb6-diachk{padding:.3rem .5rem;border:1px solid var(--borda,#ddd);border-radius:8px;font-size:.72rem;cursor:pointer;user-select:none}'
    + '.hb6-diachk.sel{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}'
    // metas
    + '.mt6-badge{font-size:.62rem;padding:.12rem .45rem;border-radius:20px;font-weight:700;display:inline-flex;align-items:center;gap:.2rem}'
    + '.mt6-b-andamento{background:rgba(9,132,227,.14);color:#0984e3}'
    + '.mt6-b-perto{background:rgba(253,203,110,.22);color:#b8860b}'
    + '.mt6-b-atrasada{background:rgba(214,48,49,.14);color:#d63031}'
    + '.mt6-b-concluida{background:rgba(0,184,148,.16);color:#00997a}'
    + '.mt6-b-pausada{background:rgba(120,120,120,.16);color:#666}'
    + '.mt6-prio{font-size:.62rem;padding:.12rem .45rem;border-radius:20px;font-weight:700}'
    + '.mt6-prio-alta{background:rgba(214,48,49,.14);color:#d63031}'
    + '.mt6-prio-media{background:rgba(253,203,110,.22);color:#b8860b}'
    + '.mt6-prio-baixa{background:rgba(9,132,227,.14);color:#0984e3}'
    + '.mt6-valor{display:flex;align-items:center;gap:.5rem;margin:.5rem 0}'
    + '.mt6-valor button{width:26px;height:26px;border-radius:7px;border:1px solid var(--borda,#ddd);background:var(--bg1,#fff);cursor:pointer;font-size:.95rem;font-weight:700;line-height:1}'
    + '.mt6-valor .mt6-vtxt{font-size:.78rem;color:var(--txt2,#555);font-weight:600}'
    + '.mt6-etapas{margin:.5rem 0 .2rem;display:flex;flex-direction:column;gap:.25rem}'
    + '.mt6-etapa{display:flex;align-items:center;gap:.4rem;font-size:.78rem;cursor:pointer}'
    + '.mt6-etapa .mt6-ck{flex:0 0 auto}'
    + '.mt6-etapa.done span{text-decoration:line-through;color:var(--txt3,#999)}'
    + '.mt6-falta{font-size:.68rem;color:var(--txt2,#666);margin-top:.3rem}'
    + '.mt6-etapabox{border:1px dashed var(--borda,#ddd);border-radius:10px;padding:.55rem;margin-top:.3rem}'
    + '.mt6-etapabox .mt6-erow{display:flex;gap:.35rem;margin-bottom:.4rem}'
    + '.mt6-etapabox input{flex:1}'
    + '.mt6-elista .mt6-eitem{display:flex;align-items:center;gap:.4rem;font-size:.78rem;padding:.15rem 0}'
    + '.mt6-elista .mt6-eitem button{background:none;border:none;cursor:pointer;color:#d63031}'
    + '.mt6-prog-secao{background:var(--bg1,#fff);border:1px solid var(--borda,#eee);border-radius:14px;padding:.85rem;margin-top:1rem}';
    var st = document.createElement('style');
    st.id = 'hbmt6-styles';
    st.textContent = css;
    document.head.appendChild(st);
  } catch (e) {}
}

// ---- HABITOS: dados de apoio ----
var habCategorias = [
  {val:'saude', lbl:'Saúde', icon:'💪', cor:'#00b894'},
  {val:'estudos', lbl:'Estudos', icon:'📚', cor:'#6c5ce7'},
  {val:'produtividade', lbl:'Produtividade', icon:'⚡', cor:'#0984e3'},
  {val:'bemestar', lbl:'Bem-estar', icon:'🧘', cor:'#e84393'},
  {val:'financas', lbl:'Finanças', icon:'💰', cor:'#fdcb6e'},
  {val:'outro', lbl:'Outro', icon:'✨', cor:'#636e72'}
];
var habCores = ['#00b894','#6c5ce7','#0984e3','#e84393','#fdcb6e','#e17055','#00cec9','#636e72'];
var habDiasNomes = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
var habDiasCurto = ['D','S','T','Q','Q','S','S'];

function habCatObj(v) {
  for (var i=0;i<habCategorias.length;i++){ if(habCategorias[i].val===v) return habCategorias[i]; }
  return habCategorias[habCategorias.length-1];
}

// Chave de semana + indice do dia para uma data qualquer (mesma logica de getSemanaKey)
function habKeyDia(d) {
  var onejan = new Date(d.getFullYear(), 0, 1);
  var wk = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return { sk: d.getFullYear() + '-S' + wk, idx: d.getDay() };
}

function habFeitoEm(h, d) {
  var k = habKeyDia(d);
  var arr = h.semanas[k.sk];
  return !!(arr && arr[k.idx]);
}

function habSetEm(h, d, val) {
  var k = habKeyDia(d);
  if (!h.semanas[k.sk]) h.semanas[k.sk] = [false,false,false,false,false,false,false];
  h.semanas[k.sk][k.idx] = !!val;
}

// O habito esta agendado para o dia da semana diaIdx (0=dom)?
function habAgendadoHoje(h, diaIdx) {
  if (!h) return true;
  if (h.freq === 'dias') return (h.dias || []).indexOf(diaIdx) !== -1;
  return true; // diario ou xsemana: todo dia conta
}

// Melhor streak historico (maior sequencia de dias consecutivos concluidos)
function habMelhorStreak(h) {
  var melhor = 0, atual = 0;
  var d = new Date();
  for (var i = 0; i < 400; i++) {
    if (habFeitoEm(h, d)) { atual++; if (atual > melhor) melhor = atual; }
    else { atual = 0; }
    d.setDate(d.getDate() - 1);
  }
  if ((h.melhorStreak || 0) > melhor) melhor = h.melhorStreak;
  return melhor;
}

// % de conclusao nos ultimos 30 dias (apenas dias agendados)
function habPercentual(h) {
  var agendados = 0, feitos = 0;
  var d = new Date();
  for (var i = 0; i < 30; i++) {
    if (habAgendadoHoje(h, d.getDay())) {
      agendados++;
      if (habFeitoEm(h, d)) feitos++;
    }
    d.setDate(d.getDate() - 1);
  }
  if (!agendados) return 0;
  return Math.round(feitos / agendados * 100);
}

// Historico dos ultimos n dias (mais antigo -> hoje)
function habHistorico(h, n) {
  var out = [];
  var d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (var i = 0; i < n; i++) {
    out.push({
      done: habFeitoEm(h, d),
      agenda: habAgendadoHoje(h, d.getDay()),
      hoje: (d.toDateString() === new Date().toDateString())
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Atualiza melhorStreak persistido apos alteracoes
function habAtualizaMelhor(h) {
  var m = habMelhorStreak(h);
  if (m > (h.melhorStreak || 0)) h.melhorStreak = m;
}

// ---- HABITOS: modal completo + UI injetada ----
var hb6EditId = null;
var hb6CorSel = '#00b894';
var hb6DiasSel = [1,2,3,4,5];
var _hb6UiOk = false;

function habEnsureUI() {
  hbmtEnsureStyles();
  // Botao "Novo habito completo" na pagina de habitos
  try {
    var grid = document.getElementById('habitosGrid');
    if (grid && !document.getElementById('hb6Topbar')) {
      var bar = document.createElement('div');
      bar.id = 'hb6Topbar';
      bar.className = 'hb6-topbar';
      bar.innerHTML = '<div style="font-size:.72rem;color:var(--txt3,#999)">Toque nos dias para marcar. Use o botão para hábitos detalhados.</div>'
        + '<button class="hb6-nova" onclick="abrirHabitoModal()">＋ Novo hábito</button>';
      grid.parentNode.insertBefore(bar, grid);
    }
  } catch (e) {}
  if (_hb6UiOk) return;
  _hb6UiOk = true;
  try {
    var opCats = habCategorias.map(function(c){ return '<option value="'+c.val+'">'+c.icon+' '+c.lbl+'</option>'; }).join('');
    var chips = habDiasNomes.map(function(n,i){ return '<div class="hb6-diachk" data-d="'+i+'" onclick="hb6ToggleDia('+i+')">'+n+'</div>'; }).join('');
    var sw = habCores.map(function(c){ return '<div class="hb6-cor-sw" data-c="'+c+'" style="background:'+c+'" onclick="hb6SelCor(\''+c+'\')"></div>'; }).join('');
    var html = '<div class="tk-modal" onclick="event.stopPropagation()">'
      + '<div class="tk-modal-head"><h3 id="hb6Title">🔥 Novo hábito</h3><button class="tk-modal-x" onclick="fecharHabitoModal()">✕</button></div>'
      + '<div class="tk-modal-body">'
      + '<div class="tk-adv-grid">'
      + '<div class="tk-field" style="flex:1"><label class="tk-lbl">✨ Nome *</label><input class="campo" id="hb6Nome" placeholder="Ex: Beber 2L de água"></div>'
      + '<div class="tk-field" style="width:70px"><label class="tk-lbl">Emoji</label><input class="campo" id="hb6Emoji" maxlength="2" placeholder="💧"></div>'
      + '</div>'
      + '<div class="tk-field"><label class="tk-lbl">📂 Categoria</label><select class="campo" id="hb6Cat">'+opCats+'</select></div>'
      + '<div class="tk-field"><label class="tk-lbl">📝 Descrição / motivação</label><textarea class="campo tk-ta" id="hb6Desc" rows="2" placeholder="Por que este hábito importa?"></textarea></div>'
      + '<div class="tk-field"><label class="tk-lbl">🔁 Frequência</label><select class="campo" id="hb6Freq" onchange="hb6FreqChange()">'
      + '<option value="diario">Todos os dias</option><option value="dias">Dias específicos</option><option value="xsemana">X vezes por semana</option></select></div>'
      + '<div class="tk-field" id="hb6DiasWrap" style="display:none"><label class="tk-lbl">Dias da semana</label><div class="hb6-diaschk">'+chips+'</div></div>'
      + '<div class="tk-field" id="hb6MetaWrap" style="display:none"><label class="tk-lbl">Meta por semana</label><input class="campo" id="hb6MetaSem" type="number" min="1" max="7" value="3" style="width:90px"></div>'
      + '<div class="tk-adv-grid">'
      + '<div class="tk-field" style="flex:1"><label class="tk-lbl">🎯 Objetivo (opcional)</label><input class="campo" id="hb6Obj" placeholder="Ex: 8 copos"></div>'
      + '<div class="tk-field" style="width:120px"><label class="tk-lbl">⏰ Horário</label><input class="campo" id="hb6Hora" type="time"></div>'
      + '</div>'
      + '<div class="tk-field"><label class="tk-lbl">🎨 Cor</label><div id="hb6CorBox" style="display:flex;gap:.4rem;flex-wrap:wrap">'+sw+'</div></div>'
      + '</div>'
      + '<div class="tk-modal-foot"><button class="btn btn-s" onclick="fecharHabitoModal()">Cancelar</button><button class="btn btn-p" onclick="salvarHabitoModal()">💾 Salvar</button></div>'
      + '</div>';
    var bg = document.createElement('div');
    bg.className = 'tk-modal-bg';
    bg.id = 'hb6Modal';
    bg.setAttribute('role','dialog');
    bg.onclick = function(e){ fecharHabitoModal(e); };
    bg.innerHTML = html;
    document.body.appendChild(bg);
  } catch (e) {}
}

function hb6FreqChange() {
  var f = document.getElementById('hb6Freq').value;
  document.getElementById('hb6DiasWrap').style.display = (f === 'dias') ? 'block' : 'none';
  document.getElementById('hb6MetaWrap').style.display = (f === 'xsemana') ? 'block' : 'none';
}

function hb6SelCor(c) {
  hb6CorSel = c;
  var box = document.getElementById('hb6CorBox');
  if (box) box.querySelectorAll('.hb6-cor-sw').forEach(function(s){ s.classList.toggle('sel', s.getAttribute('data-c') === c); });
}

function hb6ToggleDia(i) {
  var p = hb6DiasSel.indexOf(i);
  if (p === -1) hb6DiasSel.push(i); else hb6DiasSel.splice(p, 1);
  hb6RenderDiasSel();
}

function hb6RenderDiasSel() {
  var wrap = document.getElementById('hb6DiasWrap');
  if (!wrap) return;
  wrap.querySelectorAll('.hb6-diachk').forEach(function(el){
    el.classList.toggle('sel', hb6DiasSel.indexOf(parseInt(el.getAttribute('data-d'),10)) !== -1);
  });
}

function abrirHabitoModal(id) {
  habEnsureUI();
  hb6EditId = id || null;
  var t = document.getElementById('hb6Title');
  if (hb6EditId) {
    var h = estado.habitos.find(function(x){ return x.id === hb6EditId; });
    if (!h) return;
    t.textContent = '✏️ Editar hábito';
    document.getElementById('hb6Nome').value = h.nome || '';
    document.getElementById('hb6Emoji').value = h.emoji || '';
    document.getElementById('hb6Cat').value = h.categoria || 'saude';
    document.getElementById('hb6Desc').value = h.descricao || '';
    document.getElementById('hb6Freq').value = h.freq || 'diario';
    document.getElementById('hb6Obj').value = h.objetivo || '';
    document.getElementById('hb6Hora').value = h.horario || '';
    document.getElementById('hb6MetaSem').value = h.metaSemana || 3;
    hb6DiasSel = Array.isArray(h.dias) ? h.dias.slice() : [1,2,3,4,5];
    hb6SelCor(h.cor || '#00b894');
  } else {
    t.textContent = '🔥 Novo hábito';
    document.getElementById('hb6Nome').value = '';
    document.getElementById('hb6Emoji').value = '';
    document.getElementById('hb6Cat').value = 'saude';
    document.getElementById('hb6Desc').value = '';
    document.getElementById('hb6Freq').value = 'diario';
    document.getElementById('hb6Obj').value = '';
    document.getElementById('hb6Hora').value = '';
    document.getElementById('hb6MetaSem').value = 3;
    hb6DiasSel = [1,2,3,4,5];
    hb6SelCor('#00b894');
  }
  hb6FreqChange();
  hb6RenderDiasSel();
  document.getElementById('hb6Modal').classList.add('visivel');
}

function fecharHabitoModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var m = document.getElementById('hb6Modal');
  if (m) m.classList.remove('visivel');
  hb6EditId = null;
}

function salvarHabitoModal() {
  var nome = document.getElementById('hb6Nome').value.trim();
  if (!nome) { document.getElementById('hb6Nome').focus(); return; }
  var cat = document.getElementById('hb6Cat').value;
  var emoji = document.getElementById('hb6Emoji').value.trim() || habCatObj(cat).icon;
  var desc = document.getElementById('hb6Desc').value.trim();
  var freq = document.getElementById('hb6Freq').value;
  var obj = document.getElementById('hb6Obj').value.trim();
  var hora = document.getElementById('hb6Hora').value;
  var metaSem = parseInt(document.getElementById('hb6MetaSem').value, 10) || 3;
  var dias = (freq === 'dias') ? hb6DiasSel.slice().sort() : [0,1,2,3,4,5,6];
  if (freq === 'dias' && !dias.length) { dias = [0,1,2,3,4,5,6]; }
  if (hb6EditId) {
    var h = estado.habitos.find(function(x){ return x.id === hb6EditId; });
    if (h) {
      h.nome = nome; h.emoji = emoji; h.categoria = cat; h.descricao = desc;
      h.freq = freq; h.dias = dias; h.metaSemana = metaSem; h.objetivo = obj;
      h.horario = hora; h.cor = hb6CorSel;
    }
  } else {
    estado.habitos.push({
      id: uid(), nome: nome, emoji: emoji, categoria: cat, descricao: desc,
      freq: freq, dias: dias, metaSemana: metaSem, objetivo: obj, horario: hora,
      cor: hb6CorSel, ativo: true, melhorStreak: 0, criado: hojeStr(), semanas: {}
    });
  }
  fecharHabitoModal();
  salvarEstado();
  renderHabitos();
  atualizarDashboardSeVisivel();
  registrarUsoPlus();
}

function editarHabito(id) { abrirHabitoModal(id); }

function toggleHabitoAtivo(id) {
  var h = estado.habitos.find(function(x){ return x.id === id; });
  if (!h) return;
  h.ativo = (h.ativo === false);
  salvarEstado();
  renderHabitos();
  atualizarDashboardSeVisivel();
}

function habConcluirHoje(id) {
  var h = estado.habitos.find(function(x){ return x.id === id; });
  if (!h) return;
  var hoje = new Date();
  habSetEm(h, hoje, !habFeitoEm(h, hoje));
  habAtualizaMelhor(h);
  salvarEstado();
  renderHabitos();
  atualizarDashboardSeVisivel();
  registrarUsoPlus();
}

function metaDiasAte(dataStr) {
  if (!dataStr) return 9999;
  return Math.ceil((new Date(dataStr + 'T12:00:00') - new Date()) / 86400000);
}

// Sobrescreve o cadastro rapido preservando os novos campos padrao
function addHabito() {
  var inp = document.getElementById('habitoInput');
  var nome = inp ? inp.value.trim() : '';
  if (!nome) return;
  var emEl = document.getElementById('habitoEmoji');
  var emoji = (emEl && emEl.value.trim()) || '✨';
  estado.habitos.push({
    id: uid(), nome: nome, emoji: emoji, categoria: 'saude', descricao: '',
    freq: 'diario', dias: [0,1,2,3,4,5,6], metaSemana: 7, objetivo: '', horario: '',
    cor: '#00b894', ativo: true, melhorStreak: 0, criado: hojeStr(), semanas: {}
  });
  if (inp) inp.value = '';
  if (emEl) emEl.value = '';
  salvarEstado(); renderHabitos(); atualizarDashboardSeVisivel();
  registrarUsoPlus();
}

function delHabito(id) {
  var h = estado.habitos.find(function(x){ return x.id === id; });
  var msg = h ? 'Excluir o hábito "' + h.nome + '"? O histórico será perdido.' : 'Excluir este hábito?';
  confirmar(msg, function(){
    estado.habitos = estado.habitos.filter(function(x){ return x.id !== id; });
    salvarEstado(); renderHabitos(); atualizarDashboardSeVisivel();
  });
}

function toggleHabitoDia(hid, diaIdx) {
  var h = estado.habitos.find(function(x){ return x.id === hid; });
  if (!h) return;
  var sk = getSemanaKey();
  if (!h.semanas[sk]) h.semanas[sk] = [false,false,false,false,false,false,false];
  h.semanas[sk][diaIdx] = !h.semanas[sk][diaIdx];
  habAtualizaMelhor(h);
  salvarEstado(); renderHabitos(); atualizarDashboardSeVisivel();
  registrarUsoPlus();
}

function habFreqLabel(h) {
  if (h.freq === 'dias') {
    var ns = (h.dias || []).slice().sort().map(function(i){ return habDiasCurto[i]; });
    return 'Dias: ' + (ns.length ? ns.join(' ') : '—');
  }
  if (h.freq === 'xsemana') return (h.metaSemana || 3) + 'x por semana';
  return 'Todos os dias';
}

function renderHabitos() {
  habEnsureUI();
  var sk = getSemanaKey();
  var hoje = new Date();
  var arrHab = estado.habitos.slice().sort(function(a,b){
    var aa = (a.ativo === false) ? 1 : 0, bb = (b.ativo === false) ? 1 : 0;
    return aa - bb;
  });
  var html = '';
  arrHab.forEach(function(h) {
    var streak = calcularStreak(h);
    var melhor = habMelhorStreak(h);
    var pct = habPercentual(h);
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    var pausado = (h.ativo === false);
    var cor = h.cor || '#00b894';
    var cat = habCatObj(h.categoria);
    html += '<div class="hb6-card' + (pausado ? ' pausado' : '') + '" data-busca-id="' + h.id + '">';
    html += '<div class="hb6-head">';
    html += '<div class="hb6-emoji" style="background:' + cor + '22">' + (h.emoji || '✨') + '</div>';
    html += '<div class="hb6-hbody">';
    html += '<div class="hb6-nome">' + esc(h.nome);
    html += ' <span class="hb6-badge cat">' + cat.icon + ' ' + cat.lbl + '</span>';
    if (pausado) html += ' <span class="hb6-badge pausa">⏸ pausado</span>';
    html += '</div>';
    html += '<div class="hb6-sub">' + habFreqLabel(h) + (h.horario ? ' · ⏰ ' + esc(h.horario) : '') + (h.objetivo ? ' · 🎯 ' + esc(h.objetivo) : '') + '</div>';
    html += '</div>';
    html += '<div class="hb6-acoes">';
    html += '<button class="hb6-ic" onclick="editarHabito(\'' + h.id + '\')" title="Editar">✏️</button>';
    html += '<button class="hb6-ic" onclick="toggleHabitoAtivo(\'' + h.id + '\')" title="' + (pausado ? 'Reativar' : 'Pausar') + '">' + (pausado ? '▶️' : '⏸️') + '</button>';
    html += '<button class="hb6-ic" onclick="delHabito(\'' + h.id + '\')" title="Excluir">🗑️</button>';
    html += '</div>';
    html += '</div>';
    if (h.descricao) html += '<div class="hb6-sub" style="margin-top:.4rem">' + esc(h.descricao) + '</div>';
    html += '<div class="hb6-stats">';
    html += '<div class="hb6-stat"><b>🔥 ' + streak + '</b><span>sequência</span></div>';
    html += '<div class="hb6-stat"><b>🏆 ' + melhor + '</b><span>melhor</span></div>';
    html += '<div class="hb6-stat"><b>' + pct + '%</b><span>30 dias</span></div>';
    html += '</div>';
    html += '<div class="hb6-diaslbl">Esta semana</div>';
    html += '<div class="hb6-dias">';
    for (var i = 0; i < 7; i++) {
      var agenda = habAgendadoHoje(h, i);
      html += '<div class="hb6-dia' + (arr[i] ? ' feito' : '') + (agenda ? '' : ' naoagenda') + '" onclick="toggleHabitoDia(\'' + h.id + '\',' + i + ')">' + habDiasCurto[i] + '<span class="hd-i">' + (arr[i] ? '✅' : '⬜') + '</span></div>';
    }
    html += '</div>';
    var hist = habHistorico(h, 14);
    html += '<div class="hb6-diaslbl" style="margin-top:.55rem">Últimos 14 dias</div>';
    html += '<div class="hb6-hist">';
    hist.forEach(function(d){
      html += '<div class="hh' + (d.done ? ' on' : '') + (d.hoje ? ' hoje' : '') + '" style="' + (d.done ? 'background:' + cor : '') + '"></div>';
    });
    html += '</div>';
    html += '</div>';
  });
  if (!html) {
    html = '<div class="hb6-empty">Nenhum hábito ainda.<br>Crie seu primeiro hábito e comece a construir sua sequência! 🔥<br><br><button class="hb6-nova" onclick="abrirHabitoModal()">＋ Criar hábito</button></div>';
  }
  var grid = document.getElementById('habitosGrid');
  if (grid) grid.innerHTML = html;
}

// ============================================================
// METAS: helpers de progresso / situacao
// ============================================================
function metaProgresso(m) {
  if (!m) return 0;
  if (Array.isArray(m.etapas) && m.etapas.length) {
    var done = 0;
    m.etapas.forEach(function(e){ if (e.feito) done++; });
    return Math.round(done / m.etapas.length * 100);
  }
  if (m.alvo && m.alvo > 0) {
    return Math.min(100, Math.round((m.valorAtual || 0) / m.alvo * 100));
  }
  return m.progresso || 0;
}

function metaSituacao(m) {
  if (m.feito) return {txt:'Concluída', cls:'mt6-b-concluida', icon:'✅'};
  if (m.pausada) return {txt:'Pausada', cls:'mt6-b-pausada', icon:'⏸'};
  if (m.prazo) {
    var d = metaDiasAte(m.prazo);
    if (d < 0) return {txt:'Atrasada', cls:'mt6-b-atrasada', icon:'⏰'};
    if (d <= 3) return {txt:(d === 0 ? 'Vence hoje' : d === 1 ? 'Vence amanhã' : 'Faltam ' + d + ' dias'), cls:'mt6-b-perto', icon:'⚠️'};
  }
  return {txt:'Em andamento', cls:'mt6-b-andamento', icon:'🚀'};
}

function metaFaltaTxt(m) {
  if (m.feito) return 'Concluída 🎉';
  if (m.alvo && m.alvo > 0) {
    var falta = m.alvo - (m.valorAtual || 0);
    if (falta <= 0) return 'Meta numérica atingida!';
    return 'Faltam ' + falta + (m.unidade ? ' ' + m.unidade : '') + ' para o objetivo';
  }
  if (Array.isArray(m.etapas) && m.etapas.length) {
    var rest = m.etapas.filter(function(e){ return !e.feito; }).length;
    return rest ? ('Faltam ' + rest + ' etapa(s)') : 'Todas as etapas concluídas!';
  }
  var p = metaProgresso(m);
  return 'Faltam ' + (100 - p) + '% para concluir';
}

// Recalcula progresso derivado e auto-conclui/reabre conforme o caso
function metaRecalcAuto(m) {
  var p = metaProgresso(m);
  m.progresso = p;
  if (p >= 100 && !m.feito) {
    registrarConclusaoMeta(m);
    mostrarCelebracaoMeta();
  } else if (p < 100 && m.feito) {
    m.feito = false;
    m.concluidaData = '';
    if (m.xp > 0) { estado.metasXpTotal = Math.max(0, (estado.metasXpTotal || 0) - m.xp); m.xp = 0; }
  }
}

// Ordem de exibicao por situacao
function metaOrdemPeso(m) {
  if (m.feito) return 5;
  if (m.pausada) return 4;
  if (m.prazo) {
    var d = metaDiasAte(m.prazo);
    if (d < 0) return 0;      // atrasada primeiro
    if (d <= 3) return 1;     // perto do prazo
  }
  return 2;                   // em andamento
}

// ---- METAS: campos extras no modal (injetados 1x) + etapas ----
var metaEtapasTmp = [];

function metaEnsureCampos() {
  var modal = document.getElementById('metaModal');
  if (!modal) return;
  if (document.getElementById('metaModPrio')) return;
  var body = modal.querySelector('.tk-modal-body');
  if (!body) return;
  var wrap = document.createElement('div');
  wrap.innerHTML = ''
    + '<div class="tk-adv-grid">'
    + '<div class="tk-field" style="flex:1"><label class="tk-lbl">🚩 Prioridade</label><select class="campo" id="metaModPrio">'
    + '<option value="baixa">🔵 Baixa</option><option value="media" selected>🟡 Média</option><option value="alta">🔴 Alta</option></select></div>'
    + '</div>'
    + '<div class="tk-field"><label class="tk-lbl">📊 Meta numérica (opcional)</label>'
    + '<div class="tk-adv-grid">'
    + '<input class="campo" id="metaModAlvo" type="number" min="0" placeholder="Alvo (ex: 10)" style="flex:1" oninput="metaModToggleProg()">'
    + '<input class="campo" id="metaModValor" type="number" min="0" placeholder="Atual" style="width:90px">'
    + '<input class="campo" id="metaModUnid" placeholder="unidade" style="width:110px">'
    + '</div>'
    + '<div style="font-size:.66rem;color:var(--txt3,#999);margin-top:.2rem">Se preenchida, o progresso é calculado automaticamente (atual/alvo).</div></div>'
    + '<div class="tk-field"><label class="tk-lbl">✅ Etapas (subtarefas)</label>'
    + '<div class="mt6-etapabox"><div class="mt6-erow"><input class="campo" id="metaEtapaInput" placeholder="Nova etapa..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();metaEtapaAdd();}"><button type="button" class="btn btn-s" onclick="metaEtapaAdd()">＋</button></div><div class="mt6-elista" id="metaEtapasLista"></div></div>'
    + '<div style="font-size:.66rem;color:var(--txt3,#999);margin-top:.2rem">Com etapas, o progresso vem das etapas concluídas.</div></div>';
  body.appendChild(wrap);
}

// Mostra/esconde o slider manual conforme meta numerica/etapas
function metaModToggleProg() {
  var alvo = parseFloat((document.getElementById('metaModAlvo') || {}).value) || 0;
  var temEtapas = metaEtapasTmp.length > 0;
  var slider = document.getElementById('metaModProgresso');
  if (!slider) return;
  var field = slider.closest('.tk-field');
  if (field) field.style.display = (alvo > 0 || temEtapas) ? 'none' : 'block';
}

function metaEtapaAdd() {
  var inp = document.getElementById('metaEtapaInput');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  metaEtapasTmp.push({id: uid(), texto: txt, feito: false});
  if (inp) inp.value = '';
  metaEtapasRenderTmp();
  metaModToggleProg();
}

function metaEtapaDelTmp(eid) {
  metaEtapasTmp = metaEtapasTmp.filter(function(e){ return e.id !== eid; });
  metaEtapasRenderTmp();
  metaModToggleProg();
}

function metaEtapaToggleTmp(eid) {
  metaEtapasTmp.forEach(function(e){ if (e.id === eid) e.feito = !e.feito; });
  metaEtapasRenderTmp();
}

function metaEtapasRenderTmp() {
  var el = document.getElementById('metaEtapasLista');
  if (!el) return;
  var html = '';
  metaEtapasTmp.forEach(function(e){
    html += '<div class="mt6-eitem"><input type="checkbox" ' + (e.feito ? 'checked' : '') + ' onclick="metaEtapaToggleTmp(\'' + e.id + '\')"><span style="flex:1;' + (e.feito ? 'text-decoration:line-through;color:var(--txt3,#999)' : '') + '">' + esc(e.texto) + '</span><button type="button" onclick="metaEtapaDelTmp(\'' + e.id + '\')">✕</button></div>';
  });
  el.innerHTML = html;
}

function abrirMetaModal(id) {
  metaEnsureCampos();
  metaEditId = id || null;
  var modal = document.getElementById('metaModal');
  var title = document.getElementById('metaModalTitle');
  var setVal = function(elId, v){ var e = document.getElementById(elId); if (e) e.value = v; };
  if (metaEditId) {
    var m = estado.metas.find(function(x){ return x.id === metaEditId; });
    if (!m) return;
    title.textContent = '✏️ Editar meta';
    setVal('metaModTexto', m.texto || '');
    setVal('metaModDesc', m.descricao || '');
    setVal('metaModPrazo', m.prazo || '');
    setVal('metaModCategoria', m.categoria || 'pessoal');
    setVal('metaModProgresso', m.progresso || 0);
    document.getElementById('metaModProgressoVal').textContent = (m.progresso || 0) + '%';
    setVal('metaModPrio', m.prioridade || 'media');
    setVal('metaModAlvo', m.alvo || '');
    setVal('metaModValor', m.valorAtual || '');
    setVal('metaModUnid', m.unidade || '');
    metaEtapasTmp = Array.isArray(m.etapas) ? m.etapas.map(function(e){ return {id:e.id, texto:e.texto, feito:!!e.feito}; }) : [];
  } else {
    title.textContent = '🎯 Nova meta';
    setVal('metaModTexto', '');
    setVal('metaModDesc', '');
    setVal('metaModPrazo', '');
    setVal('metaModCategoria', 'pessoal');
    setVal('metaModProgresso', 0);
    document.getElementById('metaModProgressoVal').textContent = '0%';
    setVal('metaModPrio', 'media');
    setVal('metaModAlvo', '');
    setVal('metaModValor', '');
    setVal('metaModUnid', '');
    metaEtapasTmp = [];
  }
  metaEtapasRenderTmp();
  metaModToggleProg();
  modal.classList.add('visivel');
}

function salvarMetaModal() {
  var texto = document.getElementById('metaModTexto').value.trim();
  if (!texto) return;
  var desc = document.getElementById('metaModDesc').value.trim();
  var prazo = document.getElementById('metaModPrazo').value;
  var cat = document.getElementById('metaModCategoria').value;
  var prio = (document.getElementById('metaModPrio') || {}).value || 'media';
  var alvo = parseFloat((document.getElementById('metaModAlvo') || {}).value) || 0;
  var valor = parseFloat((document.getElementById('metaModValor') || {}).value) || 0;
  var unid = ((document.getElementById('metaModUnid') || {}).value || '').trim();
  var etapas = metaEtapasTmp.map(function(e){ return {id:e.id, texto:e.texto, feito:!!e.feito}; });
  if (alvo < 0) alvo = 0;
  if (valor < 0) valor = 0;
  // progresso derivado
  var prog;
  if (etapas.length) {
    var done = etapas.filter(function(e){ return e.feito; }).length;
    prog = Math.round(done / etapas.length * 100);
  } else if (alvo > 0) {
    prog = Math.min(100, Math.round(valor / alvo * 100));
  } else {
    prog = parseInt(document.getElementById('metaModProgresso').value, 10) || 0;
  }
  if (prog < 0) prog = 0; if (prog > 100) prog = 100;

  if (metaEditId) {
    var m = estado.metas.find(function(x){ return x.id === metaEditId; });
    if (m) {
      m.texto = texto; m.descricao = desc; m.prazo = prazo; m.categoria = cat;
      m.prioridade = prio; m.alvo = alvo; m.valorAtual = valor; m.unidade = unid;
      m.etapas = etapas; m.progresso = prog;
      if (prog === 100 && !m.feito) { registrarConclusaoMeta(m); mostrarCelebracaoMeta(); }
      else if (prog < 100 && m.feito) { m.feito = false; m.concluidaData = ''; if (m.xp>0){ estado.metasXpTotal=Math.max(0,(estado.metasXpTotal||0)-m.xp); m.xp=0; } }
    }
  } else {
    var nova = {
      id: uid(), texto: texto, descricao: desc, prazo: prazo, categoria: cat,
      progresso: prog, feito: prog === 100, criada: hojeStr(),
      concluidaData: prog === 100 ? hojeStr() : '', xp: 0,
      prioridade: prio, alvo: alvo, valorAtual: valor, unidade: unid, etapas: etapas, pausada: false
    };
    if (nova.feito) { nova.xp = calcularXPMeta(nova); estado.metasXpTotal = (estado.metasXpTotal || 0) + nova.xp; }
    estado.metas.push(nova);
  }
  document.getElementById('metaModal').classList.remove('visivel');
  metaEditId = null;
  salvarEstado();
  renderMetas();
  atualizarDashboardSeVisivel();
}

function pausarMeta(id) {
  var m = estado.metas.find(function(x){ return x.id === id; });
  if (!m) return;
  m.pausada = !m.pausada;
  salvarEstado(); renderMetas(); atualizarDashboardSeVisivel();
}

function metaAjustarValor(id, delta) {
  var m = estado.metas.find(function(x){ return x.id === id; });
  if (!m || !m.alvo) return;
  m.valorAtual = Math.max(0, Math.min(m.alvo, (m.valorAtual || 0) + delta));
  metaRecalcAuto(m);
  salvarEstado(); renderMetas(); atualizarDashboardSeVisivel();
}

function metaEtapaCardToggle(id, eid) {
  var m = estado.metas.find(function(x){ return x.id === id; });
  if (!m || !Array.isArray(m.etapas)) return;
  m.etapas.forEach(function(e){ if (e.id === eid) e.feito = !e.feito; });
  metaRecalcAuto(m);
  salvarEstado(); renderMetas(); atualizarDashboardSeVisivel();
}

function renderMetaCards() {
  var lista = estado.metas.slice();
  if (metaFiltroAtivo === 'ativas') lista = lista.filter(function(m){ return !m.feito && !m.pausada; });
  else if (metaFiltroAtivo === 'concluidas') lista = lista.filter(function(m){ return m.feito; });
  lista.sort(function(a, b){
    var pa = metaOrdemPeso(a), pb = metaOrdemPeso(b);
    if (pa !== pb) return pa - pb;
    var xa = a.prazo || '9999-99-99', xb = b.prazo || '9999-99-99';
    return xa.localeCompare(xb);
  });
  var prioLbl = {alta:'🔴 Alta', media:'🟡 Média', baixa:'🔵 Baixa'};
  var html = '';
  lista.forEach(function(m){
    var catObj = metaCategorias.find(function(c){ return c.val === m.categoria; }) || {lbl:'Outro', icon:'📌'};
    var prazoTxt = m.prazo ? dataLocal(m.prazo) : 'Sem prazo';
    var sit = metaSituacao(m);
    var atrasada = !m.feito && !m.pausada && m.prazo && metaDiasAte(m.prazo) < 0;
    var pct = metaProgresso(m);
    var prio = m.prioridade || 'media';

    html += '<div class="meta-card' + (m.feito ? ' meta-concluida' : '') + (atrasada ? ' meta-atrasada' : '') + (m.pausada ? ' meta-pausada' : '') + '" data-busca-id="' + m.id + '">';
    html += '<div class="meta-card-top">';
    html += '<button class="meta-check' + (m.feito ? ' feito' : '') + '" onclick="toggleMetaConclusao(\'' + m.id + '\')" title="' + (m.feito ? 'Desmarcar' : 'Concluir') + '">' + (m.feito ? '✅' : '⬜') + '</button>';
    html += '<div class="meta-card-info">';
    html += '<span class="meta-nome">' + esc(m.texto) + '</span>';
    html += '<span style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.2rem">';
    html += '<span class="meta-cat-badge">' + catObj.icon + ' ' + catObj.lbl + '</span>';
    html += '<span class="mt6-prio mt6-prio-' + prio + '">' + (prioLbl[prio] || prioLbl.media) + '</span>';
    html += '<span class="mt6-badge ' + sit.cls + '">' + sit.icon + ' ' + sit.txt + '</span>';
    html += '</span>';
    html += '</div>';
    html += '<div class="meta-card-acoes">';
    html += '<button class="btn btn-s meta-btn-icon" onclick="pausarMeta(\'' + m.id + '\')" title="' + (m.pausada ? 'Retomar' : 'Pausar') + '">' + (m.pausada ? '▶️' : '⏸️') + '</button>';
    html += '<button class="btn btn-s meta-btn-icon" onclick="abrirMetaModal(\'' + m.id + '\')" title="Editar">✏️</button>';
    html += '<button class="btn btn-s meta-btn-icon" onclick="delMeta(\'' + m.id + '\')" title="Excluir">🗑️</button>';
    html += '</div>';
    html += '</div>';

    if (m.descricao) html += '<div class="meta-desc">' + esc(m.descricao) + '</div>';

    html += '<div class="meta-card-mid">';
    html += '<div class="meta-barra"><div class="meta-progresso" style="width:' + pct + '%"></div></div>';
    html += '<div class="meta-progress-label">' + pct + '%</div>';
    html += '</div>';

    // Controle de meta numerica
    if (m.alvo && m.alvo > 0) {
      html += '<div class="mt6-valor">';
      html += '<button onclick="metaAjustarValor(\'' + m.id + '\',-1)" ' + (m.feito ? 'disabled' : '') + '>−</button>';
      html += '<span class="mt6-vtxt">' + (m.valorAtual || 0) + ' / ' + m.alvo + (m.unidade ? ' ' + esc(m.unidade) : '') + '</span>';
      html += '<button onclick="metaAjustarValor(\'' + m.id + '\',1)" ' + (m.feito ? 'disabled' : '') + '>+</button>';
      html += '</div>';
    }

    // Etapas
    if (Array.isArray(m.etapas) && m.etapas.length) {
      html += '<div class="mt6-etapas">';
      m.etapas.forEach(function(e){
        html += '<label class="mt6-etapa' + (e.feito ? ' done' : '') + '"><input class="mt6-ck" type="checkbox" ' + (e.feito ? 'checked' : '') + ' onclick="metaEtapaCardToggle(\'' + m.id + '\',\'' + e.id + '\')"><span>' + esc(e.texto) + '</span></label>';
      });
      html += '</div>';
    }

    // Slider manual apenas quando nao ha meta numerica nem etapas
    if (!m.feito && !(m.alvo && m.alvo > 0) && !(Array.isArray(m.etapas) && m.etapas.length)) {
      html += '<div class="meta-slider-row"><input type="range" min="0" max="100" step="5" value="' + pct + '" class="meta-slider" data-meta-id="' + m.id + '" onchange="atualizarProgressoMeta(\'' + m.id + '\', this.value)" oninput="metaSliderInput(this)" title="Ajustar progresso"></div>';
    }

    html += '<div class="mt6-falta">' + metaFaltaTxt(m) + '</div>';

    html += '<div class="meta-card-foot">';
    html += '<span class="meta-prazo' + (atrasada ? ' atrasada' : '') + '">📅 ' + prazoTxt + '</span>';
    if (m.xp > 0) html += '<span class="meta-xp-badge">⭐ +' + m.xp + ' XP</span>';
    html += '</div>';

    html += '</div>';
  });

  if (!html) {
    var emptyMsg = metaFiltroAtivo === 'ativas' ? 'Nenhuma meta ativa. Crie uma nova meta! 🎯' : metaFiltroAtivo === 'concluidas' ? 'Nenhuma meta concluída ainda. Continue firme! 💪' : 'Nenhuma meta adicionada. Comece definindo um objetivo! 🌟';
    html = '<div class="meta-empty">' + emptyMsg + '</div>';
  }
  var listaEl = document.getElementById('metasLista');
  if (listaEl) listaEl.innerHTML = html;

  var encEl = document.getElementById('metaEncorajamento');
  if (encEl && estado.metas.some(function(m){ return !m.feito && !m.pausada && metaProgresso(m) > 0 && metaProgresso(m) < 100; })) {
    encEl.textContent = metaEncorajamentos[Math.floor(Math.random() * metaEncorajamentos.length)];
    encEl.style.display = 'block';
  } else if (encEl) {
    encEl.style.display = 'none';
  }
}

// ---- PROGRESSO: secao de Metas integrada ----
function metaRenderProgressoExtra() {
  var cont = document.getElementById('progressoConteudo');
  if (!cont) return;
  var metas = estado.metas || [];
  var ativas = metas.filter(function(m){ return !m.feito && !m.pausada; });
  var concluidas = metas.filter(function(m){ return m.feito; });
  var pausadas = metas.filter(function(m){ return m.pausada && !m.feito; });
  var atrasadas = ativas.filter(function(m){ return m.prazo && metaDiasAte(m.prazo) < 0; });
  var mediaProg = ativas.length ? Math.round(ativas.reduce(function(a,m){ return a + metaProgresso(m); }, 0) / ativas.length) : 0;

  var h = '<div class="mt6-prog-secao">';
  h += '<div class="prog-secao-titulo" style="font-weight:800;margin-bottom:.6rem">🎯 Metas</div>';
  h += '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.7rem">';
  h += metaProgCard('🔥', ativas.length, 'Ativas');
  h += metaProgCard('✅', concluidas.length, 'Concluídas');
  h += metaProgCard('⏰', atrasadas.length, 'Atrasadas');
  if (pausadas.length) h += metaProgCard('⏸', pausadas.length, 'Pausadas');
  h += '</div>';
  h += '<div class="prog-barra-geral"><div class="prog-barra-info"><span>Progresso médio das metas ativas</span><span>' + mediaProg + '%</span></div>';
  h += '<div class="prog-barra-track"><div class="prog-barra-fill" style="width:' + mediaProg + '%;background:#a29bfe"></div></div></div>';

  var prox = ativas.filter(function(m){ return m.prazo; }).sort(function(a,b){ return a.prazo.localeCompare(b.prazo); }).slice(0, 5);
  if (prox.length) {
    h += '<div style="margin-top:.7rem">';
    prox.forEach(function(m){
      var d = metaDiasAte(m.prazo);
      var badge = d < 0 ? 'Atrasada' : d === 0 ? 'Hoje!' : d === 1 ? 'Amanhã' : d + ' dias';
      var cor = d < 0 ? '#d63031' : d <= 3 ? '#b8860b' : 'var(--txt2,#666)';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.35rem 0;border-top:1px solid var(--borda,#eee)">';
      h += '<span style="font-size:.8rem;flex:1">🎯 ' + esc(m.texto) + ' <span style="color:var(--txt3,#999)">· ' + metaProgresso(m) + '%</span></span>';
      h += '<span style="font-size:.7rem;font-weight:700;color:' + cor + '">' + badge + '</span>';
      h += '</div>';
    });
    h += '</div>';
  } else if (!metas.length) {
    h += '<div style="font-size:.8rem;color:var(--txt3,#999);margin-top:.5rem">Nenhuma meta cadastrada ainda.</div>';
  }
  h += '</div>';
  var wrap = document.createElement('div');
  wrap.innerHTML = h;
  if (wrap.firstChild) cont.appendChild(wrap.firstChild);
}

function metaProgCard(icon, val, lbl) {
  return '<div style="flex:1;min-width:70px;background:var(--bg2,#f5f5f7);border-radius:10px;padding:.5rem;text-align:center">' +
    '<div style="font-size:1.1rem">' + icon + '</div>' +
    '<div style="font-size:1.05rem;font-weight:800">' + val + '</div>' +
    '<div style="font-size:.66rem;color:var(--txt2,#666)">' + lbl + '</div></div>';
}

// ---- Wrappers finais (compoem sem perder comportamento anterior) ----
(function () {
  if (typeof renderProgresso === 'function') {
    var _origProgV6 = renderProgresso;
    renderProgresso = function () {
      _origProgV6.apply(this, arguments);
      try { metaRenderProgressoExtra(); } catch (e) {}
    };
  }
})();

// Garante UI dos habitos/metas apos carregar
document.addEventListener('DOMContentLoaded', function () {
  try { habEnsureUI(); } catch (e) {}
  try { metaEnsureCampos(); } catch (e) {}
});

// ============================================================
// ORGANIZAJA - MODULO NOTAS (ETAPA 7) + melhorias de busca
// UI injetada via JS + estilos, sem depender de edicoes no index.html
// Prefixo de classes: nt7-
// ============================================================

var _nt7StylesOk = false;
var _nt7UiOk = false;
var nt7Filtro = 'todas';   // todas | favoritas | arquivadas | cat:<v> | tag:<t>
var nt7Ordem = 'recentes'; // recentes | antigas | titulo | favoritas
var nt7Busca = '';
var nt7EditId = null;
var nt7TagsTmp = [];
var nt7LixeiraAberta = false;

var notaCategorias = [
  {val:'geral',    lbl:'Geral',     icon:'📝', cor:'#6c5ce7'},
  {val:'pessoal',  lbl:'Pessoal',   icon:'📔', cor:'#e84393'},
  {val:'trabalho', lbl:'Trabalho',  icon:'💼', cor:'#0984e3'},
  {val:'estudos',  lbl:'Estudos',   icon:'📚', cor:'#00b894'},
  {val:'ideias',   lbl:'Ideias',    icon:'💡', cor:'#fdcb6e'}
];

function notaCatObj(v) {
  for (var i = 0; i < notaCategorias.length; i++) { if (notaCategorias[i].val === v) return notaCategorias[i]; }
  return notaCategorias[0];
}
function notaCatLabel(v) {
  var c = notaCatObj(v);
  return c.icon + ' ' + c.lbl;
}
function nt7PrioLabel(p) {
  return p === 'alta' ? 'Alta' : p === 'baixa' ? 'Baixa' : 'Média';
}

function nt7EnsureStyles() {
  if (_nt7StylesOk || document.getElementById('nt7-styles')) { _nt7StylesOk = true; return; }
  _nt7StylesOk = true;
  try {
    var css = ''
    + '.nt7-toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.2rem 0 .6rem}'
    + '.nt7-toolbar .nt7-busca{flex:1;min-width:150px}'
    + '.nt7-toolbar select.campo{width:auto;min-width:130px}'
    + '.nt7-nova{background:var(--cor,#6c5ce7);color:#fff;border:none;border-radius:10px;padding:.5rem .85rem;font-size:.8rem;font-weight:700;cursor:pointer;white-space:nowrap}'
    + '.nt7-lixbtn{background:var(--bg2,#f0f0f3);color:var(--txt2,#666);border:1px solid var(--borda,#e2e2e6);border-radius:10px;padding:.5rem .7rem;font-size:.78rem;font-weight:600;cursor:pointer;white-space:nowrap}'
    + '.nt7-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.7rem}'
    + '.nt7-chip{border:1px solid var(--borda,#ddd);background:transparent;color:var(--txt2,#555);font-size:.72rem;padding:.2rem .6rem;border-radius:999px;cursor:pointer;user-select:none}'
    + '.nt7-chip.ativo{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}'
    + '.nt7-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.7rem}'
    + '.nt7-card{background:var(--bg1,#fff);border:1px solid var(--borda,#eee);border-radius:14px;padding:.8rem;box-shadow:0 1px 4px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:.4rem;position:relative}'
    + '.nt7-card.arquivada{opacity:.62}'
    + '.nt7-card-top{display:flex;align-items:flex-start;gap:.4rem}'
    + '.nt7-titulo{font-weight:800;font-size:.92rem;flex:1;min-width:0;word-break:break-word}'
    + '.nt7-fav{background:none;border:none;cursor:pointer;font-size:1rem;padding:0;line-height:1;flex:0 0 auto;filter:grayscale(1);opacity:.5}'
    + '.nt7-fav.on{filter:none;opacity:1}'
    + '.nt7-texto{font-size:.8rem;color:var(--txt2,#555);white-space:pre-wrap;word-break:break-word;max-height:7.5em;overflow:hidden}'
    + '.nt7-badges{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center}'
    + '.nt7-badge-cat{font-size:.64rem;font-weight:700;padding:.12rem .45rem;border-radius:999px}'
    + '.nt7-tags{display:flex;flex-wrap:wrap;gap:.25rem}'
    + '.nt7-tag{font-size:.64rem;padding:.1rem .45rem;border-radius:999px;background:var(--bg2,#f0f0f3);color:var(--txt2,#666)}'
    + '.nt7-meta{font-size:.66rem;color:var(--txt3,#999)}'
    + '.nt7-acoes{display:flex;gap:.25rem;margin-top:auto;border-top:1px solid var(--borda,#eee);padding-top:.45rem}'
    + '.nt7-ic{background:none;border:none;cursor:pointer;font-size:.85rem;padding:.25rem .4rem;border-radius:7px;color:var(--txt2,#666)}'
    + '.nt7-ic:hover{background:var(--bg2,#f0f0f3)}'
    + '.nt7-ic.del:hover{background:rgba(214,48,49,.12);color:#d63031}'
    + '.nt7-empty{text-align:center;color:var(--txt3,#999);font-size:.85rem;padding:1.6rem .5rem}'
    + '.nt7-lix-painel{margin-top:1.1rem;border:1px dashed var(--borda,#ccc);border-radius:12px;overflow:hidden}'
    + '.nt7-lix-head{display:flex;justify-content:space-between;align-items:center;padding:.65rem .9rem;cursor:pointer;font-weight:700;font-size:.85rem;background:var(--bg2,#f5f5f7)}'
    + '.nt7-lix-body{padding:.6rem .9rem .9rem}'
    + '.nt7-lix-actions{display:flex;gap:.5rem;margin-bottom:.6rem;flex-wrap:wrap}'
    + '.nt7-lix-item{display:flex;align-items:center;gap:.5rem;padding:.4rem 0;border-top:1px solid var(--borda,#eee);font-size:.8rem}'
    + '.nt7-lix-item .nt7-lix-nome{flex:1;min-width:0;word-break:break-word}'
    + '.nt7-tagbar{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center;margin-top:.3rem}'
    + '.nt7-tagchip{display:inline-flex;align-items:center;gap:.3rem;background:var(--cor,#6c5ce7);color:#fff;font-size:.72rem;padding:.15rem .5rem;border-radius:999px}'
    + '.nt7-tagchip button{background:none;border:none;color:#fff;cursor:pointer;font-size:.85rem;line-height:1;padding:0}'
    + '@media (max-width:520px){.nt7-grid{grid-template-columns:1fr}.nt7-toolbar select.campo{flex:1}}';
    var st = document.createElement('style');
    st.id = 'nt7-styles';
    st.textContent = css;
    document.head.appendChild(st);
  } catch (e) {}
}

function notaEnsureUI() {
  nt7EnsureStyles();
  try {
    var page = document.getElementById('page-notas');
    if (!page) return;
    // Esconde o formulario antigo (linha com titulo+botao e textarea)
    var secao = page.querySelector('.secao');
    if (secao) {
      var linha = secao.querySelector('.linha');
      if (linha) linha.style.display = 'none';
      var ta = secao.querySelector('#notaTexto');
      if (ta) ta.style.display = 'none';
    }
    var grid = document.getElementById('notasGrid');
    if (!grid) return;
    grid.classList.add('nt7-grid');

    if (!document.getElementById('nt7Toolbar')) {
      var tb = document.createElement('div');
      tb.id = 'nt7Toolbar';
      tb.className = 'nt7-toolbar';
      tb.innerHTML =
          '<input class="campo nt7-busca" id="nt7Busca" type="text" placeholder="🔍 Buscar nas notas..." oninput="nt7BuscaInput(this.value)">'
        + '<select class="campo" id="nt7Ordem" onchange="nt7SetOrdem(this.value)" title="Ordenar">'
        + '<option value="recentes">⬇ Mais recentes</option>'
        + '<option value="antigas">⬆ Mais antigas</option>'
        + '<option value="titulo">🔤 Título (A-Z)</option>'
        + '<option value="favoritas">⭐ Favoritas primeiro</option>'
        + '</select>'
        + '<button class="nt7-nova" onclick="abrirNotaModal()">＋ Nova nota</button>'
        + '<button class="nt7-lixbtn" onclick="nt7ToggleLixeira()">🗑 Lixeira</button>';
      grid.parentNode.insertBefore(tb, grid);
    }
    if (!document.getElementById('nt7Chips')) {
      var chips = document.createElement('div');
      chips.id = 'nt7Chips';
      chips.className = 'nt7-chips';
      grid.parentNode.insertBefore(chips, grid);
    }
    if (!document.getElementById('nt7Lixeira')) {
      var lix = document.createElement('div');
      lix.id = 'nt7Lixeira';
      grid.parentNode.insertBefore(lix, grid.nextSibling);
    }
  } catch (e) {}

  // Modal (injetado uma vez)
  if (_nt7UiOk || document.getElementById('nt7Modal')) { _nt7UiOk = true; return; }
  _nt7UiOk = true;
  try {
    var opCats = notaCategorias.map(function(c){ return '<option value="'+c.val+'">'+c.icon+' '+c.lbl+'</option>'; }).join('');
    var html = '<div class="tk-modal" onclick="event.stopPropagation()">'
      + '<div class="tk-modal-head"><h3 id="nt7Title">📝 Nova nota</h3><button class="tk-modal-x" onclick="fecharNotaModal()">✕</button></div>'
      + '<div class="tk-modal-body">'
      + '<div class="tk-field"><label class="tk-lbl">✨ Título</label><input class="campo" id="nt7Nome" placeholder="Título da nota"></div>'
      + '<div class="tk-field"><label class="tk-lbl">📝 Conteúdo</label><textarea class="campo tk-ta" id="nt7Texto" rows="6" placeholder="Escreva sua nota..."></textarea></div>'
      + '<div class="tk-adv-grid">'
      + '<div class="tk-field" style="flex:1"><label class="tk-lbl">📂 Categoria</label><select class="campo" id="nt7Cat">'+opCats+'</select></div>'
      + '<div class="tk-field" style="flex:1"><label class="tk-lbl">⚡ Prioridade</label><select class="campo" id="nt7Prio"><option value="baixa">Baixa</option><option value="media" selected>Média</option><option value="alta">Alta</option></select></div>'
      + '</div>'
      + '<div class="tk-field"><label class="tk-lbl">🏷 Tags</label>'
      + '<div style="display:flex;gap:.4rem"><input class="campo" id="nt7TagInput" placeholder="Adicionar tag e Enter" onkeydown="if(event.key===\'Enter\'){event.preventDefault();nt7AddTag();}" style="flex:1"><button class="btn btn-s" type="button" onclick="nt7AddTag()">Adicionar</button></div>'
      + '<div class="nt7-tagbar" id="nt7TagBar"></div></div>'
      + '</div>'
      + '<div class="tk-modal-foot"><button class="btn btn-s" onclick="fecharNotaModal()">Cancelar</button><button class="btn btn-p" onclick="salvarNotaModal()">💾 Salvar</button></div>'
      + '</div>';
    var bg = document.createElement('div');
    bg.className = 'tk-modal-bg';
    bg.id = 'nt7Modal';
    bg.setAttribute('role', 'dialog');
    bg.setAttribute('aria-modal', 'true');
    bg.onclick = function(e){ fecharNotaModal(e); };
    bg.innerHTML = html;
    document.body.appendChild(bg);
  } catch (e) {}
}

function nt7BuscaInput(v) {
  nt7Busca = (v || '').toLowerCase().trim();
  renderNotas();
}
function nt7SetOrdem(v) {
  nt7Ordem = v || 'recentes';
  renderNotas();
}
function nt7SetFiltro(f) {
  nt7Filtro = f || 'todas';
  renderNotas();
}
function nt7ToggleLixeira() {
  nt7LixeiraAberta = !nt7LixeiraAberta;
  renderNotas();
}

function nt7NotaVisivelNoFiltro(n) {
  if (nt7Filtro === 'arquivadas') return !!n.arquivada;
  if (n.arquivada) return false;
  if (nt7Filtro === 'todas') return true;
  if (nt7Filtro === 'favoritas') return !!n.favorito;
  if (nt7Filtro.indexOf('cat:') === 0) return n.categoria === nt7Filtro.slice(4);
  if (nt7Filtro.indexOf('tag:') === 0) return Array.isArray(n.tags) && n.tags.indexOf(nt7Filtro.slice(4)) !== -1;
  return true;
}

function nt7NotaCasaBusca(n) {
  if (!nt7Busca) return true;
  var q = nt7Busca;
  return (n.titulo && n.titulo.toLowerCase().indexOf(q) >= 0)
    || (n.texto && n.texto.toLowerCase().indexOf(q) >= 0)
    || (n.categoria && notaCatLabel(n.categoria).toLowerCase().indexOf(q) >= 0)
    || (Array.isArray(n.tags) && n.tags.some(function(t){ return t.toLowerCase().indexOf(q) >= 0; }));
}

function nt7Ordenar(arr) {
  var a = arr.slice();
  function ts(x){ return Date.parse(x.atualizada || x.criada || x.data || 0) || 0; }
  if (nt7Ordem === 'antigas') {
    a.sort(function(x,y){ return (Date.parse(x.criada||x.data||0)||0) - (Date.parse(y.criada||y.data||0)||0); });
  } else if (nt7Ordem === 'titulo') {
    a.sort(function(x,y){ return (x.titulo||'').localeCompare(y.titulo||'', 'pt', {sensitivity:'base'}); });
  } else if (nt7Ordem === 'favoritas') {
    a.sort(function(x,y){ if (!!y.favorito !== !!x.favorito) return (y.favorito?1:0) - (x.favorito?1:0); return ts(y) - ts(x); });
  } else { // recentes
    a.sort(function(x,y){ return ts(y) - ts(x); });
  }
  return a;
}

function renderNotas() {
  notaEnsureUI();
  var grid = document.getElementById('notasGrid');
  if (!grid) return;

  // --- Chips de filtro ---
  var chipsEl = document.getElementById('nt7Chips');
  if (chipsEl) {
    var vivas = estado.notas.filter(function(n){ return !n.arquivada; });
    var favN = vivas.filter(function(n){ return n.favorito; }).length;
    var arqN = estado.notas.filter(function(n){ return n.arquivada; }).length;
    var ch = '';
    ch += '<div class="nt7-chip ' + (nt7Filtro==='todas'?'ativo':'') + '" onclick="nt7SetFiltro(\'todas\')">Todas (' + vivas.length + ')</div>';
    ch += '<div class="nt7-chip ' + (nt7Filtro==='favoritas'?'ativo':'') + '" onclick="nt7SetFiltro(\'favoritas\')">⭐ Favoritas (' + favN + ')</div>';
    // categorias presentes
    notaCategorias.forEach(function(c){
      var cnt = vivas.filter(function(n){ return n.categoria === c.val; }).length;
      if (cnt) ch += '<div class="nt7-chip ' + (nt7Filtro==='cat:'+c.val?'ativo':'') + '" onclick="nt7SetFiltro(\'cat:'+c.val+'\')">' + c.icon + ' ' + c.lbl + ' (' + cnt + ')</div>';
    });
    // tags presentes (top)
    var tagCount = {};
    vivas.forEach(function(n){ (n.tags||[]).forEach(function(t){ tagCount[t] = (tagCount[t]||0)+1; }); });
    Object.keys(tagCount).sort(function(a,b){ return tagCount[b]-tagCount[a]; }).slice(0,8).forEach(function(t){
      ch += '<div class="nt7-chip ' + (nt7Filtro==='tag:'+t?'ativo':'') + '" onclick="nt7SetFiltro(\'tag:'+t.replace(/'/g,"\\'")+'\')">#' + esc(t) + '</div>';
    });
    if (arqN) ch += '<div class="nt7-chip ' + (nt7Filtro==='arquivadas'?'ativo':'') + '" onclick="nt7SetFiltro(\'arquivadas\')">🗄 Arquivadas (' + arqN + ')</div>';
    chipsEl.innerHTML = ch;
  }

  // --- Cards ---
  var lista = estado.notas.filter(function(n){ return nt7NotaVisivelNoFiltro(n) && nt7NotaCasaBusca(n); });
  lista = nt7Ordenar(lista);

  var html = '';
  lista.forEach(function(n) {
    var c = notaCatObj(n.categoria);
    html += '<div class="nt7-card' + (n.arquivada?' arquivada':'') + '" data-busca-id="' + n.id + '">';
    html += '<div class="nt7-card-top">';
    html += '<div class="nt7-titulo">' + esc(n.titulo || 'Sem título') + '</div>';
    html += '<button class="nt7-fav' + (n.favorito?' on':'') + '" title="Favoritar" onclick="notaToggleFav(\'' + n.id + '\')">⭐</button>';
    html += '</div>';
    if (n.texto) html += '<div class="nt7-texto">' + esc(n.texto) + '</div>';
    html += '<div class="nt7-badges">';
    html += '<span class="nt7-badge-cat" style="background:' + c.cor + '22;color:' + c.cor + '">' + c.icon + ' ' + c.lbl + '</span>';
    if (n.prioridade && n.prioridade !== 'media') html += '<span class="mt6-prio mt6-prio-' + n.prioridade + '">' + nt7PrioLabel(n.prioridade) + '</span>';
    if (n.arquivada) html += '<span class="nt7-tag">🗄 arquivada</span>';
    html += '</div>';
    if (Array.isArray(n.tags) && n.tags.length) {
      html += '<div class="nt7-tags">' + n.tags.map(function(t){ return '<span class="nt7-tag">#' + esc(t) + '</span>'; }).join('') + '</div>';
    }
    html += '<div class="nt7-meta">' + nt7DataTxt(n) + '</div>';
    html += '<div class="nt7-acoes">';
    html += '<button class="nt7-ic" title="Editar" onclick="abrirNotaModal(\'' + n.id + '\')">✏️</button>';
    html += '<button class="nt7-ic" title="' + (n.arquivada?'Desarquivar':'Arquivar') + '" onclick="notaToggleArquivo(\'' + n.id + '\')">' + (n.arquivada?'📤':'📦') + '</button>';
    html += '<button class="nt7-ic del" title="Excluir" onclick="delNota(\'' + n.id + '\')">🗑</button>';
    html += '</div>';
    html += '</div>';
  });

  if (!html) {
    var msg;
    if (nt7Busca) msg = 'Nenhuma nota encontrada para “' + esc(nt7Busca) + '”.';
    else if (nt7Filtro === 'favoritas') msg = 'Você ainda não marcou notas como favoritas.';
    else if (nt7Filtro === 'arquivadas') msg = 'Nenhuma nota arquivada.';
    else if (nt7Filtro.indexOf('cat:') === 0 || nt7Filtro.indexOf('tag:') === 0) msg = 'Nenhuma nota neste filtro.';
    else msg = 'Nenhuma nota ainda. Toque em “＋ Nova nota” para começar.';
    html = '<div class="nt7-empty">' + msg + '</div>';
    grid.style.display = 'block';
  } else {
    grid.style.display = '';
  }
  grid.innerHTML = html;

  nt7RenderLixeira();
}

function nt7DataTxt(n) {
  var criada = (n.criada || n.data || '').slice(0,10);
  var atual = (n.atualizada || '').slice(0,10);
  var base = criada ? ('Criada ' + dataLocal(criada)) : '';
  if (atual && atual !== criada) base += (base?' · ':'') + 'editada ' + dataLocal(atual);
  return base;
}

function nt7RenderLixeira() {
  var el = document.getElementById('nt7Lixeira');
  if (!el) return;
  var lix = estado.notasLixeira || [];
  if (!nt7LixeiraAberta) {
    if (lix.length) {
      el.innerHTML = '<div class="nt7-lix-painel"><div class="nt7-lix-head" onclick="nt7ToggleLixeira()"><span>🗑 Lixeira (' + lix.length + ')</span><span>▸</span></div></div>';
    } else {
      el.innerHTML = '';
    }
    return;
  }
  var body = '';
  body += '<div class="nt7-lix-painel"><div class="nt7-lix-head" onclick="nt7ToggleLixeira()"><span>🗑 Lixeira (' + lix.length + ')</span><span>▾</span></div>';
  body += '<div class="nt7-lix-body">';
  if (!lix.length) {
    body += '<div class="nt7-empty" style="padding:.8rem">Lixeira vazia. Notas excluídas ficam aqui por 30 dias.</div>';
  } else {
    body += '<div class="nt7-lix-actions"><button class="btn btn-d" style="font-size:.72rem" onclick="notaLixeiraLimpar()">Esvaziar lixeira</button></div>';
    lix.slice().reverse().forEach(function(n){
      body += '<div class="nt7-lix-item">';
      body += '<span class="nt7-lix-nome">' + esc(n.titulo || 'Sem título') + '</span>';
      body += '<button class="nt7-ic" title="Restaurar" onclick="notaRestaurar(\'' + n.id + '\')">↩️</button>';
      body += '<button class="nt7-ic del" title="Excluir definitivamente" onclick="notaLixeiraExcluir(\'' + n.id + '\')">❌</button>';
      body += '</div>';
    });
  }
  body += '</div></div>';
  el.innerHTML = body;
}

// ---- Modal: abrir / fechar / salvar ----
function abrirNotaModal(id) {
  notaEnsureUI();
  nt7EditId = id || null;
  var t = document.getElementById('nt7Title');
  if (nt7EditId) {
    var n = estado.notas.find(function(x){ return x.id === nt7EditId; });
    if (!n) return;
    if (t) t.textContent = '✏️ Editar nota';
    document.getElementById('nt7Nome').value = n.titulo || '';
    document.getElementById('nt7Texto').value = n.texto || '';
    document.getElementById('nt7Cat').value = n.categoria || 'geral';
    document.getElementById('nt7Prio').value = n.prioridade || 'media';
    nt7TagsTmp = Array.isArray(n.tags) ? n.tags.slice() : [];
  } else {
    if (t) t.textContent = '📝 Nova nota';
    document.getElementById('nt7Nome').value = '';
    document.getElementById('nt7Texto').value = '';
    document.getElementById('nt7Cat').value = 'geral';
    document.getElementById('nt7Prio').value = 'media';
    nt7TagsTmp = [];
  }
  document.getElementById('nt7TagInput').value = '';
  nt7RenderTagsTmp();
  var m = document.getElementById('nt7Modal');
  if (m) m.classList.add('visivel');
  setTimeout(function(){ var f = document.getElementById('nt7Nome'); if (f) f.focus(); }, 50);
}

function fecharNotaModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var m = document.getElementById('nt7Modal');
  if (m) m.classList.remove('visivel');
  nt7EditId = null;
}

function nt7AddTag() {
  var inp = document.getElementById('nt7TagInput');
  if (!inp) return;
  var v = (inp.value || '').trim().replace(/^#+/, '');
  if (!v) return;
  if (nt7TagsTmp.indexOf(v) === -1) nt7TagsTmp.push(v);
  inp.value = '';
  nt7RenderTagsTmp();
  inp.focus();
}
function nt7DelTag(t) {
  nt7TagsTmp = nt7TagsTmp.filter(function(x){ return x !== t; });
  nt7RenderTagsTmp();
}
function nt7RenderTagsTmp() {
  var bar = document.getElementById('nt7TagBar');
  if (!bar) return;
  bar.innerHTML = nt7TagsTmp.map(function(t){
    return '<span class="nt7-tagchip">#' + esc(t) + '<button type="button" onclick="nt7DelTag(\'' + t.replace(/'/g,"\\'") + '\')">×</button></span>';
  }).join('');
}

function salvarNotaModal() {
  var titulo = document.getElementById('nt7Nome').value.trim();
  var texto = document.getElementById('nt7Texto').value.trim();
  if (!titulo && !texto) { document.getElementById('nt7Nome').focus(); return; }
  var cat = document.getElementById('nt7Cat').value || 'geral';
  var prio = document.getElementById('nt7Prio').value || 'media';
  var agora = new Date().toISOString();
  if (nt7EditId) {
    var n = estado.notas.find(function(x){ return x.id === nt7EditId; });
    if (n) {
      n.titulo = titulo; n.texto = texto; n.categoria = cat; n.prioridade = prio;
      n.tags = nt7TagsTmp.slice(); n.atualizada = agora;
      if (!n.criada) n.criada = n.data || agora;
      if (!n.data) n.data = n.criada;
    }
  } else {
    estado.notas.push({
      id: uid(), titulo: titulo, texto: texto, categoria: cat, prioridade: prio,
      tags: nt7TagsTmp.slice(), favorito: false, arquivada: false,
      criada: agora, data: agora, atualizada: agora
    });
  }
  salvarEstado();
  fecharNotaModal();
  renderNotas();
  if (typeof showToast === 'function') showToast(nt7EditId ? 'Nota atualizada ✓' : 'Nota salva ✓');
  nt7EditId = null;
}

// ---- Acoes de nota ----
function notaToggleFav(id) {
  var n = estado.notas.find(function(x){ return x.id === id; });
  if (!n) return;
  n.favorito = !n.favorito;
  n.atualizada = new Date().toISOString();
  salvarEstado(); renderNotas();
}
function notaToggleArquivo(id) {
  var n = estado.notas.find(function(x){ return x.id === id; });
  if (!n) return;
  n.arquivada = !n.arquivada;
  n.atualizada = new Date().toISOString();
  salvarEstado(); renderNotas();
  if (typeof showToast === 'function') showToast(n.arquivada ? 'Nota arquivada' : 'Nota desarquivada');
}

// delNota: agora move para a lixeira (com confirmacao)
function delNota(id) {
  var n = estado.notas.find(function(x){ return x.id === id; });
  if (!n) return;
  confirmar('Mover a nota “' + (n.titulo || 'Sem título') + '” para a lixeira?', function() {
    estado.notas = estado.notas.filter(function(x){ return x.id !== id; });
    n.excluidoEm = new Date().toISOString();
    if (!Array.isArray(estado.notasLixeira)) estado.notasLixeira = [];
    estado.notasLixeira.push(n);
    salvarEstado(); renderNotas();
    if (typeof showToast === 'function') showToast('Nota movida para a lixeira');
  });
}

function notaRestaurar(id) {
  var n = (estado.notasLixeira || []).find(function(x){ return x.id === id; });
  if (!n) return;
  estado.notasLixeira = estado.notasLixeira.filter(function(x){ return x.id !== id; });
  delete n.excluidoEm;
  n.atualizada = new Date().toISOString();
  estado.notas.push(n);
  salvarEstado(); renderNotas();
  if (typeof showToast === 'function') showToast('Nota restaurada ✓');
}

function notaLixeiraExcluir(id) {
  var n = (estado.notasLixeira || []).find(function(x){ return x.id === id; });
  if (!n) return;
  confirmar('Excluir definitivamente “' + (n.titulo || 'Sem título') + '”? Esta ação não pode ser desfeita.', function() {
    estado.notasLixeira = estado.notasLixeira.filter(function(x){ return x.id !== id; });
    salvarEstado(); renderNotas();
    if (typeof showToast === 'function') showToast('Nota excluída definitivamente');
  });
}

function notaLixeiraLimpar() {
  if (!estado.notasLixeira || !estado.notasLixeira.length) return;
  confirmar('Esvaziar a lixeira de notas? Todas as notas na lixeira serão excluídas para sempre.', function() {
    estado.notasLixeira = [];
    salvarEstado(); renderNotas();
    if (typeof showToast === 'function') showToast('Lixeira esvaziada');
  });
}

// addNota: mantem compatibilidade com o formulario antigo (#notaTitulo/#notaTexto)
function addNota() {
  var elT = document.getElementById('notaTitulo');
  var elX = document.getElementById('notaTexto');
  var titulo = elT ? elT.value.trim() : '';
  var texto = elX ? elX.value.trim() : '';
  if (!titulo && !texto) return;
  var agora = new Date().toISOString();
  estado.notas.push({
    id: uid(), titulo: titulo, texto: texto, categoria: 'geral', prioridade: 'media',
    tags: [], favorito: false, arquivada: false, criada: agora, data: agora, atualizada: agora
  });
  if (elT) elT.value = '';
  if (elX) elX.value = '';
  salvarEstado(); renderNotas();
  if (typeof showToast === 'function') showToast('Nota salva ✓');
}

// Garante UI de notas apos carregar
document.addEventListener('DOMContentLoaded', function () {
  try { notaEnsureUI(); } catch (e) {}
});

// ============================================================
// ORGANIZAJA - ETAPA 8: LEMBRETES + NOTIFICACOES + CENTRAL
// UI injetada via JS + estilos. Prefixo de classes: lem8-
// ============================================================

var _lem8StylesOk = false;
var _lem8UiOk = false;
var lem8EditId = null;
var lem8DiasSel = [];
var lem8Filtro = 'ativos';   // ativos | todos | hoje | concluidos | inativos | cat:<v>
var lem8SnoozeId = null;
var notifCentralTab = 'proximas'; // proximas | atrasadas | concluidas | naolidas

var lemCategorias = [
  {val:'geral',    lbl:'Geral',    icon:'🔔', cor:'#6c5ce7'},
  {val:'pessoal',  lbl:'Pessoal',  icon:'📔', cor:'#e84393'},
  {val:'estudos',  lbl:'Estudos',  icon:'📚', cor:'#00b894'},
  {val:'trabalho', lbl:'Trabalho', icon:'💼', cor:'#0984e3'},
  {val:'saude',    lbl:'Saúde',    icon:'💊', cor:'#e17055'},
  {val:'casa',     lbl:'Casa',     icon:'🏠', cor:'#fdcb6e'}
];
var lemDiasNomes = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function lemCatObj(v) {
  for (var i = 0; i < lemCategorias.length; i++) { if (lemCategorias[i].val === v) return lemCategorias[i]; }
  return lemCategorias[0];
}
function lemCatLabel(v) { var c = lemCatObj(v); return c.icon + ' ' + c.lbl; }
function lemPrioLabel(p) { return p === 'alta' ? 'Alta' : p === 'baixa' ? 'Baixa' : 'Média'; }
function lemRepLabel(l) {
  if (!l || !l.repeticao) return '';
  var r = l.repeticao;
  if (r.tipo === 'diaria') return '🔁 Diariamente';
  if (r.tipo === 'semanal') return '🔁 Semanalmente';
  if (r.tipo === 'mensal') return '🔁 Mensalmente';
  if (r.tipo === 'dias') {
    var ds = (r.dias || []).slice().sort().map(function(i){ return lemDiasNomes[i]; }).join(', ');
    return '🔁 ' + (ds || 'Dias específicos');
  }
  return '';
}

// datas tz-safe
function lem8FmtDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function lem8FmtHora(d) {
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}
function lem8DateObj(data, hora) {
  if (!data) return null;
  return new Date(data + 'T' + (hora || '09:00'));
}

function lem8EnsureStyles() {
  if (_lem8StylesOk || document.getElementById('lem8-styles')) { _lem8StylesOk = true; return; }
  _lem8StylesOk = true;
  try {
    var css = ''
    + '.lem8-toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.2rem 0 .5rem}'
    + '.lem8-nova{background:var(--cor,#6c5ce7);color:#fff;border:none;border-radius:10px;padding:.5rem .85rem;font-size:.8rem;font-weight:700;cursor:pointer;white-space:nowrap}'
    + '.lem8-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.7rem}'
    + '.lem8-chip{border:1px solid var(--borda,#ddd);background:transparent;color:var(--txt2,#555);font-size:.72rem;padding:.2rem .6rem;border-radius:999px;cursor:pointer;user-select:none}'
    + '.lem8-chip.ativo{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}'
    + '.lem8-card{background:var(--bg1,#fff);border:1px solid var(--borda,#eee);border-radius:14px;padding:.8rem;margin-bottom:.6rem;box-shadow:0 1px 4px rgba(0,0,0,.04);display:flex;gap:.6rem;align-items:flex-start}'
    + '.lem8-card.inativo{opacity:.55}'
    + '.lem8-card.concluido .lem8-tit{text-decoration:line-through;opacity:.7}'
    + '.lem8-card.atrasado{border-left:3px solid #d63031}'
    + '.lem8-toggle{background:none;border:none;cursor:pointer;font-size:1.25rem;padding:.1rem;flex:0 0 auto;line-height:1}'
    + '.lem8-body{flex:1;min-width:0}'
    + '.lem8-tit{font-weight:800;font-size:.92rem;word-break:break-word}'
    + '.lem8-desc{font-size:.78rem;color:var(--txt2,#555);margin-top:.15rem;white-space:pre-wrap;word-break:break-word}'
    + '.lem8-badges{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;margin-top:.4rem}'
    + '.lem8-badge{font-size:.64rem;font-weight:700;padding:.12rem .45rem;border-radius:999px}'
    + '.lem8-badge.data{background:var(--bg2,#f0f0f3);color:var(--txt2,#666)}'
    + '.lem8-badge.atras{background:rgba(214,48,49,.14);color:#d63031}'
    + '.lem8-badge.rep{background:rgba(9,132,227,.14);color:#0984e3}'
    + '.lem8-prio{font-size:.62rem;font-weight:700;padding:.12rem .45rem;border-radius:999px}'
    + '.lem8-prio-alta{background:rgba(214,48,49,.14);color:#d63031}'
    + '.lem8-prio-media{background:rgba(253,203,110,.22);color:#b8860b}'
    + '.lem8-prio-baixa{background:rgba(9,132,227,.14);color:#0984e3}'
    + '.lem8-acoes{display:flex;flex-wrap:wrap;gap:.25rem;margin-top:.5rem}'
    + '.lem8-ic{background:var(--bg2,#f5f5f7);border:none;cursor:pointer;font-size:.72rem;padding:.28rem .5rem;border-radius:8px;color:var(--txt2,#555);font-weight:600}'
    + '.lem8-ic:hover{background:var(--borda,#e2e2e6)}'
    + '.lem8-ic.del:hover{background:rgba(214,48,49,.14);color:#d63031}'
    + '.lem8-empty{text-align:center;color:var(--txt3,#999);font-size:.85rem;padding:1.4rem .5rem}'
    + '.lem8-diaschk{display:flex;flex-wrap:wrap;gap:.3rem}'
    + '.lem8-diachk{padding:.3rem .5rem;border:1px solid var(--borda,#ddd);border-radius:8px;font-size:.72rem;cursor:pointer;user-select:none}'
    + '.lem8-diachk.sel{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}'
    + '.lem8-snooze-opts{display:flex;flex-direction:column;gap:.4rem}'
    + '.lem8-snooze-opts button{width:100%;text-align:left}'
    // central de notificacoes
    + '.nc8-painel{background:var(--bg1,#fff);border:1px solid var(--borda,#eee);border-radius:14px;padding:.85rem;margin:1rem 0}'
    + '.nc8-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.6rem;flex-wrap:wrap}'
    + '.nc8-head h3{font-size:1rem;font-weight:800;margin:0}'
    + '.nc8-tabs{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.7rem}'
    + '.nc8-tab{border:1px solid var(--borda,#ddd);background:transparent;color:var(--txt2,#555);font-size:.72rem;padding:.25rem .6rem;border-radius:999px;cursor:pointer}'
    + '.nc8-tab.ativo{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}'
    + '.nc8-tab .nc8-dot{display:inline-block;min-width:16px;padding:0 .2rem;margin-left:.25rem;background:#d63031;color:#fff;border-radius:999px;font-size:.6rem;line-height:16px;text-align:center;vertical-align:middle}'
    + '.nc8-item{display:flex;gap:.55rem;align-items:flex-start;padding:.5rem 0;border-top:1px solid var(--borda,#eee)}'
    + '.nc8-item .nc8-ico{font-size:1.05rem;flex:0 0 auto}'
    + '.nc8-item .nc8-b{flex:1;min-width:0}'
    + '.nc8-item .nc8-t{font-size:.83rem;font-weight:700;word-break:break-word}'
    + '.nc8-item .nc8-s{font-size:.7rem;color:var(--txt3,#999);margin-top:.1rem}'
    + '.nc8-item.naolida{background:rgba(108,92,231,.06)}'
    + '.nc8-item .nc8-lida{background:none;border:1px solid var(--borda,#ddd);border-radius:8px;font-size:.66rem;padding:.2rem .45rem;cursor:pointer;color:var(--txt2,#666);white-space:nowrap}'
    + '.nc8-acoes{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem}'
    + '.nc8-empty{text-align:center;color:var(--txt3,#999);font-size:.8rem;padding:1rem .5rem}'
    + '.nc8-perm{font-size:.74rem;padding:.55rem .7rem;border-radius:10px;margin-bottom:.6rem;line-height:1.35}'
    + '.nc8-perm.warn{background:rgba(253,203,110,.18);color:#8a6d00;border:1px solid rgba(253,203,110,.5)}'
    + '.nc8-perm.err{background:rgba(214,48,49,.12);color:#a3282a;border:1px solid rgba(214,48,49,.3)}'
    + '.nc8-perm.ok{background:rgba(0,184,148,.12);color:#0a7d63;border:1px solid rgba(0,184,148,.3)}'
    + '.nc8-perm button{margin-top:.4rem}';
    var st = document.createElement('style');
    st.id = 'lem8-styles';
    st.textContent = css;
    document.head.appendChild(st);
  } catch (e) {}
}

function lemEnsureUI() {
  lem8EnsureStyles();
  try {
    var page = document.getElementById('page-lembretes');
    if (!page) return;
    var secao = page.querySelector('.secao');
    // esconde formulario antigo (linha simples)
    if (secao) {
      var linha = secao.querySelector('.linha');
      if (linha) linha.style.display = 'none';
    }
    var lista = document.getElementById('lembretesLista');
    if (!lista) return;

    if (!document.getElementById('lem8Toolbar')) {
      var tb = document.createElement('div');
      tb.id = 'lem8Toolbar';
      tb.className = 'lem8-toolbar';
      tb.innerHTML = '<button class="lem8-nova" onclick="abrirLembreteModal()">＋ Novo lembrete</button>';
      lista.parentNode.insertBefore(tb, lista);
    }
    if (!document.getElementById('lem8Chips')) {
      var chips = document.createElement('div');
      chips.id = 'lem8Chips';
      chips.className = 'lem8-chips';
      lista.parentNode.insertBefore(chips, lista);
    }
    // painel central de notificacoes (antes das configuracoes)
    if (!document.getElementById('nc8Painel')) {
      var cfg = document.getElementById('notifConfigSection');
      var painel = document.createElement('div');
      painel.id = 'nc8Painel';
      painel.className = 'nc8-painel';
      painel.innerHTML =
          '<div class="nc8-head"><h3>📥 Central de notificações</h3></div>'
        + '<div id="nc8Tabs" class="nc8-tabs"></div>'
        + '<div id="nc8Lista"></div>'
        + '<div class="nc8-acoes" id="nc8Acoes"></div>';
      if (cfg && cfg.parentNode) cfg.parentNode.insertBefore(painel, cfg);
      else lista.parentNode.appendChild(painel);
    }
    // banner de permissao + toggle de lembretes dentro das configuracoes
    var cfg2 = document.getElementById('notifConfigSection');
    if (cfg2 && !document.getElementById('nc8Perm')) {
      var perm = document.createElement('div');
      perm.id = 'nc8Perm';
      perm.className = 'nc8-perm';
      cfg2.insertBefore(perm, cfg2.firstChild);
    }
    if (cfg2 && !document.getElementById('nc8LembretesRow')) {
      var globalRow = cfg2.querySelector('.notif-config-row');
      var row = document.createElement('div');
      row.id = 'nc8LembretesRow';
      row.className = 'notif-config-row';
      row.style.marginTop = '.4rem';
      row.innerHTML = '<span class="notif-config-label">🔔 Lembretes</span>'
        + '<label class="notif-toggle"><input type="checkbox" id="notifLembretes" onchange="saveNotifConfig()"><span class="notif-toggle-slider"></span></label>';
      if (globalRow && globalRow.parentNode) globalRow.parentNode.insertBefore(row, globalRow.nextSibling);
      else cfg2.appendChild(row);
    }
  } catch (e) {}

  // Modais (uma vez)
  if (_lem8UiOk || document.getElementById('lem8Modal')) { _lem8UiOk = true; return; }
  _lem8UiOk = true;
  try {
    var opCats = lemCategorias.map(function(c){ return '<option value="'+c.val+'">'+c.icon+' '+c.lbl+'</option>'; }).join('');
    var chipsDias = lemDiasNomes.map(function(n,i){ return '<div class="lem8-diachk" data-d="'+i+'" onclick="lem8ToggleDia('+i+')">'+n+'</div>'; }).join('');
    var html = '<div class="tk-modal" onclick="event.stopPropagation()">'
      + '<div class="tk-modal-head"><h3 id="lem8Title">🔔 Novo lembrete</h3><button class="tk-modal-x" onclick="fecharLembreteModal()">✕</button></div>'
      + '<div class="tk-modal-body">'
      + '<div class="tk-field"><label class="tk-lbl">✨ Título *</label><input class="campo" id="lem8Nome" placeholder="Ex: Ligar para o dentista"></div>'
      + '<div class="tk-field"><label class="tk-lbl">📝 Descrição</label><textarea class="campo tk-ta" id="lem8Desc" rows="2" placeholder="Detalhes (opcional)"></textarea></div>'
      + '<div class="tk-adv-grid">'
      + '<div class="tk-field" style="flex:1"><label class="tk-lbl">📅 Data</label><input class="campo" id="lem8Data" type="date"></div>'
      + '<div class="tk-field" style="width:120px"><label class="tk-lbl">⏰ Hora</label><input class="campo" id="lem8Hora" type="time"></div>'
      + '</div>'
      + '<div class="tk-adv-grid">'
      + '<div class="tk-field" style="flex:1"><label class="tk-lbl">📂 Categoria</label><select class="campo" id="lem8Cat">'+opCats+'</select></div>'
      + '<div class="tk-field" style="flex:1"><label class="tk-lbl">⚡ Prioridade</label><select class="campo" id="lem8Prio"><option value="baixa">Baixa</option><option value="media" selected>Média</option><option value="alta">Alta</option></select></div>'
      + '</div>'
      + '<div class="tk-field"><label class="tk-lbl">🔁 Repetição</label><select class="campo" id="lem8Freq" onchange="lem8FreqChange()">'
      + '<option value="nenhuma">Não repetir</option><option value="diaria">Diariamente</option><option value="semanal">Semanalmente</option><option value="mensal">Mensalmente</option><option value="dias">Dias específicos da semana</option></select></div>'
      + '<div class="tk-field" id="lem8DiasWrap" style="display:none"><label class="tk-lbl">Dias da semana</label><div class="lem8-diaschk">'+chipsDias+'</div></div>'
      + '<div class="tk-field"><label class="tk-lbl" style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="lem8Ativo" checked style="width:auto"> Lembrete ativo</label></div>'
      + '</div>'
      + '<div class="tk-modal-foot"><button class="btn btn-s" onclick="fecharLembreteModal()">Cancelar</button><button class="btn btn-p" onclick="salvarLembreteModal()">💾 Salvar</button></div>'
      + '</div>';
    var bg = document.createElement('div');
    bg.className = 'tk-modal-bg';
    bg.id = 'lem8Modal';
    bg.setAttribute('role','dialog');
    bg.setAttribute('aria-modal','true');
    bg.onclick = function(e){ fecharLembreteModal(e); };
    bg.innerHTML = html;
    document.body.appendChild(bg);

    // modal de adiar (snooze)
    var sn = '<div class="tk-modal" onclick="event.stopPropagation()">'
      + '<div class="tk-modal-head"><h3>⏳ Adiar lembrete</h3><button class="tk-modal-x" onclick="fecharSnooze()">✕</button></div>'
      + '<div class="tk-modal-body"><div class="lem8-snooze-opts">'
      + '<button class="btn btn-s" onclick="lembreteAdiar(\'10m\')">⏰ 10 minutos</button>'
      + '<button class="btn btn-s" onclick="lembreteAdiar(\'1h\')">⏰ 1 hora</button>'
      + '<button class="btn btn-s" onclick="lembreteAdiar(\'3h\')">⏰ 3 horas</button>'
      + '<button class="btn btn-s" onclick="lembreteAdiar(\'amanha\')">📅 Amanhã (mesma hora)</button>'
      + '<button class="btn btn-s" onclick="lembreteAdiar(\'semana\')">📅 Próxima semana</button>'
      + '<button class="btn btn-p" onclick="lembreteAdiar(\'custom\')">✏️ Escolher data/hora...</button>'
      + '</div></div></div>';
    var sbg = document.createElement('div');
    sbg.className = 'tk-modal-bg';
    sbg.id = 'lem8Snooze';
    sbg.setAttribute('role','dialog');
    sbg.onclick = function(e){ fecharSnooze(e); };
    sbg.innerHTML = sn;
    document.body.appendChild(sbg);
  } catch (e) {}
}

function lem8SetFiltro(f) { lem8Filtro = f || 'ativos'; renderLembretes(); }
function lem8FreqChange() {
  var f = document.getElementById('lem8Freq').value;
  document.getElementById('lem8DiasWrap').style.display = (f === 'dias') ? 'block' : 'none';
}
function lem8ToggleDia(i) {
  var idx = lem8DiasSel.indexOf(i);
  if (idx >= 0) lem8DiasSel.splice(idx, 1); else lem8DiasSel.push(i);
  lem8RenderDias();
}
function lem8RenderDias() {
  var box = document.getElementById('lem8DiasWrap');
  if (!box) return;
  box.querySelectorAll('.lem8-diachk').forEach(function(el){
    var d = parseInt(el.getAttribute('data-d'), 10);
    if (lem8DiasSel.indexOf(d) >= 0) el.classList.add('sel'); else el.classList.remove('sel');
  });
}

function lembreteDataHoraTxt(l) {
  if (!l.data && !l.hora) return 'Sem data';
  var out = '';
  if (l.data) {
    var n = (typeof diasAte === 'function') ? diasAte(l.data) : null;
    if (n !== null && !l.concluido) {
      if (n < 0) out = 'Atrasado · ' + dataLocal(l.data);
      else if (n === 0) out = 'Hoje';
      else if (n === 1) out = 'Amanhã';
      else out = 'Em ' + n + ' dias · ' + dataLocal(l.data);
    } else {
      out = dataLocal(l.data);
    }
  }
  if (l.hora) out += (out ? ' · ' : '') + l.hora;
  return out;
}

function lembreteAtrasado(l) {
  if (l.concluido || !l.ativo || !l.data) return false;
  var dt = lem8DateObj(l.data, l.hora || '23:59');
  return dt && dt.getTime() < Date.now();
}

function lem8Visivel(l) {
  if (lem8Filtro === 'todos') return true;
  if (lem8Filtro === 'concluidos') return !!l.concluido;
  if (lem8Filtro === 'inativos') return !l.ativo && !l.concluido;
  if (lem8Filtro === 'ativos') return l.ativo && !l.concluido;
  if (lem8Filtro === 'hoje') {
    if (!l.ativo || l.concluido || !l.data) return false;
    return l.data === hojeStr();
  }
  if (lem8Filtro.indexOf('cat:') === 0) return l.categoria === lem8Filtro.slice(4) && !l.concluido;
  return true;
}

function renderLembretes() {
  lemEnsureUI();
  var lista = document.getElementById('lembretesLista');
  if (!lista) return;

  // chips
  var chipsEl = document.getElementById('lem8Chips');
  if (chipsEl) {
    var ativos = estado.lembretes.filter(function(l){ return l.ativo && !l.concluido; }).length;
    var hoje = estado.lembretes.filter(function(l){ return l.ativo && !l.concluido && l.data === hojeStr(); }).length;
    var concl = estado.lembretes.filter(function(l){ return l.concluido; }).length;
    var inat = estado.lembretes.filter(function(l){ return !l.ativo && !l.concluido; }).length;
    var ch = '';
    ch += '<div class="lem8-chip ' + (lem8Filtro==='ativos'?'ativo':'') + '" onclick="lem8SetFiltro(\'ativos\')">Ativos (' + ativos + ')</div>';
    ch += '<div class="lem8-chip ' + (lem8Filtro==='hoje'?'ativo':'') + '" onclick="lem8SetFiltro(\'hoje\')">📅 Hoje (' + hoje + ')</div>';
    lemCategorias.forEach(function(c){
      var cnt = estado.lembretes.filter(function(l){ return l.categoria === c.val && l.ativo && !l.concluido; }).length;
      if (cnt) ch += '<div class="lem8-chip ' + (lem8Filtro==='cat:'+c.val?'ativo':'') + '" onclick="lem8SetFiltro(\'cat:'+c.val+'\')">' + c.icon + ' ' + c.lbl + ' (' + cnt + ')</div>';
    });
    if (concl) ch += '<div class="lem8-chip ' + (lem8Filtro==='concluidos'?'ativo':'') + '" onclick="lem8SetFiltro(\'concluidos\')">✅ Concluídos (' + concl + ')</div>';
    if (inat) ch += '<div class="lem8-chip ' + (lem8Filtro==='inativos'?'ativo':'') + '" onclick="lem8SetFiltro(\'inativos\')">🔕 Inativos (' + inat + ')</div>';
    ch += '<div class="lem8-chip ' + (lem8Filtro==='todos'?'ativo':'') + '" onclick="lem8SetFiltro(\'todos\')">Todos</div>';
    chipsEl.innerHTML = ch;
  }

  var arr = estado.lembretes.filter(lem8Visivel);
  arr.sort(function(a,b){
    if (!!a.concluido !== !!b.concluido) return a.concluido ? 1 : -1;
    var da = (a.data || '9999-99-99') + 'T' + (a.hora || '99:99');
    var db = (b.data || '9999-99-99') + 'T' + (b.hora || '99:99');
    return da.localeCompare(db);
  });

  var html = '';
  arr.forEach(function(l){
    var c = lemCatObj(l.categoria);
    var atras = lembreteAtrasado(l);
    var cls = 'lem8-card' + (l.ativo ? '' : ' inativo') + (l.concluido ? ' concluido' : '') + (atras ? ' atrasado' : '');
    html += '<div class="' + cls + '" data-busca-id="' + l.id + '">';
    // toggle ativo/inativo
    var ic = l.concluido ? '✅' : (l.ativo ? '🔔' : '🔕');
    html += '<button class="lem8-toggle" title="' + (l.ativo?'Desativar':'Ativar') + '" onclick="toggleLembrete(\'' + l.id + '\')">' + ic + '</button>';
    html += '<div class="lem8-body">';
    html += '<div class="lem8-tit">' + esc(l.titulo || l.texto || 'Sem título') + '</div>';
    if (l.descricao) html += '<div class="lem8-desc">' + esc(l.descricao) + '</div>';
    html += '<div class="lem8-badges">';
    html += '<span class="lem8-badge ' + (atras?'atras':'data') + '">' + (atras?'⚠️ ':'') + lembreteDataHoraTxt(l) + '</span>';
    html += '<span class="lem8-badge" style="background:' + c.cor + '22;color:' + c.cor + '">' + c.icon + ' ' + c.lbl + '</span>';
    if (l.prioridade && l.prioridade !== 'media') html += '<span class="lem8-prio lem8-prio-' + l.prioridade + '">' + lemPrioLabel(l.prioridade) + '</span>';
    var rl = lemRepLabel(l);
    if (rl) html += '<span class="lem8-badge rep">' + rl + '</span>';
    html += '</div>';
    html += '<div class="lem8-acoes">';
    if (!l.concluido) {
      html += '<button class="lem8-ic" onclick="lembreteConcluir(\'' + l.id + '\')">✓ Concluir</button>';
      html += '<button class="lem8-ic" onclick="abrirSnooze(\'' + l.id + '\')">⏳ Adiar</button>';
    } else {
      html += '<button class="lem8-ic" onclick="lembreteReabrir(\'' + l.id + '\')">↩️ Reabrir</button>';
    }
    html += '<button class="lem8-ic" onclick="abrirLembreteModal(\'' + l.id + '\')">✏️ Editar</button>';
    html += '<button class="lem8-ic del" onclick="delLembrete(\'' + l.id + '\')">🗑 Excluir</button>';
    html += '</div>';
    html += '</div></div>';
  });

  if (!html) {
    var msg = 'Nenhum lembrete aqui.';
    if (lem8Filtro === 'ativos') msg = 'Nenhum lembrete ativo. Toque em “＋ Novo lembrete”.';
    else if (lem8Filtro === 'hoje') msg = 'Nenhum lembrete para hoje.';
    else if (lem8Filtro === 'concluidos') msg = 'Nenhum lembrete concluído ainda.';
    else if (lem8Filtro === 'inativos') msg = 'Nenhum lembrete inativo.';
    html = '<div class="lem8-empty">' + msg + '</div>';
  }
  lista.innerHTML = html;

  renderNotifConfig();
  renderNotifCentral();
}

// ---- Recorrencia ----
function lembreteProximaData(l, from) {
  // retorna Date estritamente > from respeitando a repeticao
  var r = l.repeticao || {tipo:'nenhuma'};
  var hora = l.hora || '09:00';
  var hp = hora.split(':');
  var base = l.data ? new Date(l.data + 'T' + hora) : new Date(from);
  base.setSeconds(0,0);
  var guard = 0;
  if (r.tipo === 'diaria') {
    while (base.getTime() <= from.getTime() && guard++ < 4000) base.setDate(base.getDate() + 1);
    return base;
  }
  if (r.tipo === 'semanal') {
    while (base.getTime() <= from.getTime() && guard++ < 4000) base.setDate(base.getDate() + 7);
    return base;
  }
  if (r.tipo === 'mensal') {
    while (base.getTime() <= from.getTime() && guard++ < 2000) base.setMonth(base.getMonth() + 1);
    return base;
  }
  if (r.tipo === 'dias' && (r.dias || []).length) {
    var d = new Date(from.getTime());
    d.setHours(parseInt(hp[0],10), parseInt(hp[1],10), 0, 0);
    if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
    while (guard++ < 400) {
      if (r.dias.indexOf(d.getDay()) >= 0) return d;
      d.setDate(d.getDate() + 1);
    }
  }
  return null;
}

function lembreteRolarRecorrentes() {
  var agora = new Date();
  var mudou = false;
  (estado.lembretes || []).forEach(function(l){
    if (!l.ativo || l.concluido) return;
    if (!l.repeticao || l.repeticao.tipo === 'nenhuma') return;
    if (!l.data) return;
    var dt = lem8DateObj(l.data, l.hora || '09:00');
    if (dt && dt.getTime() <= agora.getTime()) {
      var prox = lembreteProximaData(l, agora);
      if (prox) { l.data = lem8FmtDate(prox); if (!l.hora) l.hora = lem8FmtHora(prox); mudou = true; }
    }
  });
  if (mudou) salvarEstado();
  return mudou;
}

// ---- Modal: abrir/fechar/salvar ----
function abrirLembreteModal(id) {
  lemEnsureUI();
  lem8EditId = id || null;
  var t = document.getElementById('lem8Title');
  if (lem8EditId) {
    var l = estado.lembretes.find(function(x){ return x.id === lem8EditId; });
    if (!l) return;
    if (t) t.textContent = '✏️ Editar lembrete';
    document.getElementById('lem8Nome').value = l.titulo || l.texto || '';
    document.getElementById('lem8Desc').value = l.descricao || '';
    document.getElementById('lem8Data').value = l.data || '';
    document.getElementById('lem8Hora').value = l.hora || '';
    document.getElementById('lem8Cat').value = l.categoria || 'geral';
    document.getElementById('lem8Prio').value = l.prioridade || 'media';
    document.getElementById('lem8Freq').value = (l.repeticao && l.repeticao.tipo) || 'nenhuma';
    document.getElementById('lem8Ativo').checked = l.ativo !== false;
    lem8DiasSel = (l.repeticao && Array.isArray(l.repeticao.dias)) ? l.repeticao.dias.slice() : [];
  } else {
    if (t) t.textContent = '🔔 Novo lembrete';
    document.getElementById('lem8Nome').value = '';
    document.getElementById('lem8Desc').value = '';
    document.getElementById('lem8Data').value = '';
    document.getElementById('lem8Hora').value = '';
    document.getElementById('lem8Cat').value = 'geral';
    document.getElementById('lem8Prio').value = 'media';
    document.getElementById('lem8Freq').value = 'nenhuma';
    document.getElementById('lem8Ativo').checked = true;
    lem8DiasSel = [];
  }
  lem8FreqChange();
  lem8RenderDias();
  var m = document.getElementById('lem8Modal');
  if (m) m.classList.add('visivel');
  setTimeout(function(){ var f = document.getElementById('lem8Nome'); if (f) f.focus(); }, 50);
}

function fecharLembreteModal(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var m = document.getElementById('lem8Modal');
  if (m) m.classList.remove('visivel');
  lem8EditId = null;
}

function salvarLembreteModal() {
  var titulo = document.getElementById('lem8Nome').value.trim();
  if (!titulo) { document.getElementById('lem8Nome').focus(); return; }
  var desc = document.getElementById('lem8Desc').value.trim();
  var data = document.getElementById('lem8Data').value || '';
  var hora = document.getElementById('lem8Hora').value || '';
  var cat = document.getElementById('lem8Cat').value || 'geral';
  var prio = document.getElementById('lem8Prio').value || 'media';
  var freq = document.getElementById('lem8Freq').value || 'nenhuma';
  var ativo = document.getElementById('lem8Ativo').checked;
  var rep = {tipo: freq, dias: (freq === 'dias' ? lem8DiasSel.slice().sort() : [])};
  if (freq === 'dias' && !rep.dias.length) rep.tipo = 'nenhuma';
  // repeticao precisa de hora para agendar; se nao houver, assume data de hoje
  if (rep.tipo !== 'nenhuma' && !data) data = hojeStr();

  if (lem8EditId) {
    var l = estado.lembretes.find(function(x){ return x.id === lem8EditId; });
    if (l) {
      l.titulo = titulo; l.texto = titulo; l.descricao = desc;
      l.data = data; l.hora = hora; l.categoria = cat; l.prioridade = prio;
      l.repeticao = rep; l.ativo = ativo; l.concluido = false;
    }
  } else {
    estado.lembretes.push({
      id: uid(), titulo: titulo, texto: titulo, descricao: desc,
      data: data, hora: hora, categoria: cat, prioridade: prio,
      repeticao: rep, ativo: ativo, concluido: false, criada: new Date().toISOString()
    });
  }
  salvarEstado();
  fecharLembreteModal();
  renderLembretes();
  scheduleAllNotificacoes();
  atualizarDashboardSeVisivel();
  if (typeof showToast === 'function') showToast(lem8EditId ? 'Lembrete atualizado ✓' : 'Lembrete criado ✓');
  lem8EditId = null;
}

// ---- Acoes ----
function toggleLembrete(id) {
  var l = estado.lembretes.find(function(x){ return x.id === id; });
  if (!l) return;
  if (l.concluido) { l.concluido = false; l.ativo = true; }
  else { l.ativo = !l.ativo; }
  salvarEstado(); renderLembretes(); scheduleAllNotificacoes(); atualizarDashboardSeVisivel();
}

function lembreteConcluir(id) {
  var l = estado.lembretes.find(function(x){ return x.id === id; });
  if (!l) return;
  var rep = l.repeticao || {tipo:'nenhuma'};
  if (rep.tipo && rep.tipo !== 'nenhuma') {
    var prox = lembreteProximaData(l, new Date());
    if (prox) {
      l.data = lem8FmtDate(prox);
      if (!l.hora) l.hora = lem8FmtHora(prox);
      l.ativo = true; l.concluido = false;
      // limpa dedup para permitir a proxima notificacao
      try { sessionStorage.removeItem('oj_notif_lembrete_' + l.id); } catch (e) {}
      salvarEstado(); renderLembretes(); scheduleAllNotificacoes(); atualizarDashboardSeVisivel();
      if (typeof showToast === 'function') showToast('Concluído! Próxima: ' + dataLocal(l.data));
      return;
    }
  }
  l.concluido = true; l.ativo = false;
  salvarEstado(); renderLembretes(); scheduleAllNotificacoes(); atualizarDashboardSeVisivel();
  if (typeof showToast === 'function') showToast('Lembrete concluído ✓');
}

function lembreteReabrir(id) {
  var l = estado.lembretes.find(function(x){ return x.id === id; });
  if (!l) return;
  l.concluido = false; l.ativo = true;
  salvarEstado(); renderLembretes(); scheduleAllNotificacoes(); atualizarDashboardSeVisivel();
}

function delLembrete(id) {
  var l = estado.lembretes.find(function(x){ return x.id === id; });
  if (!l) return;
  confirmar('Excluir o lembrete “' + (l.titulo || l.texto || 'Sem título') + '”?', function() {
    estado.lembretes = estado.lembretes.filter(function(x){ return x.id !== id; });
    if (notifTimers['lembrete_' + id]) { clearTimeout(notifTimers['lembrete_' + id]); delete notifTimers['lembrete_' + id]; }
    salvarEstado(); renderLembretes(); scheduleAllNotificacoes(); atualizarDashboardSeVisivel();
    if (typeof showToast === 'function') showToast('Lembrete excluído');
  });
}

// ---- Adiar (snooze) ----
function abrirSnooze(id) {
  lem8SnoozeId = id;
  lemEnsureUI();
  var m = document.getElementById('lem8Snooze');
  if (m) m.classList.add('visivel');
}
function fecharSnooze(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var m = document.getElementById('lem8Snooze');
  if (m) m.classList.remove('visivel');
}
function lembreteAdiar(tipo) {
  var l = estado.lembretes.find(function(x){ return x.id === lem8SnoozeId; });
  if (!l) { fecharSnooze(); return; }
  if (tipo === 'custom') {
    fecharSnooze();
    abrirLembreteModal(l.id);
    return;
  }
  var agora = new Date();
  var base = lem8DateObj(l.data, l.hora || lem8FmtHora(agora));
  if (!base || base.getTime() < agora.getTime()) base = new Date(agora.getTime());
  if (tipo === '10m') base = new Date(base.getTime() + 10*60000);
  else if (tipo === '1h') base = new Date(base.getTime() + 60*60000);
  else if (tipo === '3h') base = new Date(base.getTime() + 3*60*60000);
  else if (tipo === 'amanha') { base = new Date(agora.getTime()); base.setDate(base.getDate() + 1); }
  else if (tipo === 'semana') { base = new Date(agora.getTime()); base.setDate(base.getDate() + 7); }
  l.data = lem8FmtDate(base);
  l.hora = lem8FmtHora(base);
  l.ativo = true; l.concluido = false;
  try { sessionStorage.removeItem('oj_notif_lembrete_' + l.id); } catch (e) {}
  salvarEstado();
  fecharSnooze();
  renderLembretes(); scheduleAllNotificacoes(); atualizarDashboardSeVisivel();
  if (typeof showToast === 'function') showToast('Adiado para ' + dataLocal(l.data) + ' ' + l.hora);
  lem8SnoozeId = null;
}

// ---- Central de notificacoes ----
function nc8TipoDeKey(key) {
  if (!key) return 'outro';
  if (key.indexOf('lembrete') === 0) return 'lembrete';
  if (key.indexOf('tarefa') === 0) return 'tarefa';
  if (key.indexOf('prova') === 0) return 'prova';
  if (key.indexOf('trabalho') === 0) return 'trabalho';
  if (key.indexOf('evento') === 0) return 'evento';
  return 'outro';
}
var nc8Icons = {lembrete:'🔔', tarefa:'✅', prova:'📝', trabalho:'📄', evento:'📌', outro:'🔔'};

function notifCentralRegistrar(titulo, corpo, key) {
  if (!Array.isArray(estado.notifLog)) estado.notifLog = [];
  estado.notifLog.push({
    id: uid(),
    tipo: nc8TipoDeKey(key),
    titulo: titulo || 'Notificação',
    corpo: corpo || '',
    ts: new Date().toISOString(),
    lida: false
  });
  if (estado.notifLog.length > 60) estado.notifLog = estado.notifLog.slice(-60);
  salvarEstado();
  try {
    if (estado.paginaAtual === 'lembretes') renderNotifCentral();
    atualizarDashboardSeVisivel();
  } catch (e) {}
}

function nc8FmtQuando(dt) {
  if (!dt) return '';
  var data = lem8FmtDate(dt);
  var hora = lem8FmtHora(dt);
  var txt = dataLocal(data);
  if (data === hojeStr()) txt = 'Hoje';
  return txt + ' · ' + hora;
}

// coleta itens (proximas/atrasadas/concluidas) a partir dos dados
function nc8Coletar() {
  var agora = Date.now();
  var HORIZONTE = 60 * 86400000; // 60 dias
  var prox = [], atras = [], concl = [];
  function add(icon, titulo, sub, dt, done, atrasavel) {
    if (!dt) return;
    var t = dt.getTime();
    if (done) { concl.push({icon:icon, titulo:titulo, sub:sub, dt:dt}); return; }
    if (t >= agora) {
      if (t - agora <= HORIZONTE) prox.push({icon:icon, titulo:titulo, sub:sub, dt:dt});
    } else if (atrasavel) {
      if (agora - t <= HORIZONTE) atras.push({icon:icon, titulo:titulo, sub:sub, dt:dt});
    }
  }
  // Lembretes
  (estado.lembretes || []).forEach(function(l){
    if (!l.data) return;
    var dt = lem8DateObj(l.data, l.hora || '09:00');
    var tit = '🔔 ' + (l.titulo || l.texto || 'Lembrete');
    if (l.concluido) { concl.push({icon:'🔔', titulo:tit, sub:'Concluído', dt:dt}); return; }
    if (!l.ativo) return;
    add('🔔', tit, lemCatLabel(l.categoria), dt, false, true);
  });
  // Tarefas
  (estado.tarefas || []).forEach(function(t){
    if (!t.data) return;
    var dt = lem8DateObj(t.data, t.hora || '09:00');
    add('✅', 'Tarefa: ' + (t.texto || ''), '', dt, !!t.feito, true);
  });
  // Provas
  if (estado.estudos && estado.estudos.provas) estado.estudos.provas.forEach(function(p){
    if (!p.data) return;
    var dt = lem8DateObj(p.data, p.hora || '09:00');
    add('📝', 'Prova: ' + (p.texto || ''), p.materia || '', dt, false, true);
  });
  // Trabalhos
  if (estado.estudos && estado.estudos.trabalhos) estado.estudos.trabalhos.forEach(function(tb){
    if (!tb.data) return;
    var dt = lem8DateObj(tb.data, tb.hora || '23:59');
    add('📄', 'Trabalho: ' + (tb.texto || ''), tb.materia || '', dt, tb.status === 'Concluído', true);
  });
  // Eventos
  (estado.calEventos || []).forEach(function(ev){
    if (!ev.data) return;
    var dt = lem8DateObj(ev.data, ev.hora || '09:00');
    add('📌', 'Evento: ' + (ev.titulo || ''), '', dt, false, true);
  });
  prox.sort(function(a,b){ return a.dt - b.dt; });
  atras.sort(function(a,b){ return b.dt - a.dt; });
  concl.sort(function(a,b){ return b.dt - a.dt; });
  return {proximas: prox, atrasadas: atras, concluidas: concl.slice(0, 40)};
}

function notifCentralTabSet(t) { notifCentralTab = t; renderNotifCentral(); }

function renderNotifCentral() {
  var tabsEl = document.getElementById('nc8Tabs');
  var listaEl = document.getElementById('nc8Lista');
  var acoesEl = document.getElementById('nc8Acoes');
  if (!tabsEl || !listaEl) return;
  var col = nc8Coletar();
  var log = (estado.notifLog || []);
  var naoLidas = log.filter(function(n){ return !n.lida; });

  var tabs = [
    {id:'proximas',  lbl:'Próximas',   n:col.proximas.length,  dot:false},
    {id:'atrasadas', lbl:'Atrasadas',  n:col.atrasadas.length, dot:col.atrasadas.length>0},
    {id:'concluidas',lbl:'Concluídas', n:col.concluidas.length, dot:false},
    {id:'naolidas',  lbl:'Não lidas',  n:naoLidas.length,       dot:naoLidas.length>0}
  ];
  tabsEl.innerHTML = tabs.map(function(t){
    var badge = t.dot ? '<span class="nc8-dot">' + t.n + '</span>' : ' (' + t.n + ')';
    return '<button class="nc8-tab ' + (notifCentralTab===t.id?'ativo':'') + '" onclick="notifCentralTabSet(\'' + t.id + '\')">' + t.lbl + badge + '</button>';
  }).join('');

  var html = '';
  if (notifCentralTab === 'naolidas') {
    if (!naoLidas.length) html = '<div class="nc8-empty">Nenhuma notificação não lida.</div>';
    else {
      naoLidas.slice().reverse().forEach(function(n){
        html += '<div class="nc8-item naolida">';
        html += '<div class="nc8-ico">' + (nc8Icons[n.tipo] || '🔔') + '</div>';
        html += '<div class="nc8-b"><div class="nc8-t">' + esc(n.titulo) + '</div>';
        html += '<div class="nc8-s">' + (n.corpo ? esc(n.corpo) + ' · ' : '') + nc8FmtLogData(n.ts) + '</div></div>';
        html += '<button class="nc8-lida" onclick="notifCentralMarcarLida(\'' + n.id + '\')">Marcar lida</button>';
        html += '</div>';
      });
    }
  } else {
    var arr = col[notifCentralTab] || [];
    if (!arr.length) {
      var m = notifCentralTab === 'proximas' ? 'Nenhuma notificação próxima.' : notifCentralTab === 'atrasadas' ? 'Nada atrasado 🎉' : 'Nada concluído ainda.';
      html = '<div class="nc8-empty">' + m + '</div>';
    } else {
      arr.forEach(function(it){
        html += '<div class="nc8-item">';
        html += '<div class="nc8-ico">' + it.icon + '</div>';
        html += '<div class="nc8-b"><div class="nc8-t">' + esc(it.titulo) + '</div>';
        html += '<div class="nc8-s">' + (it.sub ? esc(it.sub) + ' · ' : '') + nc8FmtQuando(it.dt) + '</div></div>';
        html += '</div>';
      });
    }
  }
  listaEl.innerHTML = html;

  if (acoesEl) {
    var ac = '';
    if (notifCentralTab === 'naolidas' && naoLidas.length) ac += '<button class="lem8-ic" onclick="notifCentralMarcarTodas()">✓ Marcar todas como lidas</button>';
    if (log.length) ac += '<button class="lem8-ic del" onclick="notifCentralLimpar()">🗑 Limpar histórico</button>';
    acoesEl.innerHTML = ac;
  }
}

function nc8FmtLogData(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return nc8FmtQuando(d);
}

function notifCentralMarcarLida(id) {
  var n = (estado.notifLog || []).find(function(x){ return x.id === id; });
  if (n) { n.lida = true; salvarEstado(); renderNotifCentral(); atualizarDashboardSeVisivel(); }
}
function notifCentralMarcarTodas() {
  (estado.notifLog || []).forEach(function(n){ n.lida = true; });
  salvarEstado(); renderNotifCentral(); atualizarDashboardSeVisivel();
}
function notifCentralLimpar() {
  if (!estado.notifLog || !estado.notifLog.length) return;
  confirmar('Limpar todo o histórico de notificações?', function(){
    estado.notifLog = [];
    salvarEstado(); renderNotifCentral(); atualizarDashboardSeVisivel();
  });
}

// ---- Permissao do navegador ----
function pedirPermissaoNotif() {
  if (!('Notification' in window)) {
    if (typeof showToast === 'function') showToast('Este navegador não suporta notificações');
    renderNotifPermBanner();
    return;
  }
  Notification.requestPermission().then(function(p){
    notifPermission = p;
    renderNotifPermBanner();
    if (p === 'granted') { if (typeof showToast === 'function') showToast('Notificações ativadas ✓'); scheduleAllNotificacoes(); }
    else if (p === 'denied') { if (typeof showToast === 'function') showToast('Permissão negada pelo navegador'); }
  });
}

function renderNotifPermBanner() {
  var el = document.getElementById('nc8Perm');
  if (!el) return;
  if (!('Notification' in window)) {
    el.className = 'nc8-perm err';
    el.innerHTML = '⚠️ Este navegador não suporta notificações do sistema. Os lembretes ainda aparecem aqui na Central e no painel do app.';
    return;
  }
  var p = (typeof Notification !== 'undefined') ? Notification.permission : 'default';
  notifPermission = p;
  if (p === 'granted') {
    el.className = 'nc8-perm ok';
    el.innerHTML = '✅ Notificações do navegador ativadas. Elas funcionam enquanto o app estiver aberto (o navegador não garante alertas com a aba fechada).';
  } else if (p === 'denied') {
    el.className = 'nc8-perm err';
    el.innerHTML = '🔕 Você bloqueou as notificações. Para ativar, permita nas configurações do navegador. Enquanto isso, os lembretes aparecem na Central abaixo.';
  } else {
    el.className = 'nc8-perm warn';
    el.innerHTML = '🔔 Ative as notificações do navegador para receber alertas.<br><button class="btn btn-p" style="font-size:.72rem" onclick="pedirPermissaoNotif()">Ativar notificações</button>';
  }
}

// ---- Override das configuracoes (inclui lembretes + permissao) ----
function renderNotifConfig() {
  if (!estado.notifConfig) return;
  var nc = estado.notifConfig;
  function setChk(id, v){ var e = document.getElementById(id); if (e) e.checked = !!v; }
  function setVal(id, v){ var e = document.getElementById(id); if (e) e.value = v; }
  setChk('notifGlobal', nc.global);
  setVal('notifTarefas', String(nc.tarefas));
  setVal('notifProvas', String(nc.provas));
  setVal('notifTrabalhos', String(nc.trabalhos));
  setVal('notifEventos', String(nc.eventos));
  setChk('notifLembretes', nc.lembretes !== false);
  setChk('notifQuietOn', nc.quietHours && nc.quietHours.on);
  setVal('notifQuietStart', nc.quietHours ? nc.quietHours.start : '22:00');
  setVal('notifQuietEnd', nc.quietHours ? nc.quietHours.end : '08:00');
  var qr = document.getElementById('notifQuietRow');
  if (qr) qr.style.display = nc.quietHours && nc.quietHours.on ? '' : 'none';
  var cs = document.getElementById('notifConfigSection');
  if (cs) {
    var items = cs.querySelectorAll('.notif-config-grid .notif-config-item, .notif-config-quiet, #nc8LembretesRow');
    for (var i = 0; i < items.length; i++) {
      items[i].style.opacity = nc.global ? '1' : '0.4';
      items[i].style.pointerEvents = nc.global ? '' : 'none';
    }
  }
  renderNotifPermBanner();
}

function saveNotifConfig() {
  if (!estado.notifConfig) estado.notifConfig = {};
  function chk(id, d){ var e = document.getElementById(id); return e ? e.checked : d; }
  function val(id, d){ var e = document.getElementById(id); return e ? e.value : d; }
  estado.notifConfig.global = chk('notifGlobal', true);
  estado.notifConfig.tarefas = parseInt(val('notifTarefas', '1'));
  estado.notifConfig.provas = parseInt(val('notifProvas', '3'));
  estado.notifConfig.trabalhos = parseInt(val('notifTrabalhos', '2'));
  estado.notifConfig.eventos = parseInt(val('notifEventos', '1'));
  estado.notifConfig.lembretes = chk('notifLembretes', true);
  estado.notifConfig.quietHours = {
    on: chk('notifQuietOn', false),
    start: val('notifQuietStart', '22:00') || '22:00',
    end: val('notifQuietEnd', '08:00') || '08:00'
  };
  salvarEstado();
  renderNotifConfig();
  scheduleAllNotificacoes();
}

// Garante UI de lembretes/notificacoes apos carregar
document.addEventListener('DOMContentLoaded', function () {
  try { lemEnsureUI(); } catch (e) {}
  try { lembreteRolarRecorrentes(); } catch (e) {}
});

// ==================================================================
// ETAPA 9 — MEU DIA & PLANEJAMENTO (prefixo md9-)
// Reutiliza os dados existentes (tarefas, calEventos, habitos, metas,
// estudos, lembretes, notas). Nao cria copias. Override last-wins de
// renderMeuDia. UI + CSS injetados via JS.
// ==================================================================
var md9Tab = 'hoje';
var md9StylesOk = false;
var md9ModalOk = false;

var md9Periodos = [
  {id:'manha',   lbl:'Manhã',       icon:'🌅'},
  {id:'tarde',   lbl:'Tarde',       icon:'☀️'},
  {id:'noite',   lbl:'Noite',       icon:'🌙'},
  {id:'semhora', lbl:'Sem horário', icon:'🕒'}
];

function md9DerivaPeriodo(hora) {
  if (!hora) return 'semhora';
  var h = parseInt((hora.split(':')[0]) || '0', 10);
  if (isNaN(h)) return 'semhora';
  if (h < 12) return 'manha';
  if (h < 18) return 'tarde';
  return 'noite';
}
function md9ItemPeriodo(o) { return o.periodo || md9DerivaPeriodo(o.hora); }
function md9PeriodoLbl(id) {
  for (var i = 0; i < md9Periodos.length; i++) if (md9Periodos[i].id === id) return md9Periodos[i].icon + ' ' + md9Periodos[i].lbl;
  return id;
}

function md9EnsureStyles() {
  if (md9StylesOk || document.getElementById('md9Styles')) { md9StylesOk = true; return; }
  md9StylesOk = true;
  var css = ''
  + '.md9-tabs{display:flex;gap:.4rem;margin:.2rem 0 1rem;flex-wrap:wrap}'
  + '.md9-tab{flex:1;min-width:96px;padding:.55rem .5rem;border-radius:12px;border:1px solid var(--borda,#e2e2e6);background:var(--card,#fff);color:var(--txt2,#555);font-size:.82rem;font-weight:600;cursor:pointer;text-align:center;transition:all .15s}'
  + '.md9-tab.ativo{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}'
  + '.md9-prog{background:var(--card,#fff);border:1px solid var(--borda,#e2e2e6);border-radius:16px;padding:1rem;margin-bottom:1rem}'
  + '.md9-prog-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}'
  + '.md9-prog-lbl{font-weight:700;font-size:.95rem}'
  + '.md9-prog-pct{font-weight:800;font-size:1.1rem;color:var(--cor,#6c5ce7)}'
  + '.md9-prog-bar{height:10px;border-radius:8px;background:var(--card2,#f0f0f4);overflow:hidden}'
  + '.md9-prog-fill{height:100%;border-radius:8px;background:linear-gradient(90deg,var(--verde,#00b894),var(--cor,#6c5ce7));transition:width .4s}'
  + '.md9-prog-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-top:.8rem}'
  + '.md9-prog-cell{background:var(--card2,#f7f7fa);border-radius:10px;padding:.5rem;text-align:center}'
  + '.md9-prog-cell .n{font-size:1.05rem;font-weight:800;display:block}'
  + '.md9-prog-cell .l{font-size:.66rem;color:var(--txt3,#999);text-transform:uppercase;letter-spacing:.02em}'
  + '.md9-qa{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:1rem}'
  + '.md9-qa-btn{padding:.7rem .4rem;border-radius:12px;border:1px solid var(--borda,#e2e2e6);background:var(--card,#fff);cursor:pointer;font-size:.76rem;font-weight:600;color:var(--txt,#222);display:flex;flex-direction:column;align-items:center;gap:.25rem;transition:all .15s}'
  + '.md9-qa-btn:hover{border-color:var(--cor,#6c5ce7);transform:translateY(-1px)}'
  + '.md9-qa-btn .ic{font-size:1.15rem}'
  + '.md9-sec{margin-bottom:1rem}'
  + '.md9-sec-h{display:flex;align-items:center;gap:.45rem;font-weight:700;font-size:.9rem;margin-bottom:.5rem}'
  + '.md9-sec-h .cnt{margin-left:auto;background:var(--card2,#f0f0f4);color:var(--txt2,#555);border-radius:20px;padding:.1rem .5rem;font-size:.72rem;font-weight:700}'
  + '.md9-card{background:var(--card,#fff);border:1px solid var(--borda,#e2e2e6);border-radius:12px;padding:.6rem .7rem;margin-bottom:.4rem;display:flex;align-items:flex-start;gap:.55rem}'
  + '.md9-card.foco{border-left:4px solid var(--cor,#6c5ce7)}'
  + '.md9-card.atras{border-left:4px solid var(--vermelho,#e74c3c);background:rgba(231,76,60,.05)}'
  + '.md9-card.done{opacity:.6}'
  + '.md9-chk{width:22px;height:22px;flex:none;border-radius:6px;border:2px solid var(--borda,#ccc);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem;background:transparent}'
  + '.md9-chk.on{background:var(--verde,#00b894);border-color:var(--verde,#00b894);color:#fff}'
  + '.md9-ic{font-size:1.05rem;flex:none;line-height:1.4}'
  + '.md9-b{flex:1;min-width:0}'
  + '.md9-t{font-size:.86rem;font-weight:600;color:var(--txt,#222);word-break:break-word}'
  + '.md9-card.done .md9-t{text-decoration:line-through}'
  + '.md9-m{font-size:.72rem;color:var(--txt3,#999);margin-top:.15rem;display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}'
  + '.md9-pill{border-radius:20px;padding:.05rem .45rem;font-size:.66rem;font-weight:700}'
  + '.md9-pill.alta{background:rgba(231,76,60,.15);color:var(--vermelho,#e74c3c)}'
  + '.md9-pill.media{background:rgba(243,156,18,.15);color:#e0930a}'
  + '.md9-pill.baixa{background:rgba(0,184,148,.15);color:var(--verde,#00b894)}'
  + '.md9-pill.atras{background:var(--vermelho,#e74c3c);color:#fff}'
  + '.md9-go{flex:none;border:none;background:transparent;color:var(--txt3,#999);font-size:1rem;cursor:pointer;padding:.2rem .3rem;border-radius:8px}'
  + '.md9-go:hover{background:var(--card2,#f0f0f4);color:var(--cor,#6c5ce7)}'
  + '.md9-empty{color:var(--txt3,#999);font-size:.8rem;padding:.5rem .2rem}'
  + '.md9-foco{background:linear-gradient(135deg,rgba(108,92,231,.08),rgba(0,184,148,.06));border:1px solid var(--borda,#e2e2e6);border-radius:16px;padding:.9rem;margin-bottom:1rem}'
  + '.md9-foco-h{font-weight:800;font-size:.95rem;margin-bottom:.6rem}'
  + '.md9-foco-item{display:flex;gap:.55rem;align-items:center;padding:.4rem 0;border-bottom:1px dashed var(--borda,#eee)}'
  + '.md9-foco-item:last-child{border-bottom:none}'
  + '.md9-foco-num{width:22px;height:22px;flex:none;border-radius:50%;background:var(--cor,#6c5ce7);color:#fff;font-size:.72rem;font-weight:800;display:flex;align-items:center;justify-content:center}'
  + '.md9-foco-tx{font-size:.84rem;font-weight:600}'
  + '.md9-foco-mo{font-size:.7rem;color:var(--txt3,#999)}'
  + '.md9-per{background:var(--card,#fff);border:1px solid var(--borda,#e2e2e6);border-radius:14px;padding:.7rem;margin-bottom:.8rem}'
  + '.md9-per-h{font-weight:700;font-size:.88rem;margin-bottom:.5rem;display:flex;align-items:center;gap:.4rem}'
  + '.md9-per-h .cnt{margin-left:auto;font-size:.72rem;color:var(--txt3,#999)}'
  + '.md9-mv{display:flex;flex-wrap:wrap;gap:.25rem;margin-top:.35rem}'
  + '.md9-mv-b{font-size:.66rem;padding:.15rem .45rem;border-radius:20px;border:1px solid var(--borda,#ddd);background:var(--card2,#f7f7fa);color:var(--txt2,#555);cursor:pointer}'
  + '.md9-mv-b:hover{border-color:var(--cor,#6c5ce7);color:var(--cor,#6c5ce7)}'
  + '.md9-mv-b.atual{background:var(--cor,#6c5ce7);color:#fff;border-color:var(--cor,#6c5ce7)}'
  + '.md9-res{background:var(--card,#fff);border:1px solid var(--borda,#e2e2e6);border-radius:14px;padding:.9rem;margin-bottom:.8rem}'
  + '.md9-res-h{font-weight:800;font-size:.92rem;margin-bottom:.5rem;display:flex;align-items:center;gap:.4rem}'
  + '.md9-res-li{font-size:.82rem;padding:.25rem 0;color:var(--txt2,#444);display:flex;gap:.4rem;align-items:flex-start}'
  + '.md9-res-note{font-size:.72rem;color:var(--txt3,#999);margin-top:.5rem;font-style:italic}'
  + '.md9-mini{font-size:.78rem;color:var(--txt3,#999);margin:-.4rem 0 .8rem}'
  + '@media(max-width:520px){.md9-qa{grid-template-columns:repeat(2,1fr)}.md9-prog-grid{grid-template-columns:repeat(2,1fr)}}';
  var st = document.createElement('style');
  st.id = 'md9Styles';
  st.textContent = css;
  document.head.appendChild(st);
}

// ---- Coleta de dados do dia (reutiliza estado existente) ----
function md9Coletar() {
  var hoje = hojeStr();
  var sk = getSemanaKey(), diaIdx = getDiaSemana();
  var agora = new Date();
  var r = {
    tarefasHoje:[], tarefasSemData:[], tarefasAtrasadas:[], tarefasConcluidas:[],
    eventos:[], lembretes:[], lembretesConcluidos:[],
    provas:[], trabalhos:[], sessoes:[], habitos:[], metas:[], metasConcluidasHoje:[]
  };
  (estado.tarefas || []).forEach(function(t){
    if (t.feito) { if (t.data === hoje || (t.concluidoEm||'').slice(0,10) === hoje) r.tarefasConcluidas.push(t); return; }
    if (t.data === hoje) r.tarefasHoje.push(t);
    else if (!t.data) r.tarefasSemData.push(t);
    else if (t.data < hoje) r.tarefasAtrasadas.push(t);
  });
  (estado.calEventos || []).forEach(function(ev){ if (ev.data === hoje) r.eventos.push(ev); });
  (estado.lembretes || []).forEach(function(l){
    if (l.data !== hoje) return;
    if (l.concluido) r.lembretesConcluidos.push(l);
    else if (l.ativo !== false) r.lembretes.push(l);
  });
  if (estado.estudos) {
    (estado.estudos.provas || []).forEach(function(p){
      if (p.concluido || !p.data) return;
      var dr = Math.ceil((new Date(p.data + 'T12:00:00') - agora) / 86400000);
      if (dr <= 3) r.provas.push({o:p, dr:dr});
    });
    (estado.estudos.trabalhos || []).forEach(function(tb){
      if (tb.status === 'concluido' || tb.status === 'Concluído' || !tb.data) return;
      var dr = Math.ceil((new Date(tb.data + 'T12:00:00') - agora) / 86400000);
      if (dr <= 3) r.trabalhos.push({o:tb, dr:dr});
    });
  }
  (estado.sessoes || []).forEach(function(s){ if (s.data === hoje) r.sessoes.push(s); });
  (estado.habitos || []).forEach(function(h){
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    r.habitos.push({o:h, feito:!!arr[diaIdx]});
  });
  (estado.metas || []).forEach(function(m){
    if (m.feito) { if ((m.concluidaData||'') === hoje) r.metasConcluidasHoje.push(m); return; }
    if (!m.prazo) return;
    var dr = Math.ceil((new Date(m.prazo + 'T12:00:00') - agora) / 86400000);
    if (dr <= 7) r.metas.push({o:m, dr:dr});
  });
  return r;
}

function md9Prog(c) {
  var tarDone = c.tarefasConcluidas.length;
  var tarRest = c.tarefasHoje.length;
  var tarTot = tarDone + tarRest;
  var habTot = c.habitos.length;
  var habDone = c.habitos.filter(function(h){ return h.feito; }).length;
  var estMin = c.sessoes.reduce(function(a,s){ return a + (s.min || 0); }, 0);
  var doneTot = tarDone + habDone;
  var allTot = tarTot + habTot;
  var pct = allTot > 0 ? Math.round(doneTot / allTot * 100) : 0;
  return {tarTot:tarTot, tarDone:tarDone, tarRest:tarRest, habTot:habTot, habDone:habDone, estMin:estMin, pct:pct};
}

function md9FmtMin(m) {
  m = m || 0;
  if (m < 60) return m + ' min';
  var h = Math.floor(m/60), mm = m % 60;
  return h + 'h' + (mm ? (' ' + mm + 'min') : '');
}

function md9PrioLbl(p) { return p === 'alta' ? 'Alta' : p === 'baixa' ? 'Baixa' : 'Média'; }

// monta 1 card de tarefa (com checkbox que conclui e reflete em Tarefas)
function md9CardTarefa(t, extraCls) {
  var atras = eAtrasada(t);
  var cls = 'md9-card' + (extraCls ? ' ' + extraCls : '') + (atras ? ' atras' : '') + (t.feito ? ' done' : '');
  var catE = t.categoria ? ((catEmojis[t.categoria] || '') + ' ') : '';
  var matE = t.materia ? ('<span class="md9-pill" style="background:var(--card2,#eee);color:var(--txt2,#555)">' + esc(t.materia) + '</span>') : '';
  var prio = t.prio || 'media';
  var meta = '';
  if (t.hora) meta += '<span>🕒 ' + esc(t.hora) + '</span>';
  if (atras) meta += '<span class="md9-pill atras">atrasada</span>';
  meta += '<span class="md9-pill ' + prio + '">' + md9PrioLbl(prio) + '</span>';
  if (matE) meta += matE;
  var h = '<div class="' + cls + '" data-busca-id="' + t.id + '">';
  h += '<div class="md9-chk ' + (t.feito?'on':'') + '" onclick="md9ToggleTarefa(\'' + t.id + '\')">' + (t.feito?'✓':'') + '</div>';
  h += '<div class="md9-b"><div class="md9-t">' + catE + esc(t.texto) + '</div>';
  h += '<div class="md9-m">' + meta + '</div></div>';
  h += '<button class="md9-go" title="Abrir em Tarefas" onclick="navegarPara(\'tarefas\')">→</button>';
  h += '</div>';
  return h;
}

// ---- Render principal (override last-wins) ----
function renderMeuDia() {
  md9EnsureStyles();
  var el = document.getElementById('meudiaConteudo');
  if (!el) return;

  // saudacao + data no hero
  var hh = new Date().getHours();
  var greet = hh < 12 ? 'Bom dia' : hh < 18 ? 'Boa tarde' : 'Boa noite';
  var nome = estado.perfil && estado.perfil.nome ? estado.perfil.nome : '';
  var grel = document.getElementById('meudiaGreeting');
  if (grel) grel.textContent = greet + (nome ? ', ' + nome : '') + '! ☀️';
  var diasSem = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var dNow = new Date();
  var dateEl = document.getElementById('meudiaDate');
  if (dateEl) dateEl.textContent = diasSem[dNow.getDay()] + ', ' + dNow.getDate() + ' de ' + meses[dNow.getMonth()];

  var c = md9Coletar();
  var p = md9Prog(c);

  var html = '';
  // progresso do dia (sempre visivel)
  html += '<div class="md9-prog">';
  html += '<div class="md9-prog-top"><span class="md9-prog-lbl">Progresso do dia</span><span class="md9-prog-pct">' + p.pct + '%</span></div>';
  html += '<div class="md9-prog-bar"><div class="md9-prog-fill" style="width:' + p.pct + '%"></div></div>';
  html += '<div class="md9-prog-grid">';
  html += '<div class="md9-prog-cell"><span class="n">' + p.tarDone + '</span><span class="l">Concluídas</span></div>';
  html += '<div class="md9-prog-cell"><span class="n">' + p.tarRest + '</span><span class="l">Restantes</span></div>';
  html += '<div class="md9-prog-cell"><span class="n">' + p.habDone + '/' + p.habTot + '</span><span class="l">Hábitos</span></div>';
  html += '<div class="md9-prog-cell"><span class="n">' + md9FmtMin(p.estMin) + '</span><span class="l">Estudo</span></div>';
  html += '</div></div>';

  // tabs
  var tabs = [{id:'hoje',lbl:'☀️ Hoje'},{id:'planejar',lbl:'🗓️ Planejar'},{id:'resumo',lbl:'🌙 Fim do dia'}];
  html += '<div class="md9-tabs">';
  tabs.forEach(function(t){ html += '<div class="md9-tab ' + (md9Tab===t.id?'ativo':'') + '" onclick="md9SetTab(\'' + t.id + '\')">' + t.lbl + '</div>'; });
  html += '</div>';

  // acoes rapidas (sempre)
  html += '<div class="md9-qa">';
  html += '<button class="md9-qa-btn" onclick="md9NovaTarefa()"><span class="ic">✅</span>Tarefa</button>';
  html += '<button class="md9-qa-btn" onclick="md9NovoEvento()"><span class="ic">📅</span>Evento</button>';
  html += '<button class="md9-qa-btn" onclick="md9NovoHabito()"><span class="ic">🔥</span>Hábito</button>';
  html += '<button class="md9-qa-btn" onclick="md9NovaNota()"><span class="ic">📝</span>Nota</button>';
  html += '<button class="md9-qa-btn" onclick="md9NovoLembrete()"><span class="ic">🔔</span>Lembrete</button>';
  html += '<button class="md9-qa-btn" onclick="md9NovaSessao()"><span class="ic">📚</span>Estudo</button>';
  html += '</div>';

  if (md9Tab === 'hoje') html += md9RenderHoje(c);
  else if (md9Tab === 'planejar') html += md9RenderPlanejar(c);
  else html += md9RenderResumo(c, p);

  el.innerHTML = html;
}

function md9SetTab(t) { md9Tab = t; renderMeuDia(); }

// ---- Aba HOJE ----
function md9RenderHoje(c) {
  var h = '';
  var hoje = hojeStr();

  // Foco agora: prioriza atrasadas importantes + provas urgentes + tarefas alta
  var foco = [];
  c.tarefasAtrasadas.forEach(function(t){ if (t.prio === 'alta' || t.prio === 'media') foco.push({tx:t.texto, ic:'⚠️', mo:'Atrasada · prioridade ' + md9PrioLbl(t.prio).toLowerCase()}); });
  c.provas.forEach(function(x){ if (x.dr <= 0) foco.push({tx:'Prova: ' + x.o.texto, ic:'📝', mo:'É hoje — revise!'}); });
  c.tarefasHoje.forEach(function(t){ if (t.prio === 'alta') foco.push({tx:t.texto, ic:'✅', mo:'Alta prioridade para hoje'}); });
  c.trabalhos.forEach(function(x){ if (x.dr <= 0) foco.push({tx:'Trabalho: ' + x.o.texto, ic:'📄', mo:'Entrega hoje'}); });
  c.provas.forEach(function(x){ if (x.dr > 0 && x.dr <= 2) foco.push({tx:'Prova: ' + x.o.texto, ic:'📝', mo:'Prova em ' + x.dr + ' dia(s)'}); });
  foco = foco.slice(0, 5);
  if (foco.length) {
    h += '<div class="md9-foco"><div class="md9-foco-h">🎯 Foco agora</div>';
    foco.forEach(function(f, i){
      h += '<div class="md9-foco-item"><div class="md9-foco-num">' + (i+1) + '</div><div class="md9-b"><div class="md9-foco-tx">' + f.ic + ' ' + esc(f.tx) + '</div><div class="md9-foco-mo">' + esc(f.mo) + '</div></div></div>';
    });
    h += '</div>';
  }

  // Atrasadas
  if (c.tarefasAtrasadas.length) {
    var atr = c.tarefasAtrasadas.slice().sort(function(a,b){ return prioridadeValor(b.prio) - prioridadeValor(a.prio); });
    h += md9Secao('⚠️', 'Atrasadas', atr.length, atr.map(function(t){ return md9CardTarefa(t, 'atras'); }).join(''));
  }
  // Tarefas de hoje
  h += md9Secao('✅', 'Tarefas de hoje', c.tarefasHoje.length,
      c.tarefasHoje.length ? c.tarefasHoje.map(function(t){ return md9CardTarefa(t, t.prio==='alta'?'foco':''); }).join('') : '<div class="md9-empty">Nenhuma tarefa para hoje.</div>');
  // Sem data
  if (c.tarefasSemData.length) {
    h += md9Secao('📥', 'Tarefas sem data', c.tarefasSemData.length, c.tarefasSemData.map(function(t){ return md9CardTarefa(t); }).join(''));
  }
  // Eventos
  if (c.eventos.length) {
    h += md9Secao('📅', 'Eventos', c.eventos.length, c.eventos.map(function(ev){
      var meta = ev.hora ? '<span>🕒 ' + esc(ev.hora) + '</span>' : '';
      return '<div class="md9-card"><div class="md9-ic">📅</div><div class="md9-b"><div class="md9-t">' + esc(ev.titulo||'Evento') + '</div><div class="md9-m">' + meta + '</div></div><button class="md9-go" onclick="navegarPara(\'calendario\')">→</button></div>';
    }).join(''));
  }
  // Lembretes
  if (c.lembretes.length) {
    h += md9Secao('🔔', 'Lembretes', c.lembretes.length, c.lembretes.map(function(l){
      var meta = l.hora ? '<span>🕒 ' + esc(l.hora) + '</span>' : '';
      return '<div class="md9-card"><div class="md9-chk" onclick="md9ConcluirLembrete(\'' + l.id + '\')"></div><div class="md9-b"><div class="md9-t">' + esc(l.titulo||l.texto||'Lembrete') + '</div><div class="md9-m">' + meta + '</div></div><button class="md9-go" onclick="navegarPara(\'lembretes\')">→</button></div>';
    }).join(''));
  }
  // Estudos (provas/trabalhos + sessoes hoje)
  var estHtml = '';
  c.provas.forEach(function(x){ estHtml += '<div class="md9-card"><div class="md9-ic">📝</div><div class="md9-b"><div class="md9-t">Prova: ' + esc(x.o.texto) + '</div><div class="md9-m">' + (x.o.materia?'<span>'+esc(x.o.materia)+'</span>':'') + '<span>' + (x.dr<=0?'hoje':'em '+x.dr+' dia(s)') + '</span></div></div><button class="md9-go" onclick="navegarPara(\'estudos\')">→</button></div>'; });
  c.trabalhos.forEach(function(x){ estHtml += '<div class="md9-card"><div class="md9-ic">📄</div><div class="md9-b"><div class="md9-t">Trabalho: ' + esc(x.o.texto) + '</div><div class="md9-m">' + (x.o.materia?'<span>'+esc(x.o.materia)+'</span>':'') + '<span>' + (x.dr<=0?'hoje':'em '+x.dr+' dia(s)') + '</span></div></div><button class="md9-go" onclick="navegarPara(\'estudos\')">→</button></div>'; });
  if (c.sessoes.length) {
    var minHoje = c.sessoes.reduce(function(a,s){ return a + (s.min||0); }, 0);
    estHtml += '<div class="md9-card done"><div class="md9-ic">⏱️</div><div class="md9-b"><div class="md9-t">' + c.sessoes.length + ' sessão(ões) hoje</div><div class="md9-m"><span>' + md9FmtMin(minHoje) + ' estudados</span></div></div></div>';
  }
  if (estHtml) h += md9Secao('📚', 'Estudos', c.provas.length + c.trabalhos.length + (c.sessoes.length?1:0), estHtml);
  // Habitos
  if (c.habitos.length) {
    var habHtml = c.habitos.map(function(x){
      return '<div class="md9-card ' + (x.feito?'done':'') + '"><div class="md9-chk ' + (x.feito?'on':'') + '" onclick="md9ToggleHabito(\'' + x.o.id + '\')">' + (x.feito?'✓':'') + '</div><div class="md9-b"><div class="md9-t">' + (x.o.emoji||'✨') + ' ' + esc(x.o.nome) + '</div></div><button class="md9-go" onclick="navegarPara(\'habitos\')">→</button></div>';
    }).join('');
    var habDone = c.habitos.filter(function(x){return x.feito;}).length;
    h += md9Secao('🔥', 'Hábitos', habDone + '/' + c.habitos.length, habHtml);
  }
  // Metas relacionadas
  if (c.metas.length) {
    h += md9Secao('🎯', 'Metas relacionadas', c.metas.length, c.metas.map(function(x){
      return '<div class="md9-card"><div class="md9-ic">🎯</div><div class="md9-b"><div class="md9-t">' + esc(x.o.texto) + '</div><div class="md9-m"><span>' + (x.dr<=0?'prazo hoje':'prazo em '+x.dr+' dia(s)') + '</span><span class="md9-pill" style="background:var(--card2,#eee);color:var(--txt2,#555)">' + (x.o.progresso||0) + '%</span></div></div><button class="md9-go" onclick="navegarPara(\'metas\')">→</button></div>';
    }).join(''));
  }

  var vazio = !c.tarefasHoje.length && !c.tarefasSemData.length && !c.tarefasAtrasadas.length && !c.eventos.length && !c.lembretes.length && !c.provas.length && !c.trabalhos.length && !c.habitos.length && !c.metas.length && !c.sessoes.length;
  if (vazio) h += '<div class="md9-empty" style="text-align:center;padding:1.5rem">☀️ Seu dia está livre! Use as ações rápidas acima para planejar.</div>';
  return h;
}

function md9Secao(icon, titulo, cnt, inner) {
  return '<div class="md9-sec"><div class="md9-sec-h">' + icon + ' <span>' + titulo + '</span><span class="cnt">' + cnt + '</span></div>' + inner + '</div>';
}

// ---- Aba PLANEJAR (por períodos) ----
function md9RenderPlanejar(c) {
  var h = '<div class="md9-mini">Organize os itens do dia por período. Use os botões para mover.</div>';
  // agrupa itens agendáveis: tarefas de hoje + sem data + eventos + lembretes
  var itens = [];
  c.tarefasHoje.forEach(function(t){ itens.push({tipo:'tarefa', id:t.id, o:t, hora:t.hora}); });
  c.tarefasSemData.forEach(function(t){ itens.push({tipo:'tarefa', id:t.id, o:t, hora:t.hora}); });
  c.eventos.forEach(function(ev){ itens.push({tipo:'evento', id:ev.id, o:ev, hora:ev.hora}); });
  c.lembretes.forEach(function(l){ itens.push({tipo:'lembrete', id:l.id, o:l, hora:l.hora}); });

  var porPeriodo = {manha:[], tarde:[], noite:[], semhora:[]};
  itens.forEach(function(it){ porPeriodo[md9ItemPeriodo(it.o)].push(it); });

  md9Periodos.forEach(function(per){
    var arr = porPeriodo[per.id];
    h += '<div class="md9-per"><div class="md9-per-h">' + per.icon + ' <span>' + per.lbl + '</span><span class="cnt">' + arr.length + '</span></div>';
    if (!arr.length) { h += '<div class="md9-empty">Nada neste período.</div>'; }
    else {
      arr.sort(function(a,b){ return (a.hora||'99:99').localeCompare(b.hora||'99:99'); });
      arr.forEach(function(it){ h += md9CardPlanejar(it, per.id); });
    }
    h += '</div>';
  });
  return h;
}

function md9CardPlanejar(it, periodoAtual) {
  var o = it.o, tipo = it.tipo;
  var titulo = tipo === 'tarefa' ? o.texto : (tipo === 'evento' ? (o.titulo||'Evento') : (o.titulo||o.texto||'Lembrete'));
  var ic = tipo === 'tarefa' ? '✅' : tipo === 'evento' ? '📅' : '🔔';
  var feito = tipo === 'tarefa' && o.feito;
  var h = '<div class="md9-card ' + (feito?'done':'') + '">';
  if (tipo === 'tarefa') h += '<div class="md9-chk ' + (feito?'on':'') + '" onclick="md9ToggleTarefa(\'' + o.id + '\')">' + (feito?'✓':'') + '</div>';
  else h += '<div class="md9-ic">' + ic + '</div>';
  h += '<div class="md9-b"><div class="md9-t">' + esc(titulo) + '</div>';
  h += '<div class="md9-m">' + (o.hora?'<span>🕒 ' + esc(o.hora) + '</span>':'<span>sem hora</span>') + '</div>';
  // botoes de mover
  h += '<div class="md9-mv">';
  md9Periodos.forEach(function(per){
    var cur = (per.id === periodoAtual) ? ' atual' : '';
    h += '<button class="md9-mv-b' + cur + '" onclick="md9Mover(\'' + tipo + '\',\'' + it.id + '\',\'' + per.id + '\')">' + per.icon + ' ' + per.lbl + '</button>';
  });
  h += '</div></div></div>';
  return h;
}

// ---- Aba RESUMO / FIM DO DIA ----
function md9RenderResumo(c, p) {
  var h = '<div class="md9-mini">Resumo do dia. Nada é apagado automaticamente — o que ficou pendente continua para depois.</div>';

  // Concluído
  var conc = '';
  c.tarefasConcluidas.forEach(function(t){ conc += '<div class="md9-res-li">✅ ' + esc(t.texto) + '</div>'; });
  c.lembretesConcluidos.forEach(function(l){ conc += '<div class="md9-res-li">🔔 ' + esc(l.titulo||l.texto||'Lembrete') + '</div>'; });
  c.metasConcluidasHoje.forEach(function(m){ conc += '<div class="md9-res-li">🎯 Meta: ' + esc(m.texto) + '</div>'; });
  c.habitos.filter(function(x){return x.feito;}).forEach(function(x){ conc += '<div class="md9-res-li">' + (x.o.emoji||'🔥') + ' ' + esc(x.o.nome) + '</div>'; });
  if (!conc) conc = '<div class="md9-empty">Nada concluído ainda hoje.</div>';
  h += '<div class="md9-res"><div class="md9-res-h">✅ O que foi concluído</div>' + conc + '</div>';

  // Pendente
  var pend = '';
  c.tarefasAtrasadas.forEach(function(t){ pend += '<div class="md9-res-li">⚠️ ' + esc(t.texto) + ' <span class="md9-pill atras">atrasada</span></div>'; });
  c.tarefasHoje.forEach(function(t){ pend += '<div class="md9-res-li">⬜ ' + esc(t.texto) + '</div>'; });
  c.lembretes.forEach(function(l){ pend += '<div class="md9-res-li">🔔 ' + esc(l.titulo||l.texto||'Lembrete') + '</div>'; });
  c.eventos.forEach(function(ev){ pend += '<div class="md9-res-li">📅 ' + esc(ev.titulo||'Evento') + '</div>'; });
  if (!pend) pend = '<div class="md9-empty">Nada pendente — dia limpo! 🎉</div>';
  h += '<div class="md9-res"><div class="md9-res-h">🕒 O que ficou pendente</div>' + pend + '<div class="md9-res-note">Itens pendentes não são apagados; eles continuam disponíveis para outro dia.</div></div>';

  // Habitos
  var hab = '';
  c.habitos.forEach(function(x){ hab += '<div class="md9-res-li">' + (x.feito?'✅':'⬜') + ' ' + (x.o.emoji||'🔥') + ' ' + esc(x.o.nome) + '</div>'; });
  if (!hab) hab = '<div class="md9-empty">Nenhum hábito cadastrado.</div>';
  h += '<div class="md9-res"><div class="md9-res-h">🔥 Hábitos cumpridos (' + p.habDone + '/' + p.habTot + ')</div>' + hab + '</div>';

  // Estudos
  var est = '';
  if (c.sessoes.length) {
    c.sessoes.forEach(function(s){ est += '<div class="md9-res-li">⏱️ ' + md9FmtMin(s.min) + (s.materia?(' · ' + esc(s.materia)):'') + '</div>'; });
    est += '<div class="md9-res-li" style="font-weight:700">Total: ' + md9FmtMin(p.estMin) + '</div>';
  } else est = '<div class="md9-empty">Nenhuma sessão de estudo registrada hoje.</div>';
  h += '<div class="md9-res"><div class="md9-res-h">📚 Estudos realizados</div>' + est + '</div>';

  return h;
}

// ---- Ações / toggles do Meu Dia ----
function md9RefreshSeVisivel() {
  try {
    var pm = document.getElementById('page-meudia');
    if (pm && pm.classList.contains('ativo')) renderMeuDia();
  } catch (e) {}
}

// Conclui tarefa a partir do Meu Dia — reflete na área de Tarefas
// (altera o MESMO objeto em estado.tarefas, sem criar cópia)
function md9ToggleTarefa(id) {
  var t = estado.tarefas.find(function(x){ return x.id === id; });
  if (!t) return;
  t.feito = !t.feito;
  t.status = t.feito ? 'concluida' : 'pendente';
  t.concluidoEm = t.feito ? new Date().toISOString() : '';
  salvarEstado();
  renderMeuDia();
  try { if (typeof renderTarefas === 'function') { var pt = document.getElementById('page-tarefas'); if (pt && pt.classList.contains('ativo')) renderTarefas(); } } catch (e) {}
  if (t.feito) { try { if (typeof registrarUsoPlus === 'function') registrarUsoPlus(); } catch (e) {} }
  if (typeof showToast === 'function') showToast(t.feito ? 'Tarefa concluída 🎉' : 'Tarefa reaberta');
}

function md9ToggleHabito(id) {
  var h = estado.habitos.find(function(x){ return x.id === id; });
  if (!h) return;
  var sk = getSemanaKey(), diaIdx = getDiaSemana();
  if (!h.semanas[sk]) h.semanas[sk] = [false,false,false,false,false,false,false];
  h.semanas[sk][diaIdx] = !h.semanas[sk][diaIdx];
  salvarEstado();
  renderMeuDia();
}

function md9ConcluirLembrete(id) {
  if (typeof lembreteConcluir === 'function') { lembreteConcluir(id); md9RefreshSeVisivel(); return; }
  var l = estado.lembretes.find(function(x){ return x.id === id; });
  if (l) { l.concluido = true; l.ativo = false; salvarEstado(); renderMeuDia(); }
}

// Mover item entre períodos (persiste .periodo no próprio objeto)
function md9Mover(tipo, id, periodo) {
  var arr = tipo === 'tarefa' ? estado.tarefas : tipo === 'evento' ? estado.calEventos : estado.lembretes;
  var o = (arr || []).find(function(x){ return x.id === id; });
  if (!o) return;
  o.periodo = periodo;
  salvarEstado();
  renderMeuDia();
  if (typeof showToast === 'function') showToast('Movido para ' + md9PeriodoLbl(periodo));
}

// ---- Criar rapidamente ----
function md9EnsureModal() {
  if (md9ModalOk || document.getElementById('md9TarefaModal')) { md9ModalOk = true; return; }
  md9ModalOk = true;
  var perOpts = '<option value="auto">Automático (pela hora)</option>'
    + md9Periodos.map(function(p){ return '<option value="' + p.id + '">' + p.icon + ' ' + p.lbl + '</option>'; }).join('');
  var html = '<div class="tk-modal" onclick="event.stopPropagation()">'
    + '<div class="tk-modal-head"><h3>✅ Nova tarefa de hoje</h3><button class="tk-modal-x" onclick="md9FecharTarefa()">✕</button></div>'
    + '<div class="tk-modal-body">'
    + '<div class="tk-field"><label class="tk-lbl">✨ Título *</label><input class="campo" id="md9tNome" placeholder="Ex: Estudar matemática"></div>'
    + '<div class="tk-adv-grid">'
    + '<div class="tk-field" style="width:120px"><label class="tk-lbl">⏰ Hora</label><input class="campo" id="md9tHora" type="time"></div>'
    + '<div class="tk-field" style="flex:1"><label class="tk-lbl">⚡ Prioridade</label><select class="campo" id="md9tPrio"><option value="baixa">Baixa</option><option value="media" selected>Média</option><option value="alta">Alta</option></select></div>'
    + '</div>'
    + '<div class="tk-field"><label class="tk-lbl">🗓️ Período</label><select class="campo" id="md9tPer">' + perOpts + '</select></div>'
    + '</div>'
    + '<div class="tk-modal-foot"><button class="btn btn-s" onclick="md9FecharTarefa()">Cancelar</button><button class="btn btn-p" onclick="md9SalvarTarefa()">💾 Adicionar</button></div>'
    + '</div>';
  var bg = document.createElement('div');
  bg.className = 'tk-modal-bg';
  bg.id = 'md9TarefaModal';
  bg.setAttribute('role','dialog');
  bg.onclick = function(e){ md9FecharTarefa(e); };
  bg.innerHTML = html;
  document.body.appendChild(bg);
}

function md9NovaTarefa() {
  md9EnsureModal();
  document.getElementById('md9tNome').value = '';
  document.getElementById('md9tHora').value = '';
  document.getElementById('md9tPrio').value = 'media';
  document.getElementById('md9tPer').value = 'auto';
  document.getElementById('md9TarefaModal').classList.add('visivel');
  setTimeout(function(){ var f = document.getElementById('md9tNome'); if (f) f.focus(); }, 50);
}
function md9FecharTarefa(e) {
  if (e && e.target && !e.target.classList.contains('tk-modal-bg')) return;
  var m = document.getElementById('md9TarefaModal');
  if (m) m.classList.remove('visivel');
}
function md9SalvarTarefa() {
  var nome = document.getElementById('md9tNome').value.trim();
  if (!nome) { document.getElementById('md9tNome').focus(); return; }
  var hora = document.getElementById('md9tHora').value || '';
  var prio = document.getElementById('md9tPrio').value || 'media';
  var per = document.getElementById('md9tPer').value || 'auto';
  var t = {
    id: uid(), texto: nome, descricao: '', materia: '', data: hojeStr(), hora: hora,
    prio: prio, categoria: '', status: 'pendente', obs: '', etiquetas: [],
    feito: false, criado: new Date().toISOString(),
    lembrete: estado.notifConfig ? estado.notifConfig.tarefas : 1
  };
  if (per && per !== 'auto') t.periodo = per;
  estado.tarefas.push(t);
  salvarEstado();
  md9FecharTarefa();
  renderMeuDia();
  if (typeof scheduleAllNotificacoes === 'function') { try { scheduleAllNotificacoes(); } catch (e) {} }
  if (typeof showToast === 'function') showToast('Tarefa criada ✓');
}

function md9NovoEvento()  { if (typeof abrirCalEventoModal === 'function') abrirCalEventoModal(); else navegarPara('calendario'); }
function md9NovoHabito()  { if (typeof abrirHabitoModal === 'function') abrirHabitoModal(); else navegarPara('habitos'); }
function md9NovaNota()    { if (typeof abrirNotaModal === 'function') abrirNotaModal(); else navegarPara('notas'); }
function md9NovoLembrete(){ if (typeof abrirLembreteModal === 'function') abrirLembreteModal(); else navegarPara('lembretes'); }
function md9NovaSessao()  { if (typeof esAbrirSessaoModal === 'function') esAbrirSessaoModal(); else navegarPara('estudos'); }

// ---- Refresca Meu Dia após CRUD global (mantém Dashboard também) ----
function atualizarDashboardSeVisivel() {
  try {
    var pg = document.getElementById('page-inicio');
    if (pg && pg.classList.contains('ativo')) renderDashboard();
  } catch (_) {}
  try {
    var pm = document.getElementById('page-meudia');
    if (pm && pm.classList.contains('ativo') && typeof renderMeuDia === 'function') renderMeuDia();
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', function () {
  try { md9EnsureStyles(); } catch (e) {}
});


// ============================================================
// ETAPA 10 — Assistente virtual OrganizaIA (anexado)
// ============================================================

// ============================================================
// ETAPA 10 — OrganizaIA como ASSISTENTE VIRTUAL (2 modos)
// 1) ORGANIZAÇÃO (usa dados do OrganizaJá)
// 2) PERGUNTAS & CONVERSA (conhecimento geral, estudo, matemática)
// Detecta comandos que alteram dados e SEMPRE pede confirmação.
// Integração com IA externa é opcional e NUNCA guarda chaves no código.
// (Funções top-level: as declarações abaixo sobrescrevem as antigas.)
// ============================================================

var OIA_CFG_KEY = 'oj_ia_config';   // config da IA externa (só no dispositivo)
var oia10Pend = {};                 // ações pendentes de confirmação (runtime)

// ---- Config da IA externa (fica SOMENTE no localStorage do usuário) ----
function oia10Config() {
  try {
    var raw = localStorage.getItem(OIA_CFG_KEY);
    if (!raw) return null;
    var c = JSON.parse(raw);
    if (c && c.endpoint && c.apiKey) return c;
    return null;
  } catch (e) { return null; }
}
function oia10ConfigAtiva() { return !!oia10Config(); }

// ---- Base de conhecimento local (respostas úteis mesmo offline) ----
// Não substitui uma IA externa; cobre perguntas comuns dos exemplos.
var oia10KB = [
  { k: ['sistema solar'], html: '\u2600\uFE0F <strong>O Sistema Solar</strong> \u00e9 o conjunto formado pelo <strong>Sol</strong> e por tudo que gira ao redor dele pela gravidade: os <strong>8 planetas</strong> (Merc\u00fario, V\u00eanus, Terra, Marte, J\u00fapiter, Saturno, Urano e Netuno), luas, planetas an\u00f5es (como Plut\u00e3o), asteroides e cometas.<br><br>O Sol concentra quase toda a massa e fornece luz e calor. Os quatro planetas mais pr\u00f3ximos s\u00e3o rochosos; os quatro mais distantes s\u00e3o gigantes gasosos/gelados.' },
  { k: ['big bang'], html: '\uD83D\uDCA5 <strong>O Big Bang</strong>, de forma simples: h\u00e1 cerca de <strong>13,8 bilh\u00f5es de anos</strong>, todo o universo estava concentrado num ponto extremamente quente e denso. Ele come\u00e7ou a se <strong>expandir</strong> muito rapidamente \u2014 e continua se expandindo at\u00e9 hoje.<br><br>Com o tempo, a mat\u00e9ria esfriou e se juntou formando \u00e1tomos, estrelas, gal\u00e1xias e planetas. N\u00e3o foi uma \u201cexplos\u00e3o no espa\u00e7o\u201d, mas uma expans\u00e3o do pr\u00f3prio espa\u00e7o.' },
  { k: ['descobriu o brasil', 'descobrimento do brasil', 'quem descobriu o brasil'], html: '\uD83C\uDDE7\uD83C\uDDF7 O Brasil foi oficialmente \u201cdescoberto\u201d pelos portugueses em <strong>22 de abril de 1500</strong>, numa expedi\u00e7\u00e3o comandada por <strong>Pedro \u00c1lvares Cabral</strong>.<br><br>Vale lembrar que o territ\u00f3rio j\u00e1 era habitado h\u00e1 milhares de anos por <strong>povos ind\u00edgenas</strong> \u2014 por isso muitos preferem falar em \u201cchegada dos portugueses\u201d.' },
  { k: ['capitais do brasil', 'capital do brasil', 'quais s\u00e3o as capitais', 'quais sao as capitais'], html: '\uD83D\uDDFA\uFE0F A capital do <strong>Brasil</strong> \u00e9 <strong>Bras\u00edlia</strong>. Cada estado tamb\u00e9m tem sua capital \u2014 alguns exemplos:<br>\u2022 S\u00e3o Paulo (SP), Rio de Janeiro (RJ), Belo Horizonte (MG)<br>\u2022 Salvador (BA), Recife (PE), Fortaleza (CE)<br>\u2022 Curitiba (PR), Porto Alegre (RS), Florian\u00f3polis (SC)<br>\u2022 Manaus (AM), Bel\u00e9m (PA), Goi\u00e2nia (GO)<br><br>Quer a lista completa dos 26 estados + DF? \u00c9 s\u00f3 pedir!' }
];
function oia10BuscarKB(lower) {
  for (var i = 0; i < oia10KB.length; i++) {
    var termos = oia10KB[i].k;
    for (var j = 0; j < termos.length; j++) {
      if (lower.indexOf(termos[j]) !== -1) return oia10KB[i].html;
    }
  }
  return null;
}

// ---- Normaliza texto (remove acentos p/ comparação) ----
function oia10Norm(s) {
  return (s || '').toLowerCase()
    .normalize ? (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : (s || '').toLowerCase();
}

// ---- Avaliador de expressão matemática (shunting-yard, SEM eval) ----
function oia10CalcExpr(expr) {
  var tokens = expr.match(/(\d+(?:[.,]\d+)?|[+\-*/()%^])/g);
  if (!tokens) return null;
  // shunting-yard -> RPN
  var out = [], ops = [];
  var prec = { '+':1, '-':1, '*':2, '/':2, '%':2, '^':3 };
  var rightAssoc = { '^':true };
  for (var i = 0; i < tokens.length; i++) {
    var tk = tokens[i];
    if (/^\d/.test(tk)) {
      out.push(parseFloat(tk.replace(',', '.')));
    } else if (tk === '(') {
      ops.push(tk);
    } else if (tk === ')') {
      while (ops.length && ops[ops.length-1] !== '(') out.push(ops.pop());
      if (!ops.length) return null;
      ops.pop();
    } else if (prec[tk]) {
      while (ops.length) {
        var top = ops[ops.length-1];
        if (top === '(') break;
        if (prec[top] > prec[tk] || (prec[top] === prec[tk] && !rightAssoc[tk])) out.push(ops.pop());
        else break;
      }
      ops.push(tk);
    } else return null;
  }
  while (ops.length) { var o = ops.pop(); if (o === '(') return null; out.push(o); }
  // avalia RPN
  var st = [];
  for (var k = 0; k < out.length; k++) {
    var t = out[k];
    if (typeof t === 'number') { st.push(t); continue; }
    if (st.length < 2) return null;
    var b = st.pop(), a = st.pop(), r;
    if (t === '+') r = a + b;
    else if (t === '-') r = a - b;
    else if (t === '*') r = a * b;
    else if (t === '/') { if (b === 0) return 'DIV0'; r = a / b; }
    else if (t === '%') { if (b === 0) return 'DIV0'; r = a % b; }
    else if (t === '^') r = Math.pow(a, b);
    else return null;
    st.push(r);
  }
  if (st.length !== 1) return null;
  return st[0];
}

// ---- Detecta e resolve matemática em linguagem natural ----
function oia10Matematica(msg) {
  var s = oia10Norm(msg);
  // porcentagem: "X% de Y"
  var mp = s.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por\s*cento)\s*de\s*(\d+(?:[.,]\d+)?)/);
  if (mp) {
    var p = parseFloat(mp[1].replace(',', '.'));
    var base = parseFloat(mp[2].replace(',', '.'));
    var res = base * p / 100;
    return { text: 'Resultado: ' + oia10FmtNum(res), html: '\uD83E\uDDEE <strong>' + oia10FmtNum(p) + '% de ' + oia10FmtNum(base) + ' = ' + oia10FmtNum(res) + '</strong>' };
  }
  // substitui palavras/símbolos por operadores
  var e = s
    .replace(/vezes|multiplicado por|x|\u00d7/g, '*')
    .replace(/dividido por|dividido|\u00f7|:/g, '/')
    .replace(/mais|somar?|soma de/g, '+')
    .replace(/menos|subtrair|diferen\u00e7a de|diferenca de/g, '-')
    .replace(/elevado a|elevado/g, '^')
    .replace(/[^0-9+\-*/()%^.,]/g, ' ');
  // precisa ter ao menos um operador e um número
  if (!/[+\-*/%^]/.test(e) || !/\d/.test(e)) return null;
  var val = oia10CalcExpr(e.trim());
  if (val === 'DIV0') return { text: 'N\u00e3o d\u00e1 para dividir por zero.', html: '\u26a0\uFE0F N\u00e3o \u00e9 poss\u00edvel dividir por zero.' };
  if (val === null || typeof val !== 'number' || !isFinite(val)) return null;
  return { text: 'Resultado: ' + oia10FmtNum(val), html: '\uD83E\uDDEE <strong>= ' + oia10FmtNum(val) + '</strong>' };
}

function oia10FmtNum(n) {
  if (Math.round(n) === n) return String(n);
  return String(Math.round(n * 1000000) / 1000000).replace('.', ',');
}

// ---- Interpreta data em linguagem natural -> 'AAAA-MM-DD' ou '' ----
function oia10ParseData(msg) {
  var s = oia10Norm(msg);
  var hoje = hojeStr();
  if (/depois de amanha/.test(s)) return addDias(hoje, 2);
  if (/amanha/.test(s)) return addDias(hoje, 1);
  if (/hoje/.test(s)) return hoje;
  // dd/mm ou dd-mm ou dd/mm/aaaa
  var m = s.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (m) {
    var d = parseInt(m[1], 10), mo = parseInt(m[2], 10);
    var y = m[3] ? parseInt(m[3], 10) : (new Date()).getFullYear();
    if (y < 100) y += 2000;
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
      return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2);
    }
  }
  // dias da semana
  var dias = { domingo:0, segunda:1, terca:2, quarta:3, quinta:4, sexta:5, sabado:6 };
  for (var nome in dias) {
    if (s.indexOf(nome) !== -1) {
      var alvo = dias[nome];
      var base = new Date();
      var atual = base.getDay();
      var delta = (alvo - atual + 7) % 7;
      if (delta === 0) delta = 7; // próxima ocorrência
      return addDias(hoje, delta);
    }
  }
  return '';
}

// ---- Interpreta hora 'HH:MM' ou 'às 14h' ----
function oia10ParseHora(msg) {
  var s = oia10Norm(msg);
  var m = s.match(/(\d{1,2})\s*(?::|h)\s*(\d{2})?/);
  if (m) {
    var h = parseInt(m[1], 10);
    var mi = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 0 && h <= 23 && mi >= 0 && mi <= 59) return ('0' + h).slice(-2) + ':' + ('0' + mi).slice(-2);
  }
  return '';
}

// ---- Limpa o título removendo palavras de data/verbos ----
function oia10LimparTitulo(t) {
  if (!t) return '';
  t = t.replace(/\s+(para|pra|no dia|dia|as|\u00e0s|as)\s+.*$/i, ' ');
  t = t.replace(/\b(hoje|amanh\u00e3|amanha|depois de amanh\u00e3|depois de amanha|segunda|ter\u00e7a|terca|quarta|quinta|sexta|s\u00e1bado|sabado|domingo)\b/gi, ' ');
  t = t.replace(/\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/g, ' ');
  t = t.replace(/\d{1,2}\s*(?::|h)\s*\d{0,2}/g, ' ');
  t = t.replace(/["'\u201c\u201d]/g, '');
  return t.replace(/\s+/g, ' ').trim();
}

// ---- Detecta e interpreta COMANDOS que alteram dados (tipo D) ----
function oia10ParseComando(msg) {
  var s = oia10Norm(msg);
  var criar = /(criar?|crie|cria|adicion(?:ar|e|a)|nova?|novo|agend(?:ar|e|a)|marcar?|marque|conclu|apag(?:ar|ue|a)|exclu(?:ir|a)|remov(?:er|a))/.test(s);
  if (!criar) return null;

  // Excluir / apagar (destrutivo) - SEMPRE confirmação
  if (/(apag|exclu|remov|delet)/.test(s) && /tarefa/.test(s)) {
    var alvo = msg.replace(/.*?(?:tarefa)\s*/i, '').trim();
    return { acao: 'excluir_tarefa', alvo: alvo, destrutivo: true };
  }
  // Marcar tarefa como concluída
  if (/(conclu|marque|marcar|feita|feito|terminei|fiz)/.test(s) && /tarefa/.test(s)) {
    var alvoC = msg.replace(/.*?(?:tarefa)\s*/i, '').replace(/\bcomo\b.*$/i, '').replace(/(conclu\w*|feita|feito)/gi, '').trim();
    return { acao: 'concluir_tarefa', alvo: alvoC };
  }

  var data = oia10ParseData(msg);
  var hora = oia10ParseHora(msg);

  // Criar LEMBRETE
  if (/lembrete|lembr(?:ar|e)|me lembre/.test(s)) {
    var tl = oia10ExtrairTitulo(msg, /(?:lembrete|lembrar|lembre)(?:\s+(?:de|para|pra|que))?\s*:?\s*/i);
    return { acao: 'criar_lembrete', titulo: oia10LimparTitulo(tl), data: data, hora: hora };
  }
  // Criar META
  if (/\bmeta\b|objetivo/.test(s)) {
    var tm = oia10ExtrairTitulo(msg, /(?:meta|objetivo)(?:\s+(?:de|para|pra))?\s*:?\s*/i);
    return { acao: 'criar_meta', titulo: oia10LimparTitulo(tm), data: data };
  }
  // Criar HÁBITO
  if (/h\u00e1bito|habito/.test(s)) {
    var th = oia10ExtrairTitulo(msg, /(?:h\u00e1bito|habito)(?:\s+(?:de|para|pra))?\s*:?\s*/i);
    return { acao: 'criar_habito', titulo: oia10LimparTitulo(th) };
  }
  // Criar EVENTO
  if (/evento|compromisso|reuni\u00e3o|reuniao|agendar/.test(s)) {
    var te = oia10ExtrairTitulo(msg, /(?:evento|compromisso|reuni\u00e3o|reuniao|agendar)(?:\s+(?:de|para|pra|:))?\s*/i);
    return { acao: 'criar_evento', titulo: oia10LimparTitulo(te), data: data || hojeStr(), hora: hora };
  }
  // Criar TAREFA (padrão)
  if (/tarefa|fazer|estudar|revisar|ler|treinar|exerc\u00edcio|exercicio/.test(s)) {
    var tt = oia10ExtrairTitulo(msg, /(?:tarefa\s+(?:chamada|de|:)?|criar?|crie|cria|adicion(?:ar|e|a)|nova?|novo)\s*/i);
    var titulo = oia10LimparTitulo(tt);
    if (!titulo) titulo = oia10LimparTitulo(msg);
    return { acao: 'criar_tarefa', titulo: titulo, data: data, hora: hora };
  }
  return null;
}

function oia10ExtrairTitulo(msg, regexPrefix) {
  var t = msg.replace(regexPrefix, '');
  // corta a partir de 'chamada/chamado'
  t = t.replace(/^(?:chamad[ao]|com o nome|de nome)\s*/i, '');
  return t.trim();
}

// ---- Cartão de confirmação de comando (com botões) ----
function oia10RotuloAcao(a) {
  switch (a.acao) {
    case 'criar_tarefa':   return 'criar a tarefa';
    case 'criar_lembrete': return 'criar o lembrete';
    case 'criar_meta':     return 'criar a meta';
    case 'criar_habito':   return 'criar o h\u00e1bito';
    case 'criar_evento':   return 'criar o evento';
    case 'concluir_tarefa':return 'marcar a tarefa como conclu\u00edda';
    case 'excluir_tarefa': return 'excluir a tarefa';
  }
  return 'realizar esta a\u00e7\u00e3o';
}

function oia10CardComando(a, token, status) {
  var detalhes = '';
  if (a.titulo) detalhes += '<div class="oia10-det"><span>\uD83D\uDCDD</span> <strong>' + esc(a.titulo || '(sem t\u00edtulo)') + '</strong></div>';
  if (a.alvo)   detalhes += '<div class="oia10-det"><span>\uD83C\uDFAF</span> ' + esc(a.alvo) + '</div>';
  if (a.data)   detalhes += '<div class="oia10-det"><span>\uD83D\uDCC5</span> ' + esc(oia10DataLegivel(a.data)) + '</div>';
  if (a.hora)   detalhes += '<div class="oia10-det"><span>\uD83D\uDD52</span> ' + esc(a.hora) + '</div>';

  var head = a.destrutivo
    ? '\u26a0\uFE0F Quer mesmo que eu <strong>' + oia10RotuloAcao(a) + '</strong>? Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.'
    : '\uD83E\uDD16 Entendi! Voc\u00ea confirma que eu devo <strong>' + oia10RotuloAcao(a) + '</strong>?';

  var body = '<div class="oia10-card' + (a.destrutivo ? ' oia10-card-danger' : '') + '">' + head
    + '<div class="oia10-card-body">' + (detalhes || '<div class="oia10-det">Sem detalhes adicionais.</div>') + '</div>';

  if (status === 'pendente') {
    body += '<div class="oia10-card-acts">'
      + '<button class="oia10-btn oia10-btn-ok" onclick="oia10Confirmar(\'' + token + '\')">\u2705 Confirmar</button>'
      + '<button class="oia10-btn oia10-btn-no" onclick="oia10Cancelar(\'' + token + '\')">\u2716 Cancelar</button>'
      + '</div>'
      + '<div class="oia10-card-note">Nada foi alterado ainda \u2014 s\u00f3 mudo os dados se voc\u00ea confirmar.</div>';
  } else if (status === 'confirmado') {
    body += '<div class="oia10-card-done">\u2705 Feito! A\u00e7\u00e3o realizada.</div>';
  } else if (status === 'cancelado') {
    body += '<div class="oia10-card-done oia10-cancel">\u2716 Cancelado \u2014 nenhum dado foi alterado.</div>';
  } else if (status === 'expirado') {
    body += '<div class="oia10-card-done oia10-cancel">\u23F1\uFE0F Este pedido expirou. Se quiser, pe\u00e7a de novo.</div>';
  } else if (status === 'naoencontrado') {
    body += '<div class="oia10-card-done oia10-cancel">\uD83D\uDD0D N\u00e3o encontrei um item correspondente. Nada foi alterado.</div>';
  }
  body += '</div>';
  return body;
}

function oia10DataLegivel(d) {
  if (!d) return '';
  var hoje = hojeStr();
  if (d === hoje) return 'hoje (' + d.slice(8) + '/' + d.slice(5,7) + ')';
  if (d === addDias(hoje, 1)) return 'amanh\u00e3 (' + d.slice(8) + '/' + d.slice(5,7) + ')';
  return d.slice(8) + '/' + d.slice(5,7) + '/' + d.slice(0,4);
}

// ---- Confirmar comando pendente -> altera os dados de verdade ----
function oia10Confirmar(token) {
  var msg = oia10AcharMsg(token);
  if (!msg || !msg.pend || msg.status !== 'pendente') return;
  var a = msg.pend;
  var ok = oia10Executar(a);
  msg.status = ok === 'naoencontrado' ? 'naoencontrado' : 'confirmado';
  msg.html = oia10CardComando(a, token, msg.status);
  delete oia10Pend[token];
  salvarHistoricoIA();
  renderHistoricoIA();
  if (ok && ok !== 'naoencontrado') {
    try { atualizarDashboardSeVisivel(); } catch (e) {}
    try { if (typeof scheduleAllNotificacoes === 'function') scheduleAllNotificacoes(); } catch (e) {}
    if (typeof showToast === 'function') showToast('A\u00e7\u00e3o realizada pelo OrganizaIA \u2713');
  }
}

function oia10Cancelar(token) {
  var msg = oia10AcharMsg(token);
  if (!msg || msg.status !== 'pendente') return;
  msg.status = 'cancelado';
  msg.html = oia10CardComando(msg.pend, token, 'cancelado');
  delete oia10Pend[token];
  salvarHistoricoIA();
  renderHistoricoIA();
}

function oia10AcharMsg(token) {
  for (var i = 0; i < oiaHistorico.length; i++) {
    if (oiaHistorico[i].token === token) return oiaHistorico[i];
  }
  return null;
}

// ---- Executa de fato a ação (só chamado após confirmação) ----
function oia10Executar(a) {
  if (a.acao === 'criar_tarefa') {
    estado.tarefas.push({
      id: uid(), texto: a.titulo || 'Nova tarefa', descricao: '', materia: '',
      data: a.data || '', hora: a.hora || '', prio: 'media', categoria: '',
      status: 'pendente', obs: '', etiquetas: [], feito: false,
      criado: new Date().toISOString(),
      lembrete: estado.notifConfig ? estado.notifConfig.tarefas : 1
    });
    salvarEstado();
    try { if (typeof renderTarefas === 'function') renderTarefas(); } catch (e) {}
    return true;
  }
  if (a.acao === 'criar_lembrete') {
    estado.lembretes.push({
      id: uid(), texto: a.titulo || 'Novo lembrete', titulo: a.titulo || 'Novo lembrete',
      descricao: '', categoria: 'geral', prioridade: 'media',
      data: a.data || '', hora: a.hora || '', ativo: true, concluido: false,
      repeticao: { tipo: 'nenhuma', dias: [] }, criada: new Date().toISOString()
    });
    salvarEstado();
    try { if (typeof renderLembretes === 'function') renderLembretes(); } catch (e) {}
    return true;
  }
  if (a.acao === 'criar_meta') {
    estado.metas.push({
      id: uid(), texto: a.titulo || 'Nova meta', descricao: '', prazo: a.data || '',
      categoria: 'pessoal', progresso: 0, feito: false, criada: hojeStr(),
      concluidaData: '', xp: 0, prioridade: 'media', alvo: 0, valorAtual: 0,
      unidade: '', etapas: [], pausada: false
    });
    salvarEstado();
    try { if (typeof renderMetas === 'function') renderMetas(); } catch (e) {}
    return true;
  }
  if (a.acao === 'criar_habito') {
    estado.habitos.push({
      id: uid(), nome: a.titulo || 'Novo h\u00e1bito', emoji: '\u2728', semanas: {},
      descricao: '', freq: 'diario', dias: [0,1,2,3,4,5,6], metaSemana: 7,
      objetivo: '', horario: '', categoria: 'saude', cor: '#00b894',
      ativo: true, melhorStreak: 0, criado: new Date().toISOString()
    });
    salvarEstado();
    try { if (typeof renderHabitos === 'function') renderHabitos(); } catch (e) {}
    return true;
  }
  if (a.acao === 'criar_evento') {
    estado.calEventos.push({
      id: uid(), titulo: a.titulo || 'Novo evento', data: a.data || hojeStr(),
      hora: a.hora || '', materia: '', tipo: 'evento', descricao: '',
      lembrete: estado.notifConfig ? estado.notifConfig.eventos : 1,
      duracao: 60, recorrencia: 'nenhuma', recorrenciaFim: ''
    });
    salvarEstado();
    try { if (typeof renderCalendario === 'function') renderCalendario(); } catch (e) {}
    return true;
  }
  if (a.acao === 'concluir_tarefa') {
    var t = oia10AcharTarefa(a.alvo);
    if (!t) return 'naoencontrado';
    t.feito = true; t.status = 'concluida'; t.concluidoEm = new Date().toISOString();
    salvarEstado();
    try { if (typeof renderTarefas === 'function') renderTarefas(); } catch (e) {}
    return true;
  }
  if (a.acao === 'excluir_tarefa') {
    var idx = oia10AcharTarefaIdx(a.alvo);
    if (idx < 0) return 'naoencontrado';
    var rem = estado.tarefas.splice(idx, 1)[0];
    if (!Array.isArray(estado.tarefasLixeira)) estado.tarefasLixeira = [];
    rem.excluidoEm = new Date().toISOString();
    estado.tarefasLixeira.push(rem);
    salvarEstado();
    try { if (typeof renderTarefas === 'function') renderTarefas(); } catch (e) {}
    return true;
  }
  return false;
}

function oia10AcharTarefa(alvo) {
  var idx = oia10AcharTarefaIdx(alvo);
  return idx >= 0 ? estado.tarefas[idx] : null;
}
function oia10AcharTarefaIdx(alvo) {
  if (!alvo) return -1;
  var a = oia10Norm(alvo);
  for (var i = 0; i < estado.tarefas.length; i++) {
    if (oia10Norm(estado.tarefas[i].texto).indexOf(a) !== -1) return i;
  }
  return -1;
}

// ---- Roteador principal do assistente (assíncrono por causa da IA externa) ----
// cb recebe { text, html, token?, pend? }
function oia10Responder(texto, cb) {
  var s = oia10Norm(texto);

  // (guardrail) pedido de \"fa\u00e7a meu trabalho por mim\"
  if (typeof detectarPedidoTrabalho === 'function' && detectarPedidoTrabalho(texto)) {
    cb(gerarRespostaIA(texto));
    return;
  }

  // (D) COMANDO que altera dados -> confirmação (NUNCA altera direto)
  var cmd = oia10ParseComando(texto);
  if (cmd && (cmd.titulo || cmd.alvo)) {
    var token = 't' + Date.now() + Math.floor(Math.random() * 1000);
    oia10Pend[token] = cmd;
    cb({ text: 'Confirme para eu ' + oia10RotuloAcao(cmd) + '.', html: oia10CardComando(cmd, token, 'pendente'), token: token, pend: cmd, status: 'pendente' });
    return;
  }

  // (matemática) \"quanto \u00e9 25 x 18\"
  var mat = oia10Matematica(texto);
  if (mat) { cb(mat); return; }

  // (C) ORGANIZAÇÃO: usa dados do OrganizaJá (reaproveita motor existente)
  if (oia10EhOrganizacao(s)) { cb(gerarRespostaIA(texto)); return; }

  // (B) AJUDA PARA ESTUDAR
  if (oia10EhEstudo(s)) { cb(oia10RespostaEstudo(texto, s)); return; }

  // (A) PERGUNTA GERAL / CONVERSA
  oia10RespostaGeral(texto, s, cb);
}

function oia10EhOrganizacao(s) {
  var kws = ['organizar', 'organize', 'minhas tarefas', 'minha tarefa', 'meu dia', 'minha semana',
    'prioridade', 'o que fazer primeiro', 'primeiro', 'atrasad', 'pendente',
    'plano de estudo', 'planejar', 'planejamento', 'meus h\u00e1bitos', 'meus habitos',
    'minhas metas', 'minhas provas', 'meus trabalhos', 'minha agenda', 'meus lembretes'];
  for (var i = 0; i < kws.length; i++) if (s.indexOf(oia10Norm(kws[i])) !== -1) return true;
  return false;
}

function oia10EhEstudo(s) {
  var kws = ['estudar para', 'me ajude a estudar', 'como estudar', 'dica de estudo', 'dicas de estudo',
    'resumo de', 'resumir', 'me explique', 'explique', 'explica', 'como se estuda',
    'trabalho escolar', 'ideias para um trabalho', 'ideia de trabalho', 'como aprender',
    'entender a mat\u00e9ria', 'entender a materia', 'revisar para'];
  for (var i = 0; i < kws.length; i++) if (s.indexOf(oia10Norm(kws[i])) !== -1) return true;
  return false;
}

// ---- (B) Resposta de ajuda para estudar ----
function oia10RespostaEstudo(texto, s) {
  // se for \"resumo de <texto>\" e houver conte\u00fado longo, orienta o resumo
  if (/resum(o|ir)/.test(s)) {
    return { text: 'Posso te ajudar a resumir!', html: '\uD83D\uDCDD <strong>Vamos resumir!</strong><br><br>Cole aqui o texto que voc\u00ea quer resumir (ou os t\u00f3picos principais) e eu te ajudo a organizar em: <em>ideia central, pontos-chave e conclus\u00e3o</em>.<br><br>Dica: um bom resumo cabe em 3\u20135 frases. Foque no que responde \u201co que\u201d, \u201cpor qu\u00ea\u201d e \u201ccomo\u201d.' + (oia10ConfigAtiva() ? '' : '<br><br><span class="oia10-hint">\uD83D\uDCA1 Para resumos autom\u00e1ticos de textos longos, conecte uma IA externa em \u201cConectar IA\u201d.</span>') };
  }
  var html = '\uD83D\uDCDA <strong>Como estudar com mais efici\u00eancia</strong><br><br>'
    + '1\uFE0F\u20e3 <strong>Divida o conte\u00fado</strong> em pequenos blocos (t\u00f3picos).<br>'
    + '2\uFE0F\u20e3 Use a t\u00e9cnica <strong>Pomodoro</strong>: 25 min de foco + 5 de pausa.<br>'
    + '3\uFE0F\u20e3 Faça <strong>resumos com suas palavras</strong> e teste-se (flashcards/quest\u00f5es).<br>'
    + '4\uFE0F\u20e3 Revise em intervalos crescentes (1 dia, 3 dias, 1 semana) \u2014 <em>revis\u00e3o espa\u00e7ada</em>.<br>'
    + '5\uFE0F\u20e3 Explique a mat\u00e9ria em voz alta, como se ensinasse algu\u00e9m.<br><br>';
  // conecta com a agenda do usuário, se houver provas
  var provas = (estado.estudos && estado.estudos.provas) ? estado.estudos.provas : [];
  var hoje = hojeStr();
  var prox = provas.filter(function(p){ return !p.concluido && p.data && p.data >= hoje; });
  if (prox.length) {
    prox.sort(function(a,b){ return a.data < b.data ? -1 : 1; });
    html += '\uD83D\uDCC5 <strong>Suas provas cadastradas:</strong><br>';
    for (var i = 0; i < Math.min(prox.length, 4); i++) {
      html += '\u2022 ' + esc(prox[i].materia) + ' \u2014 em ' + diasEntre(hoje, prox[i].data) + ' dia(s)<br>';
    }
    html += '<br>Quer que eu monte um <strong>plano de estudos</strong> com base nelas? \u00c9 s\u00f3 pedir!';
  } else {
    html += 'Se voc\u00ea cadastrar suas <strong>provas</strong> em Estudos, eu monto um plano de revis\u00e3o baseado nelas. \uD83D\uDE09';
  }
  return { text: 'Dicas para estudar melhor!', html: html };
}

// ---- (A) Resposta geral: IA externa (se conectada) ou base local ----
function oia10RespostaGeral(texto, s, cb) {
  // saudação simples continua respondendo local
  if (/^(oi|ola|ol\u00e1|e ai|eai|opa|bom dia|boa tarde|boa noite|hey|hello)\b/.test(s)) {
    cb({ text: 'Ol\u00e1! Como posso ajudar?', html: '\uD83D\uDC4B <strong>Ol\u00e1!</strong> Sou o <strong>OrganizaIA</strong>. Posso responder perguntas gerais, ajudar nos estudos, fazer contas e organizar sua agenda.<br><br>Experimente perguntar algo como <em>\u201cO que \u00e9 o sistema solar?\u201d</em> ou <em>\u201cOrganize minhas tarefas de hoje\u201d</em>. \uD83D\uDE0A' });
    return;
  }
  if (/(quem \u00e9 voc\u00ea|quem e voce|o que voc\u00ea faz|o que voce faz|no que voc\u00ea ajuda|como funciona|seu nome)/.test(s)) {
    cb({ text: 'Sou o OrganizaIA!', html: '\uD83E\uDD16 Sou o <strong>OrganizaIA</strong>, o assistente do OrganizaJ\u00e1. Tenho dois modos:<br><br>\uD83D\uDCCB <strong>Organiza\u00e7\u00e3o</strong> \u2014 tarefas, agenda, estudos, h\u00e1bitos, metas, lembretes e planejamento do dia (uso seus dados do app).<br>\uD83D\uDCAC <strong>Perguntas & conversa</strong> \u2014 respondo d\u00favidas gerais, ajudo a estudar e fa\u00e7o contas.<br><br>E quando voc\u00ea me pede para <strong>criar ou mudar algo</strong>, eu sempre pe\u00e7o confirma\u00e7\u00e3o antes. \u2705' });
    return;
  }

  // base de conhecimento local
  var kb = oia10BuscarKB(s);

  // IA externa conectada? -> tenta a IA; se falhar, usa KB/mensagem
  if (oia10ConfigAtiva()) {
    oia10ChamarIA(texto, function(res) {
      if (res && res.ok) {
        cb({ text: res.texto, html: oia10FormatarResposta(res.texto) });
      } else {
        // erro amigável; se houver KB, oferece o fallback local
        var msg = '\u26a0\uFE0F ' + (res && res.erro ? esc(res.erro) : 'N\u00e3o consegui falar com a IA externa agora.');
        if (kb) msg += '<br><br>Mas encontrei isto na minha base local:<br><br>' + kb;
        else msg += '<br><br>Tente novamente em instantes ou verifique a conex\u00e3o em \u201cConectar IA\u201d.';
        cb({ text: 'Erro ao consultar a IA externa.', html: msg });
      }
    });
    return;
  }

  // Sem IA externa: usa base local se houver
  if (kb) { cb({ text: 'Resposta da base local.', html: kb }); return; }

  // Sem IA externa e sem resposta local: mensagem honesta (não finge ter IA)
  cb({ text: 'Ainda n\u00e3o estou conectado a uma IA externa.', html:
    '\uD83D\uDD0C <strong>Ainda n\u00e3o estou conectado a uma IA externa.</strong><br><br>'
    + 'Consigo responder perguntas comuns, fazer contas, ajudar nos estudos e organizar sua agenda \u2014 tudo <strong>offline</strong>, sem enviar seus dados para lugar nenhum.<br><br>'
    + 'Para responder <strong>qualquer</strong> pergunta aberta, voc\u00ea pode conectar sua pr\u00f3pria IA (compat\u00edvel com OpenAI) no bot\u00e3o <strong>\u201cConectar IA\u201d</strong> \u2699\uFE0F acima. '
    + 'Sua chave fica <strong>somente no seu dispositivo</strong> \u2014 nunca \u00e9 publicada no GitHub.<br><br>'
    + 'Enquanto isso, posso te ajudar com: <em>\u201cOrganize minhas tarefas\u201d</em>, <em>\u201cQuanto \u00e9 25 \u00d7 18?\u201d</em>, <em>\u201cMe ajude a estudar para uma prova\u201d</em>.'
  });
}

// converte texto puro da IA em HTML seguro (escapa + quebras de linha)
function oia10FormatarResposta(txt) {
  return esc(txt || '').replace(/\n/g, '<br>');
}

// ---- Chamada à IA externa (OpenAI-compatível). Chave NUNCA no código. ----
function oia10ChamarIA(pergunta, cb) {
  var cfg = oia10Config();
  if (!cfg) { cb({ ok: false, erro: 'Nenhuma IA externa configurada.' }); return; }
  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = setTimeout(function() { if (ctrl) ctrl.abort(); }, 30000);

  var sistema = 'Voc\u00ea \u00e9 o OrganizaIA, um assistente virtual amig\u00e1vel em portugu\u00eas do Brasil, dentro do app OrganizaJ\u00e1. '
    + 'Responda de forma clara, natural e \u00fatil. N\u00e3o fa\u00e7a o trabalho escolar pelo aluno; ajude-o a aprender.';
  var body = {
    model: cfg.model || 'gpt-3.5-turbo',
    messages: [ { role: 'system', content: sistema }, { role: 'user', content: pergunta } ],
    temperature: 0.6
  };
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
    body: JSON.stringify(body)
  };
  if (ctrl) opts.signal = ctrl.signal;

  fetch(cfg.endpoint, opts).then(function(r) {
    clearTimeout(timer);
    if (!r.ok) { cb({ ok: false, erro: 'A IA respondeu com erro ' + r.status + '. Verifique a chave/endere\u00e7o.' }); return; }
    return r.json();
  }).then(function(data) {
    if (!data) return;
    var txt = '';
    try { txt = data.choices[0].message.content; } catch (e) { txt = ''; }
    if (txt) cb({ ok: true, texto: txt });
    else cb({ ok: false, erro: 'A IA n\u00e3o retornou uma resposta v\u00e1lida.' });
  }).catch(function(err) {
    clearTimeout(timer);
    var msg = (err && err.name === 'AbortError') ? 'A IA demorou demais para responder (tempo esgotado).'
      : 'N\u00e3o consegui conectar \u00e0 IA externa (verifique a internet, o endere\u00e7o e o CORS do servi\u00e7o).';
    cb({ ok: false, erro: msg });
  });
}

// ---- UI atualizada ----
// Abre o painel (agora com status PLUS liberado; veja override de abrirOrganizaIA abaixo)

// ---- Override: abrirOrganizaIA — liberado para todos os usuários ----
function abrirOrganizaIA() {
  // CORREÇÃO ETAPA 10: OrganizaIA volta a ser recurso PREMIUM.
  // O gate abaixo bloqueia usuários sem Premium exibindo a tela explicativa
  // via showPlusPrompt(). Em MODO DESENVOLVIMENTO (OJ_DEV_LIBERAR_TUDO=true)
  // a função isPlusFeature() retorna false, liberando o acesso para testes
  // sem pagamento. Ambos os modos (Organização e Perguntas/Conversa)
  // continuam disponíveis dentro do painel após a liberação.
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
  if (typeof closeSidebarOverlay === 'function') closeSidebarOverlay();
  if (typeof fecharMoreSheet === 'function') fecharMoreSheet();
  oia10InitSugestoes();
  oia10EnsureToolbar();
}

// ---- Override: enviar mensagem (agora assíncrono por causa da IA externa) ----
function oiaEnviar() {
  var input = document.getElementById('oiaInput');
  if (!input) return;
  var texto = input.value.trim();
  if (!texto) return;
  input.value = '';

  oiaHistorico.push({ role: 'user', text: texto, html: esc(texto) });
  salvarHistoricoIA();
  renderHistoricoIA();

  mostrarTypingIA(true);
  oia10Responder(texto, function(res) {
    mostrarTypingIA(false);
    var entry = { role: 'ai', text: res.text, html: res.html };
    if (res.token) entry.token = res.token;
    if (res.status) entry.status = res.status;
    if (res.pend) entry.pend = res.pend;
    oiaHistorico.push(entry);
    salvarHistoricoIA();
    renderHistoricoIA();
  });
}

// ---- Override: renderHistoricoIA — usa token para cards interativos ----
function renderHistoricoIA() {
  var box = document.getElementById('oiaMessages');
  if (!box) return;
  box.innerHTML = '';
  if (oiaHistorico.length === 0) {
    box.innerHTML = '<div class="oia-msg oia-msg-ai"><div class="oia-msg-avatar">\uD83E\uDDE0</div><div class="oia-msg-bubble">Ol\u00e1! Sou o <strong>OrganizaIA</strong> \u2014 agora sou mais que um organizador: sou seu <strong>assistente virtual</strong>! \uD83E\uDD16<br><br>\uD83D\uDCCB <strong>Organiza\u00e7\u00e3o</strong> \u2014 tarefas, agenda, estudos, h\u00e1bitos e metas.<br>\uD83D\uDCAC <strong>Perguntas & conversa</strong> \u2014 d\u00favidas gerais, matem\u00e1tica, ajuda escolar.<br><br>\u2705 Quando voc\u00ea pede para criar ou alterar algo, eu <strong>sempre pe\u00e7o confirma\u00e7\u00e3o</strong> antes. Nada muda sem voc\u00ea autorizar.<br><br>Use as sugest\u00f5es abaixo ou me pergunte algo!</div></div>';
    return;
  }
  for (var i = 0; i < oiaHistorico.length; i++) {
    var m = oiaHistorico[i];
    var isUser = m.role === 'user';
    var html = '<div class="oia-msg ' + (isUser ? 'oia-msg-user' : 'oia-msg-ai') + '">';
    html += '<div class="oia-msg-avatar">' + (isUser ? '\uD83D\uDC64' : '\uD83E\uDDE0') + '</div>';
    html += '<div class="oia-msg-bubble">' + (m.html || esc(m.text)) + '</div>';
    html += '</div>';
    box.innerHTML += html;
  }
  box.scrollTop = box.scrollHeight;
}

// ---- Override: sugestões expandidas (conversa + organização) ----
function oia10InitSugestoes() {
  var el = document.getElementById('oiaSuggestions');
  if (!el || el.dataset.md10) return;
  el.dataset.md10 = '1';
  el.innerHTML = ''
    + '<button class="oia-chip" onclick="oiaEnviarSugestao(\'Organize minhas tarefas de hoje\')">\uD83D\uDCCB Organizar tarefas</button>'
    + '<button class="oia-chip" onclick="oiaEnviarSugestao(\'O que devo fazer primeiro?\')">\uD83D\uDD25 Prioridades</button>'
    + '<button class="oia-chip" onclick="oiaEnviarSugestao(\'Me ajude a estudar para uma prova\')">\uD83D\uDCDA Ajuda nos estudos</button>'
    + '<button class="oia-chip" onclick="oiaEnviarSugestao(\'Quanto \u00e9 25 \u00d7 18?\')">\uD83E\uDDEE Fazer conta</button>'
    + '<button class="oia-chip" onclick="oiaEnviarSugestao(\'O que \u00e9 o sistema solar?\')">\u2600\uFE0F Pergunta geral</button>'
    + '<button class="oia-chip" onclick="oiaEnviarSugestao(\'Crie uma tarefa chamada estudar matem\u00e1tica amanh\u00e3\')">\u2795 Criar tarefa</button>'
    + '<button class="oia-chip" onclick="oiaEnviarSugestao(\'Dica de produtividade\')">\uD83D\uDCA1 Dica</button>'
    + '<button class="oia-chip" onclick="oia10MostrarConfig()">\u2699\uFE0F Conectar IA</button>';
}

// ---- Limpar conversa ----
function oia10Limpar() {
  oiaHistorico = [];
  oia10Pend = {};
  salvarHistoricoIA();
  renderHistoricoIA();
  if (typeof showToast === 'function') showToast('Conversa limpa');
}

// ---- Modal de configuração da IA externa ----
function oia10MostrarConfig() {
  var cfg = oia10Config();
  var ep = cfg ? cfg.endpoint : '';
  var ak = cfg ? '****' + cfg.apiKey.slice(-4) : '';
  var md = cfg ? (cfg.model || 'gpt-3.5-turbo') : 'gpt-3.5-turbo';
  // Modal simples (reutiliza estrutura tk-modal)
  if (!document.getElementById('oia10CfgModal')) {
    var bg = document.createElement('div');
    bg.className = 'tk-modal-bg';
    bg.id = 'oia10CfgModal';
    bg.onclick = function(e) { if (e.target === bg) bg.classList.remove('visivel'); };
    bg.innerHTML = '<div class="tk-modal" onclick="event.stopPropagation()">'
      + '<div class="tk-modal-head"><h3>\u2699\uFE0F Conectar IA Externa</h3><button class="tk-modal-x" onclick="document.getElementById(\'oia10CfgModal\').classList.remove(\'visivel\')">\u2715</button></div>'
      + '<div class="tk-modal-body">'
      + '<p style="font-size:.82rem;color:var(--txt2,#555)">Sua chave fica <strong>somente no seu dispositivo</strong> e nunca \u00e9 publicada. Use qualquer API compat\u00edvel com OpenAI.</p>'
      + '<div class="tk-field"><label class="tk-lbl">\uD83C\uDF10 Endpoint</label><input class="campo" id="oia10Ep" placeholder="https://api.openai.com/v1/chat/completions"></div>'
      + '<div class="tk-field"><label class="tk-lbl">\uD83D\uDD11 Chave de API</label><input class="campo" id="oia10Ak" type="password" placeholder="sk-..."></div>'
      + '<div class="tk-field"><label class="tk-lbl">\uD83E\uDDE0 Modelo</label><input class="campo" id="oia10Md" placeholder="gpt-3.5-turbo" value="gpt-3.5-turbo"></div>'
      + '</div>'
      + '<div class="tk-modal-foot"><button class="btn btn-s" onclick="oia10SalvarConfig()">Salvar</button><button class="btn btn-s" onclick="oia10RemoverConfig()" style="color:var(--vermelho)">Remover</button></div>'
      + '</div>';
    document.body.appendChild(bg);
  }
  var m = document.getElementById('oia10CfgModal');
  if (ep) { document.getElementById('oia10Ep').value = ep; document.getElementById('oia10Ak').value = ''; document.getElementById('oia10Ak').placeholder = ak || 'sk-...'; }
  else { document.getElementById('oia10Ep').value = ''; document.getElementById('oia10Ak').value = ''; document.getElementById('oia10Ak').placeholder = 'sk-...'; }
  document.getElementById('oia10Md').value = md;
  m.classList.add('visivel');
}

function oia10SalvarConfig() {
  var ep = (document.getElementById('oia10Ep').value || '').trim();
  var ak = (document.getElementById('oia10Ak').value || '').trim();
  var md = (document.getElementById('oia10Md').value || '').trim();
  if (!ep || !ak) { if (typeof showToast === 'function') showToast('Preencha o endpoint e a chave.', 'error'); return; }
  if (!/^https?:\/\/.+/.test(ep)) { if (typeof showToast === 'function') showToast('O endpoint deve ser uma URL (https://...).', 'error'); return; }
  if (!md) md = 'gpt-3.5-turbo';
  try { localStorage.setItem(OIA_CFG_KEY, JSON.stringify({ endpoint: ep, apiKey: ak, model: md })); } catch (e) {}
  document.getElementById('oia10CfgModal').classList.remove('visivel');
  if (typeof showToast === 'function') showToast('IA externa conectada! \uD83E\uDD16');
}

function oia10RemoverConfig() {
  try { localStorage.removeItem(OIA_CFG_KEY); } catch (e) {}
  document.getElementById('oia10CfgModal').classList.remove('visivel');
  if (typeof showToast === 'function') showToast('IA externa removida.');
}

// ---- Toolbar injetada no topo do painel (Conectar IA + Limpar) ----
function oia10EnsureToolbar() {
  var msgs = document.getElementById('oiaMessages');
  if (!msgs || !msgs.parentNode) return;
  if (document.getElementById('oia10Toolbar')) return;
  var bar = document.createElement('div');
  bar.id = 'oia10Toolbar';
  bar.className = 'oia10-toolbar';
  bar.innerHTML = ''
    + '<button class="oia10-tb-btn" onclick="oia10MostrarConfig()" title="Conectar sua IA externa">\u2699\uFE0F Conectar IA</button>'
    + '<button class="oia10-tb-btn" onclick="oia10Limpar()" title="Limpar conversa">\uD83E\uDDF9 Limpar</button>';
  msgs.parentNode.insertBefore(bar, msgs);
}

// ---- Estilos do m\u00f3dulo (oia10-*) ----
function oia10EnsureStyles() {
  if (document.getElementById('oia10Styles')) return;
  var st = document.createElement('style');
  st.id = 'oia10Styles';
  st.textContent = ''
    + '.oia10-toolbar{display:flex;gap:.5rem;padding:.5rem .75rem;border-bottom:1px solid var(--borda,#e5e5e5);flex-wrap:wrap;background:var(--card2,#f7f7f7)}'
    + '.oia10-tb-btn{font-size:.78rem;padding:.32rem .6rem;border-radius:999px;border:1px solid var(--borda,#ddd);background:var(--card,#fff);color:var(--txt,#333);cursor:pointer}'
    + '.oia10-tb-btn:hover{background:var(--primaria,#6c5ce7);color:#fff;border-color:transparent}'
    + '.oia10-hint{font-size:.75rem;color:var(--txt2,#777);display:inline-block;margin-top:.25rem}'
    + '.oia10-card{border:1px solid var(--borda,#e0e0e0);border-radius:12px;padding:.65rem .75rem;background:var(--card2,#f7f7f9);line-height:1.5}'
    + '.oia10-card-danger{border-color:var(--vermelho,#e74c3c)}'
    + '.oia10-card-body{margin-top:.5rem;display:flex;flex-direction:column;gap:.25rem}'
    + '.oia10-det{font-size:.85rem;color:var(--txt,#333)}'
    + '.oia10-det span{opacity:.8}'
    + '.oia10-card-acts{display:flex;gap:.5rem;margin-top:.6rem}'
    + '.oia10-card-note{font-size:.72rem;color:var(--txt2,#888);margin-top:.4rem;font-style:italic}'
    + '.oia10-card-done{margin-top:.55rem;font-weight:700;font-size:.85rem;color:var(--verde,#00b894)}'
    + '.oia10-card-done.oia10-cancel{color:var(--txt2,#888)}'
    + '.oia10-btn{border:none;border-radius:8px;padding:.42rem .85rem;font-size:.82rem;font-weight:600;cursor:pointer}'
    + '.oia10-btn-ok{background:var(--verde,#00b894);color:#fff}'
    + '.oia10-btn-no{background:var(--card,#eee);color:var(--txt2,#555);border:1px solid var(--borda,#ddd)}'
    + '.oia10-btn:disabled{opacity:.5;cursor:default}';
  document.head.appendChild(st);
}

document.addEventListener('DOMContentLoaded', function () {
  try { oia10EnsureStyles(); } catch (e) {}
});


// ================================================================
// ⚠️ MODO DESENVOLVIMENTO — LIBERAÇÃO TEMPORÁRIA DO PREMIUM (Plus)
// ================================================================
// ATENÇÃO: Este bloco é TEMPORÁRIO e destinado APENAS a
// desenvolvimento/testes. Ele NÃO processa pagamentos e NÃO altera
// os dados salvos (estado.plus continua intacto no localStorage).
//
// Enquanto OJ_DEV_LIBERAR_TUDO === true, TODAS as funcionalidades
// (incluindo o OrganizaIA) ficam liberadas para teste, sem exigir
// assinatura Plus. A estrutura Premium original permanece 100% no
// código (plusFeatures, isPlusFeature/isUsuarioPlus originais,
// páginas de planos, placeholders de gateway) para reativação futura.
//
// >>> COMO REATIVAR O PREMIUM NO FUTURO <<<
//   Opção A (recomendada): troque a linha abaixo para
//                          var OJ_DEV_LIBERAR_TUDO = false;
//   Opção B: remova este bloco inteiro (as funções originais
//            isPlusFeature/isUsuarioPlus voltam a valer automaticamente).
//
// Nenhum checkout, cartão, PIX ou assinatura real foi implementado.
// ================================================================
var OJ_DEV_LIBERAR_TUDO = true; // <== chave única do modo desenvolvimento

// Override last-wins: enquanto o modo dev estiver ligado, nada é bloqueado.
// Quando desligado, delega para a lógica Premium original (via estado.plus).
function isPlusFeature(slug) {
  // MODO DEV: nenhuma feature exige Plus.
  if (typeof OJ_DEV_LIBERAR_TUDO !== 'undefined' && OJ_DEV_LIBERAR_TUDO) return false;
  // Lógica original preservada:
  if (estado.plus && estado.plus.ativo) return false;
  return plusFeatures[slug] !== undefined;
}

function isUsuarioPlus() {
  // MODO DEV: trata o usuário como Plus para liberar tudo em teste.
  if (typeof OJ_DEV_LIBERAR_TUDO !== 'undefined' && OJ_DEV_LIBERAR_TUDO) return true;
  // Lógica original preservada:
  return !!(estado.plus && estado.plus.ativo);
}

// Aviso discreto no console para deixar claro que o modo dev está ativo.
try {
  if (OJ_DEV_LIBERAR_TUDO && typeof console !== 'undefined') {
    console.info('[OrganizaJá] MODO DEV ativo: Premium liberado TEMPORARIAMENTE para testes (nenhum pagamento real).');
  }
} catch (e) {}

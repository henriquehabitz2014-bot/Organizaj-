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
  ordemTarefas: 'data',
  senhas: [],
  despesas: [],
  orcamentoMes: 0,
  humorHoje: 0,
  humorData: '',
  exerciciosHoje: [],
  exerciciosData: ''
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
  if (!estado.estudos) estado.estudos = { materias:[], provas:[], trabalhos:[] };
  if (!estado.estudos.materias) estado.estudos.materias = [];
  if (!estado.estudos.provas) estado.estudos.provas = [];
  if (!estado.estudos.trabalhos) estado.estudos.trabalhos = [];
  if (!estado.calView) estado.calView = 'mes';
  if (!estado.ordemTarefas) estado.ordemTarefas = 'data';

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
  estudos:'Estudos', habitos:'Hábitos', pomodoro:'Pomodoro',
  metas:'Metas', notas:'Notas', lembretes:'Lembretes',
  decisor:'Decisor', agua:'Água', exercicios:'Exercícios',
  humor:'Humor', gratidao:'Gratidão', refeicoes:'Refeições',
  orcamento:'Orçamento', compras:'Compras', planejamento:'Semanal',
  regressiva:'Regressiva', calculadora:'Calculadora', senhas:'Senhas',
  leitura:'Leitura', revisao:'Revisão', frases:'Frases', vida:'Painel da Vida'
};

function navegarPara(pagina, btn) {
  // Close any open sheets
  fecharMoreSheet();

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
function buscarTudo(q) {
  var res = document.getElementById('buscaResultados');
  if (!q.trim()) { res.innerHTML = ''; return; }
  q = q.toLowerCase();
  var html = '';
  // Search tools
  Object.keys(pageNames).forEach(function(k) {
    if (pageNames[k].toLowerCase().indexOf(q) >= 0) {
      html += '<div class="busca-item" onclick="navegarPara(\''+esc(k)+'\');fecharBusca({target:document.getElementById(\'buscaOverlay\')})">' + esc(pageNames[k]) + '</div>';
    }
  });
  // Search tasks
  estado.tarefas.forEach(function(t) {
    if (t.texto.toLowerCase().indexOf(q) >= 0) {
      html += '<div class="busca-item" onclick="navegarPara(\'tarefas\');fecharBusca({target:document.getElementById(\'buscaOverlay\')})">✅ ' + esc(t.texto) + '</div>';
    }
  });
  res.innerHTML = html || '<div style="padding:1rem;color:var(--txt3);font-size:.85rem">Nenhum resultado</div>';
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

function scheduleAllNotificacoes() {
  // Clear existing timers
  Object.keys(notifTimers).forEach(function(k) {
    clearTimeout(notifTimers[k]);
  });
  notifTimers = {};

  var agora = Date.now();

  // Lembretes
  estado.lembretes.forEach(function(l) {
    if (!l.ativo) return;
    var dtStr = (l.data ? l.data + 'T' : hojeStr() + 'T') + (l.hora || '09:00');
    var dt = new Date(dtStr).getTime();
    var diff = dt - agora;
    if (diff > 0 && diff < 86400000) {
      notifTimers['lembrete_' + l.id] = setTimeout(function() {
        enviarNotificacao('Lembrete', l.texto);
      }, diff);
    }
  });

  // Tarefas with date/time
  estado.tarefas.forEach(function(t) {
    if (t.feito || !t.data) return;
    var dtStr = t.data + 'T' + (t.hora || '09:00');
    var dt = new Date(dtStr).getTime();
    var diff = dt - agora;
    if (diff > 0 && diff < 86400000) {
      notifTimers['tarefa_' + t.id] = setTimeout(function() {
        enviarNotificacao('Tarefa: ' + t.texto, 'Vence em breve!');
      }, diff);
    }
  });

  // Provas
  if (estado.estudos && estado.estudos.provas) {
    estado.estudos.provas.forEach(function(p) {
      if (!p.data) return;
      var dt = new Date(p.data + 'T09:00').getTime();
      var diff = dt - agora;
      if (diff > 0 && diff < 86400000 * 3) {
        notifTimers['prova_' + p.id] = setTimeout(function() {
          enviarNotificacao('Prova: ' + p.texto, 'Dia ' + p.data);
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
  // Greeting
  var h = new Date().getHours();
  var greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  document.getElementById('dashGreeting').textContent = greet + '! 👋';

  // Date
  var dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var d = new Date();
  document.getElementById('dashDate').textContent = dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()];

  // Cards
  var hoje = hojeStr();
  var tarefasHoje = estado.tarefas.filter(function(t){return !t.feito && t.data === hoje}).length;
  var atrasadas = estado.tarefas.filter(eAtrasada).length;
  var feitasHoje = estado.tarefas.filter(function(t){return t.feito && t.data === hoje}).length;
  var pomos = (estado.pomodorosData === hoje) ? estado.pomodorosHoje : 0;
  var agua = (estado.aguaData === hoje) ? estado.aguaHoje : 0;

  var cards = '';
  cards += '<div class="dash-card dc-tarefas"><div class="dc-num">' + tarefasHoje + '</div><div class="dc-label">Tarefas hoje</div></div>';
  if (atrasadas > 0) {
    cards += '<div class="dash-card dc-atrasadas"><div class="dc-num">' + atrasadas + '</div><div class="dc-label">Atrasadas 🚨</div></div>';
  }
  cards += '<div class="dash-card dc-feitas"><div class="dc-num">' + feitasHoje + '</div><div class="dc-label">Concluídas</div></div>';
  cards += '<div class="dash-card dc-pomo"><div class="dc-num">' + pomos + '</div><div class="dc-label">Pomodoros</div></div>';
  cards += '<div class="dash-card dc-agua"><div class="dc-num">' + agua + '/8</div><div class="dc-label">Copos de água</div></div>';
  document.getElementById('dashCards').innerHTML = cards;

  // Tarefas de hoje
  var th = estado.tarefas.filter(function(t){return !t.feito && t.data === hoje});
  document.getElementById('dashTarefasCount').textContent = th.length ? '(' + th.length + ')' : '';
  var htmlTh = '';
  th.forEach(function(t) {
    var catE = catEmojis[t.categoria] || '';
    var prioC = t.prio === 'alta' ? 'prio-alta' : t.prio === 'baixa' ? 'prio-baixa' : '';
    htmlTh += '<div class="dash-tarefa ' + prioC + '"><span>' + catE + '</span> ' + esc(t.texto) + (t.hora ? ' <small style="color:var(--txt3)">' + t.hora + '</small>' : '') + '</div>';
  });
  if (!htmlTh) htmlTh = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma tarefa para hoje. Adicione uma! 🎉</div>';
  document.getElementById('dashTarefasHoje').innerHTML = htmlTh;

  // Atrasadas
  var atr = estado.tarefas.filter(eAtrasada);
  document.getElementById('dashAtrasadasCount').textContent = atr.length ? '(' + atr.length + ')' : '';
  var htmlAtr = '';
  atr.forEach(function(t) {
    htmlAtr += '<div class="dash-tarefa prio-alta"><span>🚨</span> ' + esc(t.texto) + ' <small style="color:var(--vermelho)">venceu ' + dataLocal(t.data) + '</small></div>';
  });
  if (!htmlAtr) htmlAtr = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma tarefa atrasada! 🎊</div>';
  document.getElementById('dashAtrasadas').innerHTML = htmlAtr;

  // Hábitos hoje
  var diaIdx = getDiaSemana();
  var sk = getSemanaKey();
  var htmlHab = '';
  estado.habitos.forEach(function(h) {
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    var feito = arr[diaIdx];
    htmlHab += '<div class="dash-habito ' + (feito ? 'feito' : '') + '" onclick="toggleHabitoDash(\''+h.id+'\')"><span>' + (h.emoji||'✨') + '</span> ' + esc(h.nome) + (feito ? ' ✅' : '') + '</div>';
  });
  if (!htmlHab) htmlHab = '<div style="color:var(--txt3);font-size:.82rem">Nenhum hábito criado ainda.</div>';
  document.getElementById('dashHabitosHoje').innerHTML = htmlHab;

  // Próximos compromissos
  var compromissos = [];
  estado.tarefas.filter(function(t){return !t.feito && t.data}).forEach(function(t){compromissos.push({texto:t.texto,data:t.data,hora:t.hora,icon:catEmojis[t.categoria]||'📌'});});
  estado.lembretes.filter(function(l){return l.ativo && l.data}).forEach(function(l){compromissos.push({texto:l.texto,data:l.data,hora:l.hora,icon:'🔔'});});
  if (estado.estudos && estado.estudos.provas) {
    estado.estudos.provas.forEach(function(p){compromissos.push({texto:'Prova: '+p.texto,data:p.data,hora:'',icon:'📝'});});
  }
  compromissos.sort(function(a,b){return (a.data+(a.hora||'')).localeCompare(b.data+(b.hora||''));});
  var htmlComp = '';
  compromissos.slice(0,5).forEach(function(c){
    htmlComp += '<div class="dash-comp"><span>' + c.icon + '</span> ' + esc(c.texto) + ' <small>' + dataLocal(c.data) + (c.hora ? ' ' + c.hora : '') + '</small></div>';
  });
  if (!htmlComp) htmlComp = '<div style="color:var(--txt3);font-size:.82rem">Nenhum compromisso próximo.</div>';
  document.getElementById('dashCompromissos').innerHTML = htmlComp;

  // Resumo da semana
  var totalTarefas = estado.tarefas.length;
  var feitas = estado.tarefas.filter(function(t){return t.feito}).length;
  var pct = totalTarefas ? Math.round(feitas/totalTarefas*100) : 0;
  var habitosFeitosSemana = 0;
  var habitosTotalSemana = estado.habitos.length * 7;
  estado.habitos.forEach(function(h){
    var arr = h.semanas[sk]||[];
    arr.forEach(function(v){if(v)habitosFeitosSemana++;});
  });
  var habPct = habitosTotalSemana ? Math.round(habitosFeitosSemana/habitosTotalSemana*100) : 0;
  var htmlRes = '';
  htmlRes += '<div class="dash-resumo-item"><div class="dash-resumo-label">Tarefas concluídas</div><div class="dash-resumo-bar"><div class="dash-resumo-fill" style="width:'+pct+'%"></div></div><div class="dash-resumo-pct">'+pct+'%</div></div>';
  htmlRes += '<div class="dash-resumo-item"><div class="dash-resumo-label">Hábitos da semana</div><div class="dash-resumo-bar"><div class="dash-resumo-fill" style="width:'+habPct+'%;background:var(--cor2)"></div></div><div class="dash-resumo-pct">'+habPct+'%</div></div>';
  htmlRes += '<div class="dash-resumo-item"><div class="dash-resumo-label">Pomodoros hoje</div><div class="dash-resumo-val">' + pomos + '</div></div>';
  htmlRes += '<div class="dash-resumo-item"><div class="dash-resumo-label">Água hoje</div><div class="dash-resumo-val">' + agua + '/8</div></div>';
  document.getElementById('dashResumoSemana').innerHTML = htmlRes;

  // Dicas
  novaDica(); novaMotivacao(); novoDesafio();
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

function addQuickTask() {
  var inp = document.getElementById('quickTaskInput');
  var txt = inp.value.trim();
  if (!txt) return;
  estado.tarefas.push({texto:txt, prio:'media', feito:false, id:uid(), data:hojeStr(), hora:'', categoria:''});
  inp.value = '';
  salvarEstado();
  renderDashboard();
}

function novaDica() { document.getElementById('dicaTexto').textContent = dicas[Math.floor(Math.random()*dicas.length)]; }
function novaMotivacao() { document.getElementById('motivacaoTexto').textContent = motivacoes[Math.floor(Math.random()*motivacoes.length)]; }
function novoDesafio() { document.getElementById('desafioTexto').textContent = desafios[Math.floor(Math.random()*desafios.length)]; }

// ---- TAREFAS ----
function addTarefa() {
  var txt = document.getElementById('tarefaInput').value.trim();
  if (!txt) return;
  estado.tarefas.push({
    texto: txt,
    prio: document.getElementById('tarefaPrio').value,
    feito: false,
    id: uid(),
    data: document.getElementById('tarefaData').value || '',
    hora: document.getElementById('tarefaHora').value || '',
    categoria: document.getElementById('tarefaCat').value || ''
  });
  document.getElementById('tarefaInput').value = '';
  document.getElementById('tarefaData').value = '';
  document.getElementById('tarefaHora').value = '';
  document.getElementById('tarefaCat').value = '';
  salvarEstado();
  renderTarefas();
}

function toggleTarefa(id) {
  var t = estado.tarefas.find(function(x){return x.id===id;});
  if (t) { t.feito = !t.feito; salvarEstado(); renderTarefas(); }
}

function delTarefa(id) {
  estado.tarefas = estado.tarefas.filter(function(x){return x.id!==id;});
  salvarEstado(); renderTarefas();
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

function renderTarefas() {
  var pesquisa = (document.getElementById('tarefaPesquisa') || {}).value || '';
  var filtro = estado.filtroTarefas;
  var ordem = estado.ordemTarefas;
  var hoje = hojeStr();

  var lista = estado.tarefas.slice();

  // Filter
  if (filtro === 'ativas') lista = lista.filter(function(t){return !t.feito;});
  else if (filtro === 'feitas') lista = lista.filter(function(t){return t.feito;});
  else if (filtro === 'atrasadas') lista = lista.filter(eAtrasada);

  // Search
  if (pesquisa.trim()) {
    var q = pesquisa.toLowerCase();
    lista = lista.filter(function(t){return t.texto.toLowerCase().indexOf(q) >= 0;});
  }

  // Sort
  if (ordem === 'data') {
    lista.sort(function(a,b) {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return (a.data + (a.hora||'')).localeCompare(b.data + (b.hora||''));
    });
  } else if (ordem === 'prio') {
    var prioVal = {alta:0,media:1,baixa:2};
    lista.sort(function(a,b){return (prioVal[a.prio]||1) - (prioVal[b.prio]||1);});
  } else if (ordem === 'cat') {
    lista.sort(function(a,b){return (a.categoria||'zzz').localeCompare(b.categoria||'zzz');});
  }

  var html = '';
  lista.forEach(function(t) {
    var catE = catEmojis[t.categoria] || '';
    var catC = catCores[t.categoria] || 'var(--txt2)';
    var prioC = t.prio === 'alta' ? 'prio-alta' : t.prio === 'baixa' ? 'prio-baixa' : '';
    var atrasada = eAtrasada(t);
    var classe = 'tarefa-item' + (t.feito ? ' feito' : '') + (atrasada ? ' atrasada' : '') + (prioC ? ' ' + prioC : '');
    html += '<li class="' + classe + '">';
    html += '<div class="tarefa-check" onclick="toggleTarefa(\''+t.id+'\')">' + (t.feito ? '✅' : '⬜') + '</div>';
    html += '<div class="tarefa-info">';
    html += '<div class="tarefa-texto">' + (catE ? '<span style="margin-right:.3rem">'+catE+'</span>' : '') + esc(t.texto) + '</div>';
    if (t.data) html += '<div class="tarefa-meta"><span style="color:'+catC+'">📅 ' + dataLocal(t.data) + '</span>' + (t.hora ? ' <span style="color:var(--txt3)">🕐 '+t.hora+'</span>' : '') + (t.categoria ? ' <span style="color:'+catC+'">'+t.categoria+'</span>' : '') + (atrasada ? ' <span style="color:var(--vermelho)">🚨 atrasada</span>' : '') + '</div>';
    html += '</div>';
    html += '<button class="tarefa-del" onclick="delTarefa(\''+t.id+'\')" title="Excluir">🗑️</button>';
    html += '</li>';
  });
  if (!html) html = '<div style="padding:1rem;color:var(--txt3);font-size:.85rem;text-align:center">Nenhuma tarefa encontrada</div>';
  document.getElementById('tarefasLista').innerHTML = html;
}

function limparTarefas() {
  estado.tarefas = estado.tarefas.filter(function(t){return !t.feito;});
  salvarEstado(); renderTarefas();
}

// ---- CALENDARIO ----
function renderCalendario() {
  if (!estado.calMes && !estado.calAno) {
    var d = new Date();
    estado.calMes = d.getMonth();
    estado.calAno = d.getFullYear();
  }
  if (estado.calView === 'mes') renderCalMes();
  else renderCalSemana();
}

function setCalView(v, btn) {
  estado.calView = v;
  document.querySelectorAll('.cal-view-toggle button').forEach(function(b){b.classList.remove('ativo');});
  if (btn) btn.classList.add('ativo');
  renderCalendario();
}

function calNav(dir) {
  if (estado.calView === 'mes') {
    estado.calMes += dir;
    if (estado.calMes > 11) { estado.calMes = 0; estado.calAno++; }
    if (estado.calMes < 0) { estado.calMes = 11; estado.calAno--; }
  } else {
    if (!estado.calSemanaStart) estado.calSemanaStart = new Date();
    var d = new Date(estado.calSemanaStart);
    d.setDate(d.getDate() + dir * 7);
    estado.calSemanaStart = d;
  }
  renderCalendario();
}

function calHoje() {
  var d = new Date();
  estado.calMes = d.getMonth();
  estado.calAno = d.getFullYear();
  estado.calSemanaStart = d;
  renderCalendario();
}

function getCalEvents(dateStr) {
  var evts = [];
  estado.tarefas.forEach(function(t) {
    if (t.data === dateStr) evts.push({texto: t.texto, cor: catCores[t.categoria] || 'var(--cor)', tipo: 'tarefa'});
  });
  estado.lembretes.forEach(function(l) {
    if (l.data === dateStr) evts.push({texto: l.texto, cor: 'var(--amarelo)', tipo: 'lembrete'});
  });
  if (estado.estudos && estado.estudos.provas) {
    estado.estudos.provas.forEach(function(p) {
      if (p.data === dateStr) evts.push({texto: 'Prova: ' + p.texto, cor: '#e17055', tipo: 'prova'});
    });
  }
  if (estado.estudos && estado.estudos.trabalhos) {
    estado.estudos.trabalhos.forEach(function(tr) {
      if (tr.data === dateStr) evts.push({texto: 'Trabalho: ' + tr.texto, cor: '#0984e3', tipo: 'trabalho'});
    });
  }
  return evts;
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
    html += '<div class="' + cls + '">';
    html += '<div class="cal-dia-num">' + dia + '</div>';
    if (evts.length) {
      html += '<div class="cal-dia-eventos">';
      evts.slice(0,3).forEach(function(e){
        html += '<div class="cal-evento" style="background:' + e.cor + '" title="' + esc(e.texto) + '"></div>';
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
    html += '<div class="cal-semana-dia' + (isHoje ? ' hoje' : '') + '">';
    html += '<div class="csd-header"><span class="csd-nome">' + diasSem[i].slice(0,3) + '</span><span class="csd-num">' + d.getDate() + '</span></div>';
    html += '<div class="csd-eventos">';
    evts.forEach(function(e){
      html += '<div class="csd-evt" style="border-left:3px solid ' + e.cor + '">' + esc(e.texto) + '</div>';
    });
    if (!evts.length) html += '<div class="csd-evt-empty">—</div>';
    html += '</div></div>';
  }
  html += '</div>';
  document.getElementById('calCorpo').innerHTML = html;
}

// ---- ESTUDOS ----
function renderEstudos() {
  renderMaterias();
  renderProvas();
  renderTrabalhos();
}

function addMateria() {
  var nome = document.getElementById('materiaInput').value.trim();
  if (!nome) return;
  var cor = document.getElementById('materiaCor').value;
  estado.estudos.materias.push({nome:nome, cor:cor, id:uid()});
  document.getElementById('materiaInput').value = '';
  salvarEstado(); renderMaterias();
}

function delMateria(id) {
  estado.estudos.materias = estado.estudos.materias.filter(function(m){return m.id!==id;});
  salvarEstado(); renderMaterias();
}

function renderMaterias() {
  var html = '';
  estado.estudos.materias.forEach(function(m) {
    var provas = estado.estudos.provas.filter(function(p){return p.materia===m.nome}).length;
    var trabs = estado.estudos.trabalhos.filter(function(t){return t.materia===m.nome}).length;
    html += '<div class="materia-card" style="border-left:4px solid ' + m.cor + '">';
    html += '<div class="materia-nome">' + esc(m.nome) + '</div>';
    html += '<div class="materia-info">📝 ' + provas + ' provas · 📄 ' + trabs + ' trabalhos</div>';
    html += '<button class="btn btn-d" style="font-size:.65rem;padding:.2rem .5rem" onclick="delMateria(\''+m.id+'\')">Excluir</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma matéria adicionada.</div>';
  document.getElementById('materiasGrid').innerHTML = html;
}

function addProva() {
  var txt = document.getElementById('provaInput').value.trim();
  if (!txt) return;
  estado.estudos.provas.push({
    texto: txt,
    materia: document.getElementById('provaMateria').value || '',
    data: document.getElementById('provaData').value || '',
    id: uid()
  });
  document.getElementById('provaInput').value = '';
  document.getElementById('provaMateria').value = '';
  document.getElementById('provaData').value = '';
  salvarEstado(); renderProvas();
}

function delProva(id) {
  estado.estudos.provas = estado.estudos.provas.filter(function(p){return p.id!==id;});
  salvarEstado(); renderProvas();
}

function renderProvas() {
  var html = '';
  estado.estudos.provas.sort(function(a,b){return (a.data||'z').localeCompare(b.data||'z');});
  estado.estudos.provas.forEach(function(p) {
    var diasRestantes = p.data ? Math.ceil((new Date(p.data) - new Date()) / 86400000) : null;
    var urgente = diasRestantes !== null && diasRestantes <= 3 && diasRestantes >= 0;
    var corMateria = (estado.estudos.materias.find(function(m){return m.nome===p.materia})||{}).cor;
    html += '<div class="prova-item' + (urgente ? ' urgente' : '') + '" style="border-left:3px solid ' + (corMateria || 'var(--cor2)') + '">';
    html += '<div class="prova-texto">📝 ' + esc(p.texto) + (p.materia ? ' <small style="color:var(--txt3)">(' + esc(p.materia) + ')</small>' : '') + '</div>';
    html += '<div class="prova-data">📅 ' + (p.data ? dataLocal(p.data) : 'sem data') + (diasRestantes !== null ? ' <small style="color:' + (urgente ? 'var(--vermelho)' : 'var(--txt3)') + '">(em ' + diasRestantes + ' dias)</small>' : '') + '</div>';
    html += '<button class="btn btn-d" style="font-size:.65rem;padding:.2rem .5rem" onclick="delProva(\''+p.id+'\')">Excluir</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma prova registrada.</div>';
  document.getElementById('provasLista').innerHTML = html;
}

function addTrabalho() {
  var txt = document.getElementById('trabInput').value.trim();
  if (!txt) return;
  estado.estudos.trabalhos.push({
    texto: txt,
    materia: document.getElementById('trabMateria').value || '',
    data: document.getElementById('trabData').value || '',
    id: uid()
  });
  document.getElementById('trabInput').value = '';
  document.getElementById('trabMateria').value = '';
  document.getElementById('trabData').value = '';
  salvarEstado(); renderTrabalhos();
}

function delTrabalho(id) {
  estado.estudos.trabalhos = estado.estudos.trabalhos.filter(function(t){return t.id!==id;});
  salvarEstado(); renderTrabalhos();
}

function renderTrabalhos() {
  var html = '';
  estado.estudos.trabalhos.sort(function(a,b){return (a.data||'z').localeCompare(b.data||'z');});
  estado.estudos.trabalhos.forEach(function(tr) {
    var diasRestantes = tr.data ? Math.ceil((new Date(tr.data) - new Date()) / 86400000) : null;
    html += '<div class="trabalho-item" style="border-left:3px solid var(--cor3)">';
    html += '<div class="trab-texto">📄 ' + esc(tr.texto) + (tr.materia ? ' <small style="color:var(--txt3)">(' + esc(tr.materia) + ')</small>' : '') + '</div>';
    html += '<div class="trab-data">📅 ' + (tr.data ? dataLocal(tr.data) : 'sem data') + (diasRestantes !== null ? ' <small>(em ' + diasRestantes + ' dias)</small>' : '') + '</div>';
    html += '<button class="btn btn-d" style="font-size:.65rem;padding:.2rem .5rem" onclick="delTrabalho(\''+tr.id+'\')">Excluir</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhum trabalho registrado.</div>';
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
}

function renderHabitos() {
  var sk = getSemanaKey();
  var diasNomes = ['D','S','T','Q','Q','S','S'];
  var html = '';
  estado.habitos.forEach(function(h) {
    var streak = calcularStreak(h);
    var prog = progressoSemanaHabito(h);
    var arr = h.semanas[sk] || [false,false,false,false,false,false,false];
    html += '<div class="habito-card">';
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
function addMeta() {
  var txt = document.getElementById('metaInput').value.trim();
  if (!txt) return;
  estado.metas.push({texto:txt, feito:false, id:uid()});
  document.getElementById('metaInput').value = '';
  salvarEstado(); renderMetas();
}

function toggleMeta(id) {
  var m = estado.metas.find(function(x){return x.id===id;});
  if (m) { m.feito = !m.feito; salvarEstado(); renderMetas(); }
}

function delMeta(id) {
  estado.metas = estado.metas.filter(function(x){return x.id!==id;});
  salvarEstado(); renderMetas();
}

function renderMetas() {
  var html = '';
  estado.metas.forEach(function(m) {
    html += '<div class="meta-item' + (m.feito ? ' feito' : '') + '">';
    html += '<span class="meta-check" onclick="toggleMeta(\''+m.id+'\')">' + (m.feito ? '🎯' : '⬜') + '</span>';
    html += '<span class="meta-texto">' + esc(m.texto) + '</span>';
    html += '<button class="btn btn-d" style="font-size:.65rem" onclick="delMeta(\''+m.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhuma meta adicionada.</div>';
  document.getElementById('metasLista').innerHTML = html;
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
    html += '<div class="nota-card">';
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
    html += '<div class="lembrete-item' + (l.ativo ? '' : ' inativo') + '">';
    html += '<span class="lembrete-check" onclick="toggleLembrete(\''+l.id+'\')">' + (l.ativo ? '🔔' : '🔕') + '</span>';
    html += '<span class="lembrete-texto">' + esc(l.texto) + '</span>';
    html += '<span class="lembrete-hora">' + (l.hora || '') + (l.data ? ' ' + dataLocal(l.data) : '') + '</span>';
    html += '<button class="btn btn-d" style="font-size:.65rem" onclick="delLembrete(\''+l.id+'\')">✕</button>';
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--txt3);font-size:.82rem">Nenhum lembrete.</div>';
  document.getElementById('lembretesLista').innerHTML = html;
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
    {slug:'vida', nome:'Painel da Vida', icon:'🌟'}
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
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('modalConfirmar').classList.add('ativo');
  document.getElementById('modalConfirmar').onclick = function() {
    document.getElementById('modalConfirmar').classList.remove('ativo');
    if (onOk) onOk();
  };
}
function closeConfirm() {
  document.getElementById('modalConfirmar').classList.remove('ativo');
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

// ---- RENDER ALL FOR PAGE ----
function renderPage(slug) {
  switch(slug) {
    case 'inicio': renderDashboard(); break;
    case 'tarefas': renderTarefas(); break;
    case 'calendario': renderCalendario(); break;
    case 'estudos': renderEstudos(); break;
    case 'habitos': renderHabitos(); break;
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
  }
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
      if (!bs.contains(e.target) && !e.target.closest('[onclick*="toggleMaisBottom"]')) {
        bs.classList.remove('aberto');
      }
    }
  });

  // Close search on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var so = document.getElementById('buscaOverlay');
      if (so && so.classList.contains('ativo')) so.classList.remove('ativo');
      var pm = document.getElementById('pixModal');
      if (pm && pm.classList.contains('ativo')) pm.classList.remove('ativo');
      var cm = document.getElementById('modalConfirmar');
      if (cm && cm.classList.contains('ativo')) cm.classList.remove('ativo');
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


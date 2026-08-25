/* OrganizaJa - app.js */
var estado={tarefas:[],compras:[],habitos:[],metas:[],notas:[],transacoes:[],planejamento:{},gratidao:[],humor:[],leitura:[],contagens:[],exercicios:[],lembretes:[],decisorOpcoes:[],revisao:{notas:"",vitorias:"",desafios:"",aprendidos:"",proxSemana:""},frasesFav:[],aguaHoje:0,aguaData:"",pomodorosHoje:0,pomodorosData:"",tema:"claro",abaAtual:"tarefas",filtroTarefas:"todas",filtroLeitura:"todos",fraseAtual:null};
var pomoSeg=25*60;pomoInt=null;pomoRodando=false;pomoPausando=false;pomoTrabalho=25;pomoPausa=5;
var calcVisor="0";calcOp="";calcAnt=0;calcNovo=true;
var modalCallback=null;
function confirmar(msg,cb){document.getElementById("modalMsg").textContent=msg;document.getElementById("modalOverlay").classList.add("visivel");modalCallback=cb;}
function fecharModal(){document.getElementById("modalOverlay").classList.remove("visivel");modalCallback=null;}
function confirmarAcao(){if(modalCallback)modalCallback();fecharModal();}
function salvar(){try{localStorage.setItem("organizaja",JSON.stringify(estado))}catch(e){}}
function carregar(){try{var d=localStorage.getItem("organizaja");if(d){var parsed=JSON.parse(d);for(var k in parsed){if(parsed.hasOwnProperty(k))estado[k]=parsed[k]}}}catch(e){}}
function toggleTema(){if(estado.tema==="claro"){estado.tema="escuro";document.body.classList.add("escuro");document.getElementById("temaBtn").textContent="☀️"}else{estado.tema="claro";document.body.classList.remove("escuro");document.getElementById("temaBtn").textContent="🌙"}salvar()}
function aplicarTema(){if(estado.tema==="escuro"){document.body.classList.add("escuro");document.getElementById("temaBtn").textContent="☀️"}}
function notificar(msg){var el=document.createElement("div");el.className="notificacao";el.textContent=msg;document.body.appendChild(el);setTimeout(function(){el.remove()},2500)}
function trocarAba(nome,btn){document.querySelectorAll(".aba").forEach(function(b){b.classList.remove("ativa")});if(!btn){var found=document.querySelector('[data-aba="'+nome+'"]');if(found)btn=found}if(btn)btn.classList.add("ativa");document.querySelectorAll(".painel").forEach(function(p){p.classList.remove("ativo")});var p=document.getElementById("p-"+nome);if(p)p.classList.add("ativo");estado.abaAtual=nome;salvar();window.scrollTo({top:0,behavior:"smooth"})}
function toggleBusca(){var w=document.getElementById("buscaWrap");var r=document.getElementById("buscaResultados");if(w.classList.contains("visivel")){w.classList.remove("visivel");r.classList.remove("visivel")}else{w.classList.add("visivel");document.getElementById("buscaInput").focus()}}
function buscar(){var q=document.getElementById("buscaInput").value.toLowerCase().trim();var res=document.getElementById("buscaResultados");if(!q){res.classList.remove("visivel");return}var resultados=[];estado.tarefas.forEach(function(t){if(t.texto.toLowerCase().indexOf(q)>=0)resultados.push({texto:t.texto,tipo:"Tarefa",aba:"tarefas"})});estado.compras.forEach(function(c){if(c.texto.toLowerCase().indexOf(q)>=0)resultados.push({texto:c.texto,tipo:"Compra",aba:"compras"})});estado.notas.forEach(function(n){if(n.titulo.toLowerCase().indexOf(q)>=0||n.texto.toLowerCase().indexOf(q)>=0)resultados.push({texto:n.titulo,tipo:"Nota",aba:"notas"})});estado.metas.forEach(function(m){if(m.nome.toLowerCase().indexOf(q)>=0)resultados.push({texto:m.nome,tipo:"Meta",aba:"metas"})});estado.habitos.forEach(function(h){if(h.nome.toLowerCase().indexOf(q)>=0)resultados.push({texto:h.nome,tipo:"Hábito",aba:"habitos"})});estado.leitura.forEach(function(l){if(l.titulo.toLowerCase().indexOf(q)>=0)resultados.push({texto:l.titulo,tipo:"Leitura",aba:"leitura"})});estado.gratidao.forEach(function(g){if(g.texto.toLowerCase().indexOf(q)>=0)resultados.push({texto:g.texto,tipo:"Gratidão",aba:"gratidao"})});estado.lembretes.forEach(function(l){if(l.texto.toLowerCase().indexOf(q)>=0)resultados.push({texto:l.texto,tipo:"Lembrete",aba:"lembretes"})});if(resultados.length===0){res.innerHTML="<div class=busca-item>Nenhum resultado encontrado</div>"}else{res.innerHTML=resultados.slice(0,10).map(function(r){return"<div class=busca-item onclick=trocarAba('"+r.aba+"',null)>"+r.texto+"<small>"+r.tipo+"</small></div>"}).join("")}res.classList.add("visivel")}
function exportarDados(){var t=JSON.stringify(estado,null,2);var b=new Blob([t],{type:"application/json"});var u=URL.createObjectURL(b);var a=document.createElement("a");a.href=u;a.download="organizaja-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(u);notificar("Dados exportados!")}
function importarDados(){document.getElementById("importarArquivo").click()}
function processarImportacao(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){try{var d=JSON.parse(ev.target.result);for(var k in d){if(d.hasOwnProperty(k))estado[k]=d[k]}salvar();renderTudo();notificar("Dados importados!")}catch(err){notificar("Arquivo inválido!")}};r.readAsText(f)}
window.addEventListener("scroll",function(){var btn=document.getElementById("scrollTopBtn");if(window.scrollY>400)btn.classList.add("visivel");else btn.classList.remove("visivel")});
var deferredPrompt=null;window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredPrompt=e;document.getElementById("instalarBanner").classList.add("visivel")});
document.getElementById("instalarBtn").addEventListener("click",function(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;document.getElementById("instalarBanner").classList.remove("visivel")}});
function fecharInstalar(){document.getElementById("instalarBanner").classList.remove("visivel")}
function addTarefa(){var t=document.getElementById("tarefaInput").value.trim();if(!t)return notificar("Digite uma tarefa!");var p=document.getElementById("tarefaPrio").value;estado.tarefas.push({texto:t,prio:p,feito:false,id:Date.now()});document.getElementById("tarefaInput").value="";salvar();renderTarefas();atualizarStats()}
function toggleTarefa(id){estado.tarefas.forEach(function(t){if(t.id===id)t.feito=!t.feito});salvar();renderTarefas();atualizarStats()}
function delTarefa(id){estado.tarefas=estado.tarefas.filter(function(t){return t.id!==id});salvar();renderTarefas();atualizarStats()}
function filtroTarefa(f){estado.filtroTarefas=f;renderTarefas()}
function limparTarefas(){estado.tarefas=estado.tarefas.filter(function(t){return!t.feito});salvar();renderTarefas();atualizarStats()}
function renderTarefas(){var lista=document.getElementById("tarefasLista");var f=estado.filtroTarefas;var items=estado.tarefas.filter(function(t){if(f==="ativas")return!t.feito;if(f==="feitas")return t.feito;return true});lista.innerHTML=items.map(function(t){var tc=t.prio==="alta"?"tag-alta":t.prio==="media"?"tag-media":"tag-baixa";var pc=t.prio==="alta"?"Alta":t.prio==="media"?"Média":"Baixa";return'<li><div class="check '+(t.feito?"feito":"")+'" onclick="toggleTarefa('+t.id+')">'+(t.feito?"✓":"")+'</div><span class="texto '+(t.feito?"riscado":"")+'">'+t.texto+'</span><span class="tag '+tc+'">'+pc+'</span><div class="acoes"><button class="icone-btn" onclick="delTarefa('+t.id+')" title="Remover">🗑️</button></div></li>'}).join("")}
var catCompras={alimentos:"🥑 Alimentos",bebidas:"🥤 Bebidas",limpeza:"🧹 Limpeza",higiene:"🧴 Higiene",frutas:"🍎 Frutas",carnes:"🥩 Carnes",laticinios:"🧀 Laticínios",padaria:"🍞 Padaria",congelados:"🧊 Congelados",outros:"📦 Outros"};
function addCompra(){var t=document.getElementById("compraInput").value.trim();if(!t)return notificar("Digite um item!");var c=document.getElementById("compraCat").value;estado.compras.push({texto:t,cat:c,comprado:false,id:Date.now()});document.getElementById("compraInput").value="";salvar();renderCompras()}
function toggleCompra(id){estado.compras.forEach(function(c){if(c.id===id)c.comprado=!c.comprado});salvar();renderCompras()}
function delCompra(id){estado.compras=estado.compras.filter(function(c){return c.id!==id});salvar();renderCompras()}
function limparCompras(){estado.compras=estado.compras.filter(function(c){return!c.comprado});salvar();renderCompras()}
function renderCompras(){var lista=document.getElementById("comprasLista");lista.innerHTML=estado.compras.map(function(c){return'<li><div class="check '+(c.comprado?"feito":"")+'" onclick="toggleCompra('+c.id+')">'+(c.comprado?"✓":"")+'</div><span class="texto '+(c.comprado?"riscado":"")+'">'+c.texto+'</span><span class="tag" style="background:var(--card2);color:var(--txt3)">'+(catCompras[c.cat]||c.cat)+'</span><div class="acoes"><button class="icone-btn" onclick="delCompra('+c.id+')" title="Remover">🗑️</button></div></li>'}).join("")}
function pomoToggle(){if(pomoRodando){pomoRodando=false;clearInterval(pomoInt);pomoInt=null;document.getElementById("pomoStart").textContent="▶ Iniciar"}else{pomoRodando=true;pomoInt=setInterval(pomoTick,1000);document.getElementById("pomoStart").textContent="⏸ Pausar"}}
function pomoTick(){pomoSeg--;if(pomoSeg<=0){clearInterval(pomoInt);pomoInt=null;pomoRodando=false;notificar(pomoPausando?"Pausa acabou! Volte ao foco!":"Pomodoro concluído! Hora da pausa!");if(!pomoPausando){estado.pomodorosHoje++;salvar();atualizarStats();pomoPausando=true;pomoSeg=pomoPausa*60;document.getElementById("pomoLabel").textContent="Pausa";document.getElementById("pomoStart").textContent="▶ Iniciar"}else{pomoPausando=false;pomoSeg=pomoTrabalho*60;document.getElementById("pomoLabel").textContent="Foco";document.getElementById("pomoStart").textContent="▶ Iniciar"}}renderPomo()}
function pomoReset(){clearInterval(pomoInt);pomoInt=null;pomoRodando=false;pomoPausando=false;pomoSeg=pomoTrabalho*60;document.getElementById("pomoLabel").textContent="Foco";document.getElementById("pomoStart").textContent="▶ Iniciar";renderPomo()}
function pomoPausaCurta(){clearInterval(pomoInt);pomoInt=null;pomoRodando=false;pomoPausando=true;pomoSeg=5*60;document.getElementById("pomoLabel").textContent="Pausa curta";renderPomo()}
function pomoPausaLonga(){clearInterval(pomoInt);pomoInt=null;pomoRodando=false;pomoPausando=true;pomoSeg=15*60;document.getElementById("pomoLabel").textContent="Pausa longa";renderPomo()}
function pomoConfigurar(){pomoTrabalho=parseInt(document.getElementById("pomoFocoMin").value)||25;pomoPausa=parseInt(document.getElementById("pomoPausaMin").value)||5;pomoReset()}
function renderPomo(){var m=Math.floor(pomoSeg/60);var s=pomoSeg%60;document.getElementById("pomoTempo").textContent=(m<10?"0":"")+m+":"+(s<10?"0":"")+s;var ciclos=document.getElementById("pomoCiclos");var html="";for(var i=0;i<4;i++)html+='<div class="pomodoro-ponto '+(i<estado.pomodorosHoje%4?"preenchido":"")+'"></div>';ciclos.innerHTML=html}
var diasLetra=["S","T","Q","Q","S","S","D"];
function chaveSemana(){var a=new Date();var i=new Date(a.getFullYear(),0,1);var d=Math.floor((a-i)/86400000);return a.getFullYear()+"-S"+Math.ceil(d/7)}
function addHabito(){var n=document.getElementById("habitoInput").value.trim();if(!n)return notificar("Digite um hábito!");var e=document.getElementById("habitoEmoji").value.trim()||"🔵";estado.habitos.push({nome:n,emoji:e,id:Date.now(),semanas:{}});document.getElementById("habitoInput").value="";document.getElementById("habitoEmoji").value="";salvar();renderHabitos()}
function delHabito(id){estado.habitos=estado.habitos.filter(function(h){return h.id!==id});salvar();renderHabitos()}
function toggleHabitoDia(id,dia){var h=estado.habitos.find(function(h){return h.id===id});if(!h)return;var s=chaveSemana();if(!h.semanas[s])h.semanas[s]=[false,false,false,false,false,false,false];h.semanas[s][dia]=!h.semanas[s][dia];salvar();renderHabitos();atualizarStats()}
function renderHabitos(){var grid=document.getElementById("habitosGrid");var s=chaveSemana();var hoje=new Date().getDay();var hojeIdx=hoje===0?6:hoje-1;grid.innerHTML=estado.habitos.map(function(h){var wd=h.semanas[s]||[false,false,false,false,false,false,false];var dias=wd.map(function(d,i){return'<div class="habito-dia '+(d?"marcado":"")+' '+(i===hojeIdx?"hoje":"")+'" onclick="toggleHabitoDia('+h.id+","+i+')">'+diasLetra[i]+'</div>'}).join("");return'<div class="habito-card"><div class="habito-emoji">'+h.emoji+'</div><div class="habito-info"><div class="habito-nome">'+h.nome+'</div><div class="habito-semana">'+dias+'</div></div><button class="icone-btn" onclick="delHabito('+h.id+')">🗑️</button></div>'}).join("")}
function addMeta(){var n=document.getElementById("metaInput").value.trim();if(!n)return notificar("Digite uma meta!");var p=document.getElementById("metaPrazo").value;estado.metas.push({nome:n,prazo:p||"",progresso:0,id:Date.now()});document.getElementById("metaInput").value="";document.getElementById("metaPrazo").value="";salvar();renderMetas()}
function atualizarMetaProgresso(id,val){var m=estado.metas.find(function(m){return m.id===id});if(m){m.progresso=Math.min(100,Math.max(0,parseInt(val)||0));salvar();renderMetas()}}
function delMeta(id){estado.metas=estado.metas.filter(function(m){return m.id!==id});salvar();renderMetas()}
function renderMetas(){var lista=document.getElementById("metasLista");lista.innerHTML=estado.metas.map(function(m){var prazoStr=m.prazo?new Date(m.prazo+"T00:00").toLocaleDateString("pt-BR"):"Sem prazo";return'<div class="meta-card"><div class="meta-nome">'+m.nome+'</div><div class="meta-barra"><div class="meta-progresso" style="width:'+m.progresso+'%"></div></div><div class="meta-info"><span>'+prazoStr+'</span><span>'+m.progresso+'%</span></div><div style="margin-top:.4rem;display:flex;gap:.3rem;align-items:center"><input type="range" min="0" max="100" value="'+m.progresso+'" onchange="atualizarMetaProgresso('+m.id+',this.value)" style="flex:1;accent-color:var(--cor)"><button class="icone-btn" onclick="delMeta('+m.id+')">🗑️</button></div></div>'}).join("")}
function addNota(){var t=document.getElementById("notaTitulo").value.trim();var txt=document.getElementById("notaTexto").value.trim();if(!t&&!txt)return notificar("Escreva algo!");estado.notas.push({titulo:t||"Sem título",texto:txt,id:Date.now()});document.getElementById("notaTitulo").value="";document.getElementById("notaTexto").value="";salvar();renderNotas()}
function delNota(id){estado.notas=estado.notas.filter(function(n){return n.id!==id});salvar();renderNotas()}
function renderNotas(){var grid=document.getElementById("notasGrid");grid.innerHTML=estado.notas.map(function(n){return'<div class="nota-card"><div class="nota-acoes"><button class="icone-btn" onclick="delNota('+n.id+')">🗑️</button></div><h4>'+n.titulo+'</h4><p>'+n.texto+'</p></div>'}).join("")}
function addTransacao(){var d=document.getElementById("transDesc").value.trim();var v=parseFloat(document.getElementById("transValor").value);if(!d||isNaN(v))return notificar("Preencha descrição e valor!");var t=document.getElementById("transTipo").value;var c=document.getElementById("transCat").value;estado.transacoes.push({desc:d,valor:v,tipo:t,cat:c,data:new Date().toISOString().slice(0,10),id:Date.now()});document.getElementById("transDesc").value="";document.getElementById("transValor").value="";salvar();renderOrcamento()}
function delTransacao(id){estado.transacoes=estado.transacoes.filter(function(t){return t.id!==id});salvar();renderOrcamento()}
function limparTransacoes(){estado.transacoes=[];salvar();renderOrcamento()}
function renderOrcamento(){var rec=0,des=0;estado.transacoes.forEach(function(t){if(t.tipo==="receita")rec+=t.valor;else des+=t.valor});document.getElementById("orcReceita").textContent="R$ "+rec.toFixed(2);document.getElementById("orcDespesa").textContent="R$ "+des.toFixed(2);document.getElementById("orcSaldo").textContent="R$ "+(rec-des).toFixed(2);var lista=document.getElementById("transLista");lista.innerHTML=estado.transacoes.slice().reverse().map(function(t){return'<li><span style="color:'+(t.tipo==="receita"?"var(--verde)":"var(--vermelho)")+'">'+(t.tipo==="receita"?"↑":"↓")+'</span><span class="texto">'+t.desc+'</span><span class="tag" style="background:var(--card2);color:var(--txt3)">'+t.cat+'</span><span style="font-weight:600;color:'+(t.tipo==="receita"?"var(--verde)":"var(--vermelho)")+'">R$ '+t.valor.toFixed(2)+'</span><button class="icone-btn" onclick="delTransacao('+t.id+')">🗑️</button></li>'}).join("")}
function renderAgua(){var hoje=new Date().toISOString().slice(0,10);if(estado.aguaData!==hoje){estado.aguaHoje=0;estado.aguaData=hoje;salvar()}var grid=document.getElementById("aguaGrid");var html="";for(var i=0;i<8;i++)html+='<div class="agua-copo '+(i<estado.aguaHoje?"cheio":"")+'" onclick="toggleAgua('+i+')">💧</div>';grid.innerHTML=html;document.getElementById("aguaInfo").innerHTML="Você bebeu <strong>"+estado.aguaHoje+"</strong> de 8 copos hoje";atualizarStats()}
function toggleAgua(n){estado.aguaHoje=n<estado.aguaHoje?n:n+1;salvar();renderAgua();atualizarStats()}
var diasSemana=["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
var refeicoesTipos=["Café da manhã","Almoço","Lanche","Jantar"];
function renderRefeicoes(){var grid=document.getElementById("refeicoesGrid");if(!estado.refeicoes)estado.refeicoes={};grid.innerHTML=diasSemana.map(function(dia,idx){var card='<div class="refeicao-card"><div class="refeicao-dia">'+dia+'</div>';refeicoesTipos.forEach(function(tipo,tidx){var chave=idx+"-"+tidx;var val=estado.refeicoes[chave]||"";card+='<div class="refeicao-linha"><span>'+tipo+'</span><input value="'+val+'" onchange="salvarRefeicao(\''+chave+'\',this.value)" placeholder="-"></div>'});card+='</div>';return card}).join("")}
function salvarRefeicao(chave,val){if(!estado.refeicoes)estado.refeicoes={};estado.refeicoes[chave]=val;salvar()}
function renderPlanejamento(){var grid=document.getElementById("planejGrid");if(!estado.planejamento)estado.planejamento={};grid.innerHTML=diasSemana.map(function(dia,idx){var val=estado.planejamento[idx]||"";return'<div class="planej-dia"><h4>'+dia+'</h4><textarea onchange="salvarPlanej('+idx+',this.value)">'+val+'</textarea></div>'}).join("")}
function salvarPlanej(idx,val){estado.planejamento[idx]=val;salvar()}
function addGratidao(){var t=document.getElementById("gratidaoInput").value.trim();if(!t)return notificar("Escreva algo!");estado.gratidao.push({texto:t,data:new Date().toLocaleDateString("pt-BR"),id:Date.now()});document.getElementById("gratidaoInput").value="";salvar();renderGratidao()}
function delGratidao(id){estado.gratidao=estado.gratidao.filter(function(g){return g.id!==id});salvar();renderGratidao()}
function renderGratidao(){var lista=document.getElementById("gratidaoLista");lista.innerHTML=estado.gratidao.slice().reverse().map(function(g){return'<li><span>'+g.texto+' <small style="color:var(--txt3)">'+g.data+'</small></span><button class="icone-btn" onclick="delGratidao('+g.id+')">🗑️</button></li>'}).join("")}
function registrarHumor(h){var hoje=new Date().toISOString().slice(0,10);var existente=estado.humor.find(function(r){return r.data===hoje});if(existente){existente.humor=h}else{estado.humor.push({data:hoje,humor:h})}salvar();renderHumor();notificar("Humor registrado: "+h)}
function renderHumor(){var hoje=new Date().toISOString().slice(0,10);var regHoje=estado.humor.find(function(r){return r.data===hoje});document.getElementById("humorRegistro").textContent=regHoje?"Hoje: "+regHoje.humor:"Nenhum registro hoje";document.querySelectorAll(".humor-btn").forEach(function(b){b.classList.remove("selecionado");if(regHoje&&b.textContent.trim()===regHoje.humor.split(" ").pop())b.classList.add("selecionado")});var hist=document.getElementById("humorHistorico");var ultimos=estado.humor.slice(-14).reverse();hist.innerHTML=ultimos.length?'<p style="font-size:.8rem;color:var(--txt3);margin-bottom:.3rem">Últimos 14 dias</p>'+ultimos.map(function(r){return'<div style="font-size:.8rem;padding:.2rem 0;border-bottom:1px solid var(--borda)">'+r.data+": "+r.humor+"</div>"}).join(""):""}
function addLeitura(){var t=document.getElementById("leituraInput").value.trim();if(!t)return notificar("Digite um título!");var s=document.getElementById("leituraStatus").value;estado.leitura.push({titulo:t,status:s,id:Date.now()});document.getElementById("leituraInput").value="";salvar();renderLeitura()}
function trocarLeituraStatus(id){var l=estado.leitura.find(function(l){return l.id===id});if(l){if(l.status==="quero")l.status="lendo";else if(l.status==="lendo")l.status="lido";else l.status="quero";salvar();renderLeitura()}}
function delLeitura(id){estado.leitura=estado.leitura.filter(function(l){return l.id!==id});salvar();renderLeitura()}
function filtroLeitura(f){estado.filtroLeitura=f;renderLeitura()}
function renderLeitura(){var lista=document.getElementById("leituraLista");var f=estado.filtroLeitura;var items=estado.leitura.filter(function(l){if(f==="quero")return l.status==="quero";if(f==="lendo")return l.status==="lendo";if(f==="lido")return l.status==="lido";return true});var emojis={quero:"📖",lendo:"📗",lido:"✅"};lista.innerHTML=items.map(function(l){return'<div class="leitura-card"><div class="leitura-emoji">'+emojis[l.status]+'</div><div class="leitura-info"><h4>'+l.titulo+'</h4><p>'+(l.status==="quero"?"Quero ler":l.status==="lendo"?"Lendo":"Já li")+'</p></div><button class="btn btn-s" style="font-size:.7rem" onclick="trocarLeituraStatus('+l.id+')">Avançar</button><button class="icone-btn" onclick="delLeitura('+l.id+')">🗑️</button></div>'}).join("")}
function addExercicio(){var n=document.getElementById("exercicioInput").value.trim();if(!n)return notificar("Digite o exercício!");var d=document.getElementById("exercicioDuracao").value.trim();var t=document.getElementById("exercicioTipo").value;estado.exercicios.push({nome:n,duracao:d,tipo:t,data:new Date().toLocaleDateString("pt-BR"),id:Date.now()});document.getElementById("exercicioInput").value="";document.getElementById("exercicioDuracao").value="";salvar();renderExercicios()}
function delExercicio(id){estado.exercicios=estado.exercicios.filter(function(e){return e.id!==id});salvar();renderExercicios()}
var emojisExercicio={cardio:"🏃",forca:"💪",flex:"🧘",outro:"🔵"};
function renderExercicios(){var lista=document.getElementById("exerciciosLista");lista.innerHTML=estado.exercicios.slice().reverse().map(function(e){return'<div class="exercicio-card"><span>'+(emojisExercicio[e.tipo]||"🔵")+' '+e.nome+'</span><span style="color:var(--txt3);font-size:.78rem">'+e.duracao+" · "+e.data+'</span><button class="icone-btn" onclick="delExercicio('+e.id+')">🗑️</button></div>'}).join("")}
function addRegressiva(){var n=document.getElementById("regressivaNome").value.trim();if(!n)return notificar("Digite o nome!");var d=document.getElementById("regressivaData").value;if(!d)return notificar("Escolha a data!");estado.contagens.push({nome:n,data:d,id:Date.now()});document.getElementById("regressivaNome").value="";document.getElementById("regressivaData").value="";salvar();renderRegressiva()}
function delRegressiva(id){estado.contagens=estado.contagens.filter(function(c){return c.id!==id});salvar();renderRegressiva()}
function renderRegressiva(){var lista=document.getElementById("regressivaLista");var agora=new Date().getTime();lista.innerHTML=estado.contagens.map(function(c){var alvo=new Date(c.data).getTime();var diff=alvo-agora;var txt;if(diff<=0){txt="🎉 Chegou!"}else{var dias=Math.floor(diff/86400000);var horas=Math.floor((diff%86400000)/3600000);var mins=Math.floor((diff%3600000)/60000);txt=dias+"d "+horas+"h "+mins+"m"}return'<div class="regressiva-item"><h4>'+c.nome+'</h4><div class="tempo">'+txt+'</div><div class="detalhes">'+new Date(c.data).toLocaleString("pt-BR")+'</div><button class="icone-btn" onclick="delRegressiva('+c.id+')">🗑️</button></div>'}).join("")}
function gerarSenha(){var tam=parseInt(document.getElementById("senhaTam").value)||16;var chars="";if(document.getElementById("senhaMaius").checked)chars+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";if(document.getElementById("senhaMinus").checked)chars+="abcdefghijklmnopqrstuvwxyz";if(document.getElementById("senhaNum").checked)chars+="0123456789";if(document.getElementById("senhaSimb").checked)chars+="!@#$%^&*()_+-=[]{}|;:,.<>?";if(!chars)chars="abcdefghijklmnopqrstuvwxyz0123456789";var senha="";for(var i=0;i<tam;i++)senha+=chars.charAt(Math.floor(Math.random()*chars.length));document.getElementById("senhaDisplay").textContent=senha}
function copiarSenha(){var s=document.getElementById("senhaDisplay").textContent;if(s&&s!=="Clique para gerar"){navigator.clipboard.writeText(s).then(function(){notificar("Senha copiada!")}).catch(function(){notificar("Erro ao copiar")})}}
function calcDigito(d){var tela=document.getElementById("calcTela");if(d==="C"){calcVisor="0";calcOp="";calcAnt=0;calcNovo=true;tela.textContent="0";return}if(d==="⌫"){calcVisor=calcVisor.length>1?calcVisor.slice(0,-1):"0";tela.textContent=calcVisor;return}if(d==="%"){var v=parseFloat(calcVisor);calcVisor=String(v/100);tela.textContent=calcVisor;return}if(["+","-","*","/"].indexOf(d)>=0){calcAnt=parseFloat(calcVisor);calcOp=d;calcNovo=true;return}if(d==="."){if(calcVisor.indexOf(".")>=0)return;if(calcNovo){calcVisor="0";calcNovo=false}calcVisor+=".";tela.textContent=calcVisor;return}if(calcNovo){calcVisor=d;calcNovo=false}else{calcVisor+=d}tela.textContent=calcVisor}
function calcIgual(){if(!calcOp)return;var b=parseFloat(calcVisor);var r=0;if(calcOp==="+")r=calcAnt+b;if(calcOp==="-")r=calcAnt-b;if(calcOp==="*")r=calcAnt*b;if(calcOp==="/")r=b!==0?calcAnt/b:0;calcVisor=String(Math.round(r*1e10)/1e10);calcOp="";calcNovo=true;document.getElementById("calcTela").textContent=calcVisor}
function calcLimpar(){calcVisor="0";calcOp="";calcAnt=0;calcNovo=true;document.getElementById("calcTela").textContent="0"}
function addLembrete(){var t=document.getElementById("lembreteInput").value.trim();if(!t)return notificar("Digite o lembrete!");var h=document.getElementById("lembreteHora").value||"";estado.lembretes.push({texto:t,hora:h,id:Date.now()});document.getElementById("lembreteInput").value="";document.getElementById("lembreteHora").value="";salvar();renderLembretes();verificarLembretes()}
function delLembrete(id){estado.lembretes=estado.lembretes.filter(function(l){return l.id!==id});salvar();renderLembretes()}
function renderLembretes(){var lista=document.getElementById("lembretesLista");lista.innerHTML=estado.lembretes.slice().reverse().map(function(l){return'<div class="lembrete-card"><span class="lembrete-texto">'+l.texto+'</span>'+(l.hora?'<span class="lembrete-hora">'+l.hora+'</span>':'')+'<button class="icone-btn" onclick="delLembrete('+l.id+')">🗑️</button></div>'}).join("")}
function verificarLembretes(){if(!("Notification" in window))return;Notification.requestPermission();setInterval(function(){var agora=new Date();var h=agora.getHours().toString().padStart(2,"0")+":"+agora.getMinutes().toString().padStart(2,"0");estado.lembretes.forEach(function(l){if(l.hora===h&&l.notificado!==agora.toISOString().slice(0,10)){l.notificado=agora.toISOString().slice(0,10);salvar();new Notification("OrganizaJá - Lembrete",{body:l.texto})}})},60000)}
function addDecisorOpcao(){var t=document.getElementById("decisorInput").value.trim();if(!t)return notificar("Digite uma opção!");estado.decisorOpcoes.push({texto:t,id:Date.now()});document.getElementById("decisorInput").value="";salvar();renderDecisor()}
function delDecisorOpcao(id){estado.decisorOpcoes=estado.decisorOpcoes.filter(function(o){return o.id!==id});salvar();renderDecisor()}
function sortearDecisor(){if(estado.decisorOpcoes.length<2)return notificar("Adicione pelo menos 2 opções!");var idx=Math.floor(Math.random()*estado.decisorOpcoes.length);document.getElementById("decisorResultado").textContent="🎉 "+estado.decisorOpcoes[idx].texto}
function renderDecisor(){var lista=document.getElementById("decisorOpcoes");lista.innerHTML=estado.decisorOpcoes.map(function(o){return'<div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.2rem;font-size:.85rem;padding:.2rem 0"><span style="flex:1">'+o.texto+'</span><button class="icone-btn" onclick="delDecisorOpcao('+o.id+')">🗑️</button></div>'}).join("")}
function renderRevisao(){var blocos=document.getElementById("revisaoBlocos");var campos=[{k:"vitorias",icone:"🏆",titulo:"Vitórias da semana"},{k:"desafios",icone:"⚡",titulo:"Desafios enfrentados"},{k:"aprendidos",icone:"💡",titulo:"O que aprendi"},{k:"proxSemana",icone:"🎯",titulo:"Foco da próxima semana"}];if(!estado.revisao)estado.revisao={};blocos.innerHTML=campos.map(function(c){var val=estado.revisao[c.k]||"";return'<div class="revisao-bloco"><h4>'+c.icone+" "+c.titulo+'</h4><textarea class="campo" rows="2" onchange="salvarRevisaoCampo(\''+c.k+'\',this.value)">'+val+'</textarea></div>'}).join("");var notas=estado.revisao.notas||"";document.getElementById("revisaoNotas").value=notas}
function salvarRevisaoCampo(k,val){estado.revisao[k]=val;salvar()}
function salvarRevisao(){estado.revisao.notas=document.getElementById("revisaoNotas").value;salvar();notificar("Revisão salva!")}
var frases=[{t:"A jornada de mil milhas começa com um simples passo.",a:"Laozi"},{t:"Não é sobre ter tempo. É sobre fazer tempo.",a:"Desconhecido"},{t:"O sucesso é a soma de pequenos esforços repetidos dia após dia.",a:"Robert Collier"},{t:"A disciplina é a ponte entre metas e conquistas.",a:"Jim Rohn"},{t:"Comece onde você está. Use o que tem. Faça o que pode.",a:"Arthur Ashe"},{t:"O único modo de fazer um excelente trabalho é amar o que você faz.",a:"Steve Jobs"},{t:"Tudo o que você sempre quis está do outro lado do medo.",a:"George Addair"},{t:"Acredite que você pode, assim você já está no meio do caminho.",a:"Theodore Roosevelt"},{t:"O futuro pertence a quem acredita na beleza dos seus sonhos.",a:"Eleanor Roosevelt"},{t:"Não espere por circunstâncias ideais. Crie-as.",a:"George Bernard Shaw"},{t:"A persistência é o caminho do êxito.",a:"Charles Chaplin"},{t:"Mude seus pensamentos e mude o mundo.",a:"Norman Vincent Peale"},{t:"O que não mata fortalece.",a:"Friedrich Nietzsche"},{t:"Quem cuida dos pequenos detalhes faz grandes conquistas.",a:"Desconhecido"},{t:"A melhor hora para começar é agora.",a:"Desconhecido"}];
function novaFrase(){var idx=Math.floor(Math.random()*frases.length);estado.fraseAtual=frases[idx];document.getElementById("fraseBox").textContent="\""+frases[idx].t+"\"";document.getElementById("fraseAutor").textContent="- "+frases[idx].a;salvar()}
function favoritarFrase(){if(!estado.fraseAtual)return notificar("Veja uma frase primeiro!");var ja=estado.frasesFav.find(function(f){return f.t===estado.fraseAtual.t});if(ja)return notificar("Já está nos favoritos!");estado.frasesFav.push(estado.fraseAtual);salvar();renderFrasesFav();notificar("Frase favoritada!")}
function delFraseFav(idx){estado.frasesFav.splice(idx,1);salvar();renderFrasesFav()}
function renderFrasesFav(){var lista=document.getElementById("frasesFavLista");lista.innerHTML=estado.frasesFav.map(function(f,i){return'<li><span class="texto">\"+f.t+\" - '+f.a+'</span><button class="icone-btn" onclick="delFraseFav('+i+')">🗑️</button></li>'}).join("")}
function atualizarStats(){var total=estado.tarefas.length;var feitas=estado.tarefas.filter(function(t){return t.feito}).length;var hoje=new Date();var hojeIdx=hoje.getDay()===0?6:hoje.getDay()-1;var s=chaveSemana();var habHoje=estado.habitos.filter(function(h){return h.semanas[s]&&h.semanas[s][hojeIdx]}).length;var pomoData=hoje.toISOString().slice(0,10);if(estado.pomodorosData!==pomoData){estado.pomodorosHoje=0;estado.pomodorosData=pomoData;salvar()}document.getElementById("statTarefas").textContent=total;document.getElementById("statFeitas").textContent=feitas;document.getElementById("statHabitos").textContent=habHoje;document.getElementById("statPomo").textContent=estado.pomodorosHoje;document.getElementById("statAgua").textContent=estado.aguaHoje}

/* === PAINEL DA VIDA === */
function calcularVida(){
  var hoje=new Date();
  var hojeIdx=hoje.getDay()===0?6:hoje.getDay()-1;
  var s=chaveSemana();
  var pomoData=hoje.toISOString().slice(0,10);
  var scores={};

  // PRODUTIVIDADE (0-100)
  var tTotal=estado.tarefas.length;
  var tFeitas=estado.tarefas.filter(function(t){return t.feito}).length;
  var tPrio=estado.tarefas.filter(function(t){return t.feito&&t.prio==="alta"}).length;
  var tScore=tTotal>0?Math.round((tFeitas/tTotal)*60+(tPrio>0?15:0)):15;
  var pomoScore=Math.min(30,estado.pomodorosHoje*8);
  var metaScore=estado.metas.length>0?Math.round(estado.metas.reduce(function(s,m){return s+m.progresso},0)/estado.metas.length*0.25):5;
  scores.produtividade=Math.min(100,tScore+pomoScore+metaScore);

  // SAUDE (0-100)
  var aguaScore=Math.round((estado.aguaHoje/8)*25);
  var hSemana=estado.habitos.length>0?estado.habitos.filter(function(h){return h.semanas[s]&&h.semanas[s][hojeIdx]}).length:0;
  var habScore=estado.habitos.length>0?Math.round((hSemana/estado.habitos.length)*30):5;
  var exSemana=estado.exercicios.filter(function(e){var partes=e.data.split("/");var d=partes.length===3?new Date(partes[2]+"-"+partes[1]+"-"+partes[0]):new Date(e.data);if(isNaN(d))return false;var diff=Math.floor((hoje-d)/86400000);return diff>=0&&diff<7}).length;
  var exScore=Math.min(25,exSemana*5);
  var humData=hoje.toISOString().slice(0,10);
  var humHoje=estado.humor.find(function(r){return r.data===humData});
  var humScore=humHoje?((humHoje.humor.indexOf("Feliz")>=0||humHoje.humor.indexOf("Agradecido")>=0)?20:humHoje.humor.indexOf("Neutro")>=0?12:5):0;
  scores.saude=Math.min(100,aguaScore+habScore+exScore+humScore);

  // FINANCAS (0-100)
  var rec=0,des=0;
  estado.transacoes.forEach(function(t){if(t.tipo==="receita")rec+=t.valor;else des+=t.valor});
  var saldo=rec-des;
  var finScore;
  if(estado.transacoes.length===0){finScore=15}
  else if(saldo>=0){finScore=Math.min(80,40+Math.round((saldo/(rec||1))*40))}
  else{finScore=Math.max(5,30-Math.round(Math.abs(saldo)/(rec||1)*30))}
  var planScore=Object.values(estado.planejamento||{}).filter(function(v){return v&&v.trim().length>0}).length>0?20:0;
  scores.financas=Math.min(100,finScore+planScore);

  // PLANEJAMENTO (0-100)
  var mProg=estado.metas.length>0?Math.round(estado.metas.reduce(function(s,m){return s+m.progresso},0)/estado.metas.length):0;
  var planDias=Object.values(estado.planejamento||{}).filter(function(v){return v&&v.trim().length>0}).length;
  var planScore2=Math.round((planDias/7)*35);
  var refDias=0;
  if(estado.refeicoes){Object.values(estado.refeicoes).forEach(function(v){if(v&&v.trim().length>0)refDias++})}
  var refScore=Math.min(25,refDias*2);
  var compFeitas=estado.compras.filter(function(c){return c.comprado}).length;
  var compTotal=estado.compras.length;
  var compScore=compTotal>0?Math.round((compFeitas/compTotal)*20):5;
  scores.planejamento=Math.min(100,mProg*0.35+planScore2+refScore+compScore);

  // BEM-ESTAR (0-100)
  var gratHoje=estado.gratidao.length>0?Math.min(25,estado.gratidao.length*3):0;
  var humScore2=humHoje?15:0;
  var gratSemana=estado.gratidao.filter(function(g){var diff=Math.floor((hoje-new Date(g.data||g.id))/(86400000));return diff>=0&&diff<7}).length;
  var gratScore2=Math.min(20,gratSemana*5);
  var livLendo=estado.leitura.filter(function(l){return l.status==="lendo"}).length;
  var livScore=Math.min(20,livLendo*8);
  var revSemana=estado.revisao&&(estado.revisao.vitorias||estado.revisao.desafios||estado.revisao.aprendidos||estado.revisao.proxSemana)?20:0;
  scores.bemestar=Math.min(100,gratScore2+humScore2+gratHoje+livScore+revSemana);

  // OVERALL (weighted)
  var overall=Math.round(scores.produtividade*0.22+scores.saude*0.25+scores.financas*0.18+scores.planejamento*0.18+scores.bemestar*0.17);

  // Nivel
  var nivel,nivelClass,nivelEmoji;
  if(overall>=80){nivel="Brilhante";nivelClass="n4";nivelEmoji="🌟"}
  else if(overall>=60){nivel="No caminho certo";nivelClass="n3";nivelEmoji="🚀"}
  else if(overall>=40){nivel="Melhorando";nivelClass="n2";nivelEmoji="💪"}
  else if(overall>=20){nivel="Começando";nivelClass="n1";nivelEmoji="🌱"}
  else{nivel="Zona de oportunidade";nivelClass="n0";nivelEmoji="💡"}

  // Dicas contextuais
  var dicas=[];
  if(scores.produtividade<40)dicas.push({icon:"☑️",texto:"Conclua tarefas pendentes e use o Pomodoro para aumentar seu foco."});
  if(scores.saude<40)dicas.push({icon:"💧",texto:"Beba mais água, marque seus hábitos e registre como está se sentindo."});
  if(scores.financas<40)dicas.push({icon:"💰",texto:"Registre suas receitas e despesas no orçamento para ter controle financeiro."});
  if(scores.planejamento<40)dicas.push({icon:"📅",texto:"Planeje sua semana e defina metas com prazos para organizar melhor."});
  if(scores.bemestar<40)dicas.push({icon:"🙏",texto:"Escreva gratidões diárias e revise sua semana para aumentar bem-estar."});
  if(dicas.length===0)dicas.push({icon:"🎉",texto:"Você está indo muito bem! Continue mantendo suas rotinas."});

  // Streak: dias seguidos com pelo menos 1 acao
  var streak=0;
  var vidaHist=JSON.parse(localStorage.getItem("vidaHist")||"[]");
  for(var i=vidaHist.length-1;i>=0;i--){
    if(vidaHist[i].score>5)streak++;else break
  }

  // Competencias (mini stats)
  var tFeitasCount=estado.tarefas.filter(function(t){return t.feito}).length;
  var habHojeCount=estado.habitos.filter(function(h){return h.semanas[s]&&h.semanas[s][hojeIdx]}).length;
  var gratCount=estado.gratidao.length;

  return{overall:overall,nivel:nivel,nivelClass:nivelClass,nivelEmoji:nivelEmoji,scores:scores,dicas:dicas,streak:streak,comp:{tarefasFeitas:tFeitasCount,habitosHoje:habHojeCount,gratidao:gratCount},hist:vidaHist}
}

function salvarVidaHist(score){
  var hoje=new Date().toISOString().slice(0,10);
  var vidaHist=JSON.parse(localStorage.getItem("vidaHist")||"[]");
  if(vidaHist.length>0&&vidaHist[vidaHist.length-1].data===hoje){vidaHist[vidaHist.length-1].score=score}
  else{vidaHist.push({data:hoje,score:score})}
  if(vidaHist.length>60)vidaHist=vidaHist.slice(-60);
  localStorage.setItem("vidaHist",JSON.stringify(vidaHist));
  return vidaHist
}

function renderVida(){
  var v=calcularVida();
  salvarVidaHist(v.overall);
  var circ=2*Math.PI*85;
  var offset=circ-(v.overall/100)*circ;
  var bar=document.getElementById("vidaScoreBar");
  var cor;
  if(v.overall>=80)cor="#00b894";
  else if(v.overall>=60)cor="#0984e3";
  else if(v.overall>=40)cor="#fdcb6e";
  else if(v.overall>=20)cor="#e17055";
  else cor="#636e72";
  bar.setAttribute("stroke",cor);
  bar.style.strokeDashoffset=offset;

  // Animate number
  var numEl=document.getElementById("vidaScoreNum");
  var current=parseInt(numEl.textContent)||0;
  var diff=v.overall-current;
  var steps=30;
  var step=0;
  var interval=setInterval(function(){
    step++;
    var val=Math.round(current+(diff*(step/steps)));
    numEl.textContent=val;
    if(step>=steps){clearInterval(interval);numEl.textContent=v.overall}
  },30);

  // Nivel
  var nEl=document.getElementById("vidaNivel");
  nEl.textContent=v.nivelEmoji+" "+v.nivel;
  nEl.className="vida-nivel "+v.nivelClass;

  // Comp mini stats
  var compEl=document.getElementById("vidaComp");
  compEl.innerHTML='<div class="vida-comp-item"><div class="num">'+v.comp.tarefasFeitas+'</div><div class="lbl">Tarefas feitas</div></div><div class="vida-comp-item"><div class="num">'+v.comp.habitosHoje+'</div><div class="lbl">Hábitos hoje</div></div><div class="vida-comp-item"><div class="num">'+v.comp.gratidao+'</div><div class="lbl">Gratidões</div></div><div class="vida-comp-item"><div class="num">'+estado.pomodorosHoje+'</div><div class="lbl">Pomodoros</div></div>';

  // Categories
  var cats=[
    {key:"produtividade",icon:"🚀",nome:"Produtividade"},
    {key:"saude",icon:"💚",nome:"Saúde e Hábitos"},
    {key:"financas",icon:"💰",nome:"Finanças"},
    {key:"planejamento",icon:"📅",nome:"Planejamento"},
    {key:"bemestar",icon:"🙏",nome:"Bem-estar"}
  ];
  var catsEl=document.getElementById("vidaCats");
  catsEl.innerHTML=cats.map(function(c){
    var sc=v.scores[c.key];
    var fillCor;
    if(sc>=80)fillCor="#00b894";
    else if(sc>=60)fillCor="#0984e3";
    else if(sc>=40)fillCor="#fdcb6e";
    else if(sc>=20)fillCor="#e17055";
    else fillCor="#636e72";
    return'<div class="vida-cat"><span class="vida-cat-icon">'+c.icon+'</span><div class="vida-cat-info"><div class="vida-cat-nome">'+c.nome+'</div><div class="vida-cat-barra"><div class="vida-cat-fill" style="width:0%;background:'+fillCor+'" data-w="'+sc+'%"></div></div></div><span class="vida-cat-score" style="color:'+fillCor+'">'+sc+'</span></div>'
  }).join("");

  // Animate bars after render
  setTimeout(function(){document.querySelectorAll(".vida-cat-fill").forEach(function(el){el.style.width=el.getAttribute("data-w")})},100);

  // Dicas
  var dicasEl=document.getElementById("vidaDicas");
  dicasEl.innerHTML=v.dicas.map(function(d){return'<div class="vida-dica"><span class="vida-dica-icon">'+d.icon+'</span><span>'+d.texto+'</span></div>'}).join("");

  // Streak
  var streakEl=document.getElementById("vidaStreak");
  streakEl.innerHTML=v.streak>0?'🔥 Sequência de <strong>'+v.streak+'</strong> dia'+(v.streak>1?"s":"")+" usando o app":'💡 Use o app todos os dias para criar uma sequência!';

  // History dots (last 30 days)
  var histEl=document.getElementById("vidaHist");
  var hist=v.hist.slice(-30);
  if(hist.length>0){
    histEl.innerHTML=hist.map(function(h){
      var cor;
      if(h.score>=80)cor="#00b894";
      else if(h.score>=60)cor="#0984e3";
      else if(h.score>=40)cor="#fdcb6e";
      else if(h.score>=20)cor="#e17055";
      else cor="#636e72";
      return'<div class="vida-hist-dot" style="background:'+cor+'" title="'+h.data+': '+h.score+'"></div>'
    }).join("")
  }else{
    histEl.innerHTML=''
  }
}
function renderTudo(){renderTarefas();renderCompras();renderPomo();renderHabitos();renderMetas();renderNotas();renderOrcamento();renderAgua();renderRefeicoes();renderPlanejamento();renderGratidao();renderHumor();renderLeitura();renderExercicios();renderRegressiva();renderLembretes();renderDecisor();renderRevisao();renderFrasesFav();renderVida();atualizarStats();if(estado.fraseAtual){document.getElementById("fraseBox").textContent="\""+estado.fraseAtual.t+"\"";document.getElementById("fraseAutor").textContent="- "+estado.fraseAtual.a}}
carregar();aplicarTema();renderTudo();
if(estado.abaAtual&&estado.abaAtual!=="tarefas"){var abas=document.querySelectorAll(".aba");abas.forEach(function(b){b.classList.remove("ativa")});var paineis=document.querySelectorAll(".painel");paineis.forEach(function(p){p.classList.remove("ativo")});abas.forEach(function(b){if(b.textContent.toLowerCase().indexOf(estado.abaAtual)>=0||b.getAttribute("onclick")&&b.getAttribute("onclick").indexOf(estado.abaAtual)>=0){b.classList.add("ativa")}});var p=document.getElementById("p-"+estado.abaAtual);if(p)p.classList.add("ativo")}
(function(){
try{
var abasValidas=["vida","tarefas","pomodoro","metas","notas","lembretes","decisor","habitos","agua","exercicios","humor","gratidao","refeicoes","orcamento","compras","planejamento","regressiva","calculadora","senhas","leitura","revisao","frases"];
var alvo="";
var m=window.location.search.match(/[?&]aba=([a-z]+)/i);
if(m)alvo=m[1].toLowerCase();
if(!alvo&&window.location.hash)alvo=window.location.hash.replace("#","").toLowerCase();
if(alvo&&abasValidas.indexOf(alvo)>=0){
var btn=document.querySelector('[data-aba="'+alvo+'"]');
trocarAba(alvo,btn);
}
}catch(e){}
})();
setInterval(function(){renderRegressiva()},60000);
if("Notification" in window&&Notification.permission==="default")Notification.requestPermission();
(function(){var manifest={name:"OrganizaJá",short_name:"OrganizaJá",description:"Organize toda a sua vida: tarefas, hábitos, metas e muito mais.",start_url:"./",display:"standalone",background_color:"#f6f7fb",theme_color:"#6c5ce7",orientation:"portrait",icons:[{src:"data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect fill=\"%236c5ce7\" width=\"100\" height=\"100\" rx=\"20\"/><text x=\"50\" y=\"65\" font-size=\"45\" text-anchor=\"middle\" fill=\"white\">📋</text></svg>",sizes:"512x512",type:"image/svg+xml",purpose:"any maskable"}]};var mBlob=new Blob([JSON.stringify(manifest)],{type:"application/json"});var mUrl=URL.createObjectURL(mBlob);var link=document.createElement("link");link.rel="manifest";link.href=mUrl;document.head.appendChild(link)})();
/* Service worker desabilitado neste modo de arquivo unico */

var dicas=[
"A regra dos 2 minutos: se algo leva menos de 2 min, faça agora mesmo!",
"Antes de dormir, escreva as 3 prioridades do dia seguinte.",
"Divida tarefas grandes em passos pequenos e comemore cada um.",
"Use a técnica Pomodoro: 25 min de foco, 5 min de pausa.",
"Comece pelo mais difícil quando sua energia está no topo.",
"Reserve 10 min para organizar sua mesa antes de trabalhar.",
"Faça uma coisa de cada vez. Multitarefa é ilusão.",
"Revise suas metas toda semana para manter o rumo.",
"Anote ideias logo que surgem. A memória é falha.",
"Elimine distrações: celular silencioso, notificações off.",
"Planeje suas refeições no domingo e economize tempo na semana.",
"Beba um copo de água ao acordar. Seu corpo agradece.",
"Faça pausas para alongar. Seu corpo não foi feito para ficar parado.",
"Gratidão diária muda como você vê o mundo. Experimente 7 dias.",
"Delegue o que não precisa ser feito por você.",
"Cada hábito novo começa com um dia. Depois são dois, três...",
"Use listas de compras para evitar compras por impulso.",
"Defina um limite de tela antes de dormir. Sono é prioridade.",
"Organize por categorias: trabalho, casa, saúde, lazer.",
"Comece o dia com a tarefa que mais te dá preguiça. Depois fica fácil.",
"Um caderno ou app de notas salva mais ideias que a memória.",
"5 min de meditação reduzem ansiedade e melhoram foco.",
"Marque compromissos consigo mesmo na agenda. É prioridade também.",
"Menos é mais: foque no essencial e solte o resto.",
"Semear disciplina hoje colhe liberdade amanhã."
];
var motivacoes=[
"Você não precisa ser perfeito. Precisa começar.",
"Cada passo, por menor que seja, te leva mais longe.",
"O progresso não é linear, mas é progresso.",
"Você já superou 100% dos seus dias difíceis.",
"Disciplina é escolher entre o que você quer agora e o que mais quer.",
"Ninguém constrói uma vida incrível em um dia. Seja paciente.",
"Seu futuro é construído pelo que você faz hoje, não amanhã.",
"Erro não é fracasso. É dado. Aprenda e siga.",
"Você é capaz de mais do que imagina. Só faltava tentar.",
"O momento perfeito não existe. O momento é agora.",
"Não compare seu começo com o meio de outra pessoa.",
"Consistência vence talento quando talento não é consistente.",
"Cada tarefa riscada da lista é uma vitória. Celebre.",
"Descanso também é produtivo. Não se sinta culpado.",
"Seu potencial mora do lado de fora da zona de conforto.",
"Grandes mudanças começam com pequenos hábitos.",
"Organizar sua vida é um ato de cuidado consigo mesmo.",
"Não espere motivação. Crie rotina. A motivação segue.",
"Hoje é um novo dia. O que você faz dele é com você.",
"O difícil não é começar. É não desistir. E você não vai."
];
var desafios=[
"Hoje, beba 8 copos de água. Marque cada um no app!",
"Escreva 3 coisas pelas quais você é grato agora.",
"Foque por 25 min em uma tarefa usando o Pomodoro.",
"Caminhe por 15 minutos. Sem celular, só você e seus pensamentos.",
"Organize um espaço: gaveta, mesa, pasta digital. Qualquer um.",
"Fique 10 min sem olhar o celular. De verdade.",
"Faça uma refeição saudável hoje. Anote no app.",
"Leia 10 páginas de um livro. Qualquer livro.",
"Escreva como quer estar daqui a 6 meses. Guarde nas notas.",
"Durma 30 min mais cedo hoje. Sério.",
"Ligue ou mande mensagem para alguém que faz bem.",
"Cancele uma inscrição ou app que não usa mais.",
"Prepare o amanhã: roupas, mochila, lista de tarefas.",
"Passe 5 min meditando. Inspire, expire. Só isso.",
"Tire uma foto de algo que te fez sorrir hoje.",
"Faça um elogio sincero a alguém.",
"Escreva sua maior prioridade da semana nas metas.",
"Organize suas finanças: anote tudo no orçamento.",
"Desligue notificações por 2 horas. Veja como se sente.",
"Planeje as refeições da semana. Depois me agradeça."
];
function novaDica(){document.getElementById("dicaTexto").textContent=dicas[Math.floor(Math.random()*dicas.length)]}
function novaMotivacao(){document.getElementById("motivacaoTexto").textContent=motivacoes[Math.floor(Math.random()*motivacoes.length)]}
function novoDesafio(){document.getElementById("desafioTexto").textContent=desafios[Math.floor(Math.random()*desafios.length)]}
novaDica();novaMotivacao();novoDesafio();

function abrirPix(){document.getElementById("pixModal").classList.add("ativo")}
function fecharPix(){document.getElementById("pixModal").classList.remove("ativo")}
function copiarPix(){navigator.clipboard.writeText("henriquehabitz2014@gmail.com").then(function(){notificar("Chave Pix copiada! Obrigado pelo apoio! 💖")}).catch(function(){var t=document.createElement("textarea");t.value="henriquehabitz2014@gmail.com";document.body.appendChild(t);t.select();document.execCommand("copy");document.body.removeChild(t);notificar("Chave Pix copiada! Obrigado pelo apoio! 💖")})}

function fecharBanner(){var b=document.getElementById("apoieBanner");b.classList.add("hide");localStorage.setItem("apoieBannerFechado","1")}
function mostrarBannerSeNaoFechado(){if(localStorage.getItem("apoieBannerFechado")!=="1"){document.getElementById("apoieBanner").classList.remove("hide")}else{document.getElementById("apoieBanner").classList.add("hide")}}
mostrarBannerSeNaoFechado();

(function(){
try{
var k="oj_visits",d=new Date().toISOString().slice(0,10);
var n=parseInt(localStorage.getItem(k)||"0",10);
var last=localStorage.getItem(k+"_d")||"";
if(last!==d){n++;localStorage.setItem(k,String(n));localStorage.setItem(k+"_d",d)}
var el=document.getElementById("visitNum");
if(el){
var start=0,dur=1200,t0=null;
function anim(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1);var ease=1-Math.pow(1-p,3);el.textContent=Math.floor(ease*n);if(p<1)requestAnimationFrame(anim);else el.textContent=n}
requestAnimationFrame(anim)}
}catch(e){}
})();

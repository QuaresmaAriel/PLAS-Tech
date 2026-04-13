/**
 * GERENCIAMENTO DO DASHBOARD - PLAS Tech
 * DESCRIÇÃO: Sistema de gestão de ordens de serviço e tarefas.
 * ARQUITETURA: Utiliza Web Storage API (localStorage) para persistência de dados
 * e integração com API externa (ImgBB) para gerenciamento de evidências fotográficas.
 */

import { aplicarPreferencias } from "./utils.js";
import { verificarAcesso, inicializarDadosDemonstrativos } from "./auth.js";

// ==========================================
// 1. INICIALIZAÇÃO E CONFIGURAÇÕES
// ==========================================
verificarAcesso();
aplicarPreferencias();

const listaTarefasElement = document.getElementById('lista-tarefas');
const searchInput = document.getElementById('search-input');
const userDisplay = document.getElementById('user-name');

let todasTarefas = [];
let filtroAtivo = 'todos';

// Chave da API ImgBB para upload de fotos (Evidências técnicas)
const IMGBB_API_KEY = 'a6dbd1efca2c0cfab482766c9c4eb5e2';

// Exibe o perfil do usuário logado na sessão
const usuarioLogado = sessionStorage.getItem('usuario') || 'Recrutador';
if (userDisplay) userDisplay.textContent = usuarioLogado;

/**
 * CARREGAR DADOS DO REPOSITÓRIO LOCAL
 * Verifica a existência de dados e inicializa o ambiente de demonstração se necessário.
 */
function carregarDadosLocal() {
    try {
        let dadosRaw = localStorage.getItem('plas_tech_servicos');

        // Inicializa dados fictícios para demonstração caso o banco local esteja vazio
        if (!dadosRaw || dadosRaw === "[]") {
            inicializarDadosDemonstrativos();
            dadosRaw = localStorage.getItem('plas_tech_servicos');
        }

        todasTarefas = JSON.parse(dadosRaw || "[]");
        processarEFiltrar();
    } catch (error) {
        console.error("Erro na carga de dados:", error);
        if (listaTarefasElement) {
            listaTarefasElement.innerHTML = "<p>Erro ao processar registros locais.</p>";
        }
    }
}

// Inicializa a carga de dados ao abrir a página
carregarDadosLocal();

// ==========================================
// 2. REGRAS DE NEGÓCIO E FILTRAGEM
// ==========================================

/**
 * Filtra as tarefas com base na busca textual, categoria selecionada e status de finalização.
 */
function processarEFiltrar() {
    const termo = searchInput ? searchInput.value.toLowerCase() : "";

    const filtradas = todasTarefas.filter(item => {
        // O Dashboard exibe apenas itens com status 'Aberto' (finalizado: false)
        if (item.finalizado) return false;

        const matchesBusca = (item.nomeCliente?.toLowerCase().includes(termo)) ||
                             (item.os?.toLowerCase().includes(termo)) ||
                             (item.aparelho?.toLowerCase().includes(termo)) ||
                             (item.tituloTarefa?.toLowerCase().includes(termo));

        const matchesFiltro = (filtroAtivo === 'todos') || (item.tipo === filtroAtivo);

        // Lógica para Agendamentos: Visibilidade baseada na data técnica
        let matchesData = true;
        if (item.tipo === 'agendado' && item.dataAgendamento) {
            const hoje = new Date().toISOString().split('T')[0];
            matchesData = (item.dataAgendamento <= hoje);
        }

        return matchesBusca && matchesFiltro && matchesData;
    });

    renderizarCards(filtradas);
}

/**
 * RENDERIZAÇÃO DINÂMICA DA INTERFACE (DOM)
 */
function renderizarCards(tarefas) {
    if (!listaTarefasElement) return;
    listaTarefasElement.innerHTML = '';

    if (tarefas.length === 0) {
        listaTarefasElement.innerHTML = `
            <div class="empty-queue-msg">
                <h3>Sem tarefas pendentes</h3>
                <p>O fluxo de trabalho está em dia.</p>
            </div>`;
        return;
    }

    tarefas.forEach(item => {
        const card = document.createElement('div');
        card.className = `card-tarefa ${item.tipo}`;
        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${item.nomeCliente || item.tituloTarefa}</span>
                <span class="badge-status">${item.status}</span>
            </div>
            <div class="card-body">
                <p>${item.aparelho || item.descricao || 'Sem descrição detalhada'}</p>
                <div class="card-footer">
                    <span>${item.dataCriacao || ''}</span>
                    ${item.os ? `<b>OS: ${item.os}</b>` : ''}
                </div>
            </div>`;

        card.onclick = () => abrirAcao(item);
        listaTarefasElement.appendChild(card);
    });
}

// ==========================================
// 3. GESTÃO DE DETALHES E MODAIS
// ==========================================

function abrirAcao(item) {
    const isMobile = window.innerWidth < 1024;
    const targetId = isMobile ? 'modal-body' : 'conteudo-detalhes';
    const container = document.getElementById(targetId);

    if (isMobile) {
        document.getElementById('modal-container')?.classList.remove('hidden');
    } else {
        document.getElementById('vazio-selection')?.classList.add('hidden');
        document.getElementById('conteudo-detalhes')?.classList.remove('hidden');
    }

    if (container) renderConteudoDetalhes(container, item);
}

function renderConteudoDetalhes(container, item) {
    const bibliotecaStatus = {
        'servico': ["🔍 Em Analise", "🛠️ Em Manutencao", "📦 Aguardando Peça", "🎮 Em Teste", "💰 Aguardando Aprovação", "✅ Concluido", "❌ Perda Total"],
        'agendado': ["📅 Agendado", "🚀 A caminho", "👨‍🔧 Em Atendimento", "✅ Concluido", "❌ Cancelado"],
        'particular': ["📝 Pendente", "🏗️ Em Andamento", "✅ Concluido", "❌ Cancelado"]
    };

    const statusDisponiveis = bibliotecaStatus[item.tipo] || ["Pendente", "Concluido"];

    container.innerHTML = `
        <div class="detalhes-container">
            ${item.fotoCapa ? `
                <div class="foto-preview-container">
                    <p class="label-foto">📸 Foto de Entrada</p>
                    <a href="${item.fotoCapa}" target="_blank">
                        <img src="${item.fotoCapa}" class="foto-entrada-img">
                    </a>
                </div>
            ` : ''}

            <h3>${item.nomeCliente || item.tituloTarefa}</h3>

            <div class="form-group">
                <label>Alterar Status Profissional</label>
                <select id="novo-status-select" class="modern-input">
                    ${statusDisponiveis.map(s => {
                        const valorLimpo = s.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]/gu, "").trim();
                        return `<option value="${valorLimpo}" ${item.status === valorLimpo ? 'selected' : ''}>${s}</option>`;
                    }).join('')}
                </select>
            </div>

            <div class="form-group">
                <label>Observações Técnicas</label>
                <textarea id="nota-status" class="modern-input" placeholder="Registro de progresso..."></textarea>
            </div>

            <div class="form-group">
                <label for="foto-update-input" class="label-upload-custom">
                    <span>📷 Anexar Evidência</span>
                </label>
                <input type="file" id="foto-update-input" accept="image/*" style="display: none;">
                <div id="preview-dashboard" style="display:none; margin-top:10px; text-align:center;">
                    <img id="img-preview-dash" src="" style="height: 100px; border-radius: 6px;">
                </div>
            </div>

            <button class="btn-primary" id="btn-salvar-status" style="width:100%">Salvar Alterações</button>

            <div class="timeline-area">
                <h4>Histórico de Eventos</h4>
                <ul class="timeline-list">
                    ${(item.historico || []).map(log => `
                        <li>
                            <small>${log.data} - <b>${log.user}</b></small><br>
                            <div><b>${log.status}</b>: <i>"${log.nota || ''}"</i></div>
                            ${log.foto ? `<a href="${log.foto}" target="_blank" class="link-foto-timeline">📎 Ver Foto</a>` : ''}
                        </li>
                    `).reverse().join('')}
                </ul>
            </div>
        </div>`;

    configurarInteracaoDetalhes(item);
}

function configurarInteracaoDetalhes(itemOriginal) {
    const inputFoto = document.getElementById('foto-update-input');
    const previewArea = document.getElementById('preview-dashboard');
    const imgPreview = document.getElementById('img-preview-dash');

    if (inputFoto) {
        inputFoto.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    imgPreview.src = evt.target.result;
                    previewArea.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        };
    }

    document.getElementById('btn-salvar-status').onclick = async () => {
        const btn = document.getElementById('btn-salvar-status');
        const novoStatus = document.getElementById('novo-status-select').value;
        const nota = document.getElementById('nota-status').value;
        const arquivo = inputFoto?.files[0];

        btn.disabled = true;
        btn.textContent = arquivo ? "Enviando arquivo..." : "Processando...";

        await atualizarStatusLocal(itemOriginal.id, novoStatus, nota, arquivo);

        btn.disabled = false;
        btn.textContent = "Salvar Alteração";
    };
}

// ==========================================
// 4. PERSISTÊNCIA E INTEGRAÇÃO DE API
// ==========================================

async function atualizarStatusLocal(id, novoStatus, nota, arquivoFoto = null) {
    const usuarioAtivo = sessionStorage.getItem('usuario') || 'Recrutador';
    const agora = new Date().toLocaleString('pt-BR').substring(0, 16);
    const finalizado = ["Concluido", "Perda Total", "Cancelado"].includes(novoStatus);

    try {
        let urlFoto = null;
        if (arquivoFoto) {
            urlFoto = await realizarUploadImgBB(arquivoFoto);
        }

        const novoEvento = {
            status: novoStatus,
            data: agora,
            user: usuarioAtivo,
            nota: nota || "Atualização de status",
            foto: urlFoto
        };

        todasTarefas = todasTarefas.map(tarefa => {
            if (tarefa.id === id) {
                return {
                    ...tarefa,
                    status: novoStatus,
                    finalizado: finalizado,
                    historico: [...(tarefa.historico || []), novoEvento]
                };
            }
            return tarefa;
        });

        localStorage.setItem('plas_tech_servicos', JSON.stringify(todasTarefas));

        if (window.innerWidth < 1024) fecharModal();
        carregarDadosLocal();
        mostrarNotificacao("Registro atualizado com sucesso!");

    } catch (e) {
        console.error("Erro na persistência:", e);
        mostrarNotificacao("Erro ao salvar alterações.", true);
    }
}

async function realizarUploadImgBB(arquivo) {
    const formData = new FormData();
    formData.append("image", arquivo);
    const req = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST", body: formData
    });
    const resp = await req.json();
    return resp.success ? resp.data.url : null;
}

// ==========================================
// 5. UX E COMPONENTES VISUAIS
// ==========================================

function mostrarNotificacao(mensagem, erro = false) {
    // Utiliza a biblioteca SweetAlert2 (importada no HTML) para feedback minimalista
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            text: mensagem,
            icon: erro ? 'error' : 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: document.documentElement.classList.contains('dark-mode') ? '#333' : '#fff',
            color: document.documentElement.classList.contains('dark-mode') ? '#fff' : '#333'
        });
    } else {
        alert(mensagem);
    }
}

// Listeners de Interação
if (searchInput) searchInput.addEventListener('input', processarEFiltrar);

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroAtivo = btn.getAttribute('data-filter');
        processarEFiltrar();
    };
});

window.fecharModal = () => document.getElementById('modal-container')?.classList.add('hidden');
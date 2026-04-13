/**
 * SISTEMA DE GESTÃO - MÓDULO DE HISTÓRICO - PLAS Tech (Versão Demo)
 * OBJETIVO: Gerenciar tarefas finalizadas usando localStorage.
 */

import { aplicarPreferencias } from "./utils.js";
import { verificarAcesso } from "./auth.js";

// --- 1. CONFIGURAÇÕES INICIAIS ---
verificarAcesso();
aplicarPreferencias();

// Referências do DOM
const tabelaCorpo = document.getElementById('tabela-historico');
const searchInput = document.getElementById('search-historico');
const modalConfirm = document.getElementById('custom-confirm');
const btnSim = document.getElementById('confirm-yes');
const btnNao = document.getElementById('confirm-no');

let dadosHistorico = []; // Cache local

/**
 * CARREGAR DADOS DO LOCALSTORAGE
 */
function carregarHistoricoLocal() {
    const dadosSalvos = localStorage.getItem('plas_tech_servicos');
    if (dadosSalvos) {
        // Filtra apenas o que está finalizado para esta tela
        const todosOsDados = JSON.parse(dadosSalvos);
        dadosHistorico = todosOsDados.filter(item => item.finalizado === true);
    } else {
        dadosHistorico = [];
    }
    renderizarTabela(dadosHistorico);
}

// Inicializa a carga
carregarHistoricoLocal();

// --- 2. INTERFACE DA TABELA ---
function renderizarTabela(lista) {
    tabelaCorpo.innerHTML = '';

    if (lista.length === 0) {
        tabelaCorpo.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum registro finalizado encontrado.</td></tr>`;
        return;
    }

    // Ordenar por data (mais recentes primeiro) - O ID baseado em timestamp ajuda nisso
    const listaOrdenada = [...lista].sort((a, b) => b.id - a.id);

    listaOrdenada.forEach(item => {
        const tr = document.createElement('tr');

        if (item.status === "Perda Total") {
            tr.style.backgroundColor = "rgba(255, 0, 0, 0.05)";
        }

        const ultimaNota = item.historico && item.historico.length > 0
            ? item.historico[item.historico.length - 1].nota || "---"
            : "---";

        const responsavel = item.historico && item.historico.length > 0
            ? item.historico[item.historico.length - 1].user
            : '---';

        tr.innerHTML = `
            <td data-label="Data:">${item.dataCriacao || '---'}</td>
            <td data-label="Tipo:">
                <span class="tag-tipo ${item.tipo}">${item.tipo}</span>
            </td>
            <td data-label="Cliente:">
                <strong>${item.nomeCliente || item.tituloTarefa}</strong><br>
                <small>${item.aparelho || ''}</small>
            </td>
            <td data-label="Status:">${item.status}</td>

            <td data-label="Última Nota: " class="coluna-nota">
                <i>${ultimaNota}</i>
            </td>

            <td data-label="Responsável" class="coluna-responsavel">
                ${responsavel}
            </td>

            <td data-label="">
                <button type="button" class="btn btn-detalhes" id="btn-detalhe-${item.id}">
                    Histórico
                </button>
            </td>
        `;
        tabelaCorpo.appendChild(tr);

        // Adiciona evento ao botão de detalhes
        document.getElementById(`btn-detalhe-${item.id}`).onclick = () => verDetalhesHistorico(item.id);
    });
}

// --- 3. FILTRAGEM DE BUSCA ---
searchInput.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = dadosHistorico.filter(i =>
        (i.nomeCliente?.toLowerCase().includes(termo)) ||
        (i.os?.toLowerCase().includes(termo)) ||
        (i.aparelho?.toLowerCase().includes(termo)) ||
        (i.tituloTarefa?.toLowerCase().includes(termo))
    );
    renderizarTabela(filtrados);
});

// --- 4. VISUALIZAÇÃO DE LOGS (MODAL) ---
window.verDetalhesHistorico = (id) => {
    const item = dadosHistorico.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('modal-log');
    const container = document.getElementById('modal-log-content');
    container.innerHTML = '';

    // 1. Foto de Capa
    if (item.fotoCapa) {
        const divCapa = document.createElement('div');
        divCapa.className = 'foto-capa-historico';
        divCapa.innerHTML = `
            <p style="font-size: 0.9rem; color: #aaa; margin-bottom: 8px;">📸 Foto de Entrada</p>
            <a href="${item.fotoCapa}" target="_blank">
                <img src="${item.fotoCapa}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #555;">
            </a>
        `;
        container.appendChild(divCapa);
    }

    // 2. Lista de Logs
    if (item.historico && item.historico.length > 0) {
        item.historico.forEach(l => {
            const divItem = document.createElement('div');
            divItem.classList.add('log-item');

            const obsHtml = l.nota
                ? `<div class="nota-historico">📝 ${l.nota.replace(/\n/g, '<br>')}</div>`
                : '';

            const fotoHtml = l.foto
                ? `<div style="margin-top: 8px;">
                     <a href="${l.foto}" target="_blank" class="btn-ver-foto-log">
                        📎 Ver Evidência (Foto)
                     </a>
                   </div>`
                : '';

            divItem.innerHTML = `
                <div class="log-header">
                    <div class="log-user">Responsável: ${l.user || 'Sistema'}</div>
                    <strong>${l.data}</strong> -
                    <span class="log-status">${l.status}</span>
                </div>
                ${obsHtml}
                ${fotoHtml}
            `;
            container.appendChild(divItem);
        });
    } else {
        container.innerHTML += '<p style="text-align:center; padding:20px; color: #888;">Sem histórico detalhado.</p>';
    }

    modal.classList.remove('hidden');

    const btnClose = document.getElementById('modal-log-close');
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
};

// --- 5. EXPORTAÇÃO (EXCEL) ---
function exportarDadosParaExcel() {
    if (dadosHistorico.length === 0) {
        alert("Nada para exportar!");
        return;
    }

    const dataAjustada = dadosHistorico.map(item => ({
        "Data": item.dataCriacao || "",
        "Tipo": item.tipo || "",
        "Identificação": item.nomeCliente || item.tituloTarefa,
        "Aparelho": item.aparelho || "",
        "Status Final": item.status,
        "Última Nota": item.historico && item.historico.length > 0 ? item.historico[item.historico.length - 1].nota : "",
        "Responsável": item.historico && item.historico.length > 0 ? item.historico[item.historico.length - 1].user : ""
    }));

    const ws = XLSX.utils.json_to_sheet(dataAjustada);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Histórico PLAS Tech");

    const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `PLAS_Tech_Historico_${dataHoje}.xlsx`);
}

document.getElementById('btn-exportar').onclick = exportarDadosParaExcel;

// --- 6. LIMPEZA DE HISTÓRICO LOCAL ---
document.getElementById('btn-limpar-historico').onclick = () => {
    document.getElementById('confirm-title').innerText = "Excluir Histórico";
    document.getElementById('confirm-msg').innerText = "Tem certeza que deseja apagar permanentemente os registros concluídos do seu navegador?";
    modalConfirm.classList.remove('hidden');

    btnSim.onclick = () => {
        // Recupera tudo, filtra para manter só o que NÃO está finalizado
        const todosOsDados = JSON.parse(localStorage.getItem('plas_tech_servicos')) || [];
        const apenasAbertos = todosOsDados.filter(item => item.finalizado !== true);

        localStorage.setItem('plas_tech_servicos', JSON.stringify(apenasAbertos));

        modalConfirm.classList.add('hidden');
        carregarHistoricoLocal(); // Atualiza a tela
    };

    btnNao.onclick = () => modalConfirm.classList.add('hidden');
};
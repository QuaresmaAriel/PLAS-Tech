/**
 * SISTEMA DE GESTÃO - PLAS Tech (Módulo de Inclusão)
 * DESCRIÇÃO: Gerencia o registro de novos Serviços (OS), Tarefas Particulares e Agendamentos.
 * ARQUITETURA: Persistência baseada em Web Storage (localStorage) e integração com API ImgBB.
 */

import { aplicarPreferencias } from "./utils.js";
import { verificarAcesso } from "./auth.js";

// Inicialização de segurança e preferências visuais
verificarAcesso();
aplicarPreferencias();

const usuarioAtivo = sessionStorage.getItem('usuario') || 'Recrutador';

// Configuração da API de Imagem (Demonstração de integração com serviços REST)
const IMGBB_API_KEY = 'a6dbd1efca2c0cfab482766c9c4eb5e2';

// --- GESTÃO DE MÍDIA E PREVIEW ---
const fotoInput = document.getElementById('foto-input');
const previewContainer = document.getElementById('preview-container');
const imgPreview = document.getElementById('img-preview');
const btnRemoverFoto = document.getElementById('btn-remover-foto');

if (fotoInput) {
    fotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imgPreview.src = event.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    btnRemoverFoto?.addEventListener('click', () => {
        fotoInput.value = '';
        previewContainer.style.display = 'none';
        imgPreview.src = '';
    });
}

/**
 * INTEGRAÇÃO COM API EXTERNA (ImgBB)
 * Realiza o upload de evidências fotográficas e retorna a URL pública.
 */
async function subirFotoParaNuvem(arquivo) {
    if (!arquivo) return null;
    try {
        mostrarNotificacao("Enviando imagem para o servidor...");
        
        const formData = new FormData();
        formData.append("image", arquivo);

        const resposta = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const dados = await resposta.json();
        return dados.success ? dados.data.url : null;
    } catch (erro) {
        console.error("Falha na comunicação com API de imagem:", erro);
        mostrarNotificacao("Erro no upload. O registro será salvo sem foto.", true);
        return null;
    }
}

/**
 * PERSISTÊNCIA DE DADOS NO REPOSITÓRIO LOCAL
 * Gerencia o CRUD no localStorage simulando a estrutura de um banco NoSQL.
 */
async function salvarNoBancoLocal(dados, arquivoFoto = null) {
    try {
        // Recupera registros existentes ou inicializa novo repositório
        const bancoLocal = JSON.parse(localStorage.getItem('plas_tech_servicos')) || [];

        // Regra de Negócio: Validação de integridade para Ordens de Serviço
        if (dados.tipo === 'servico' && dados.os) {
            if (bancoLocal.some(item => item.os === dados.os)) {
                mostrarNotificacao(`Conflito: A OS nº ${dados.os} já existe no sistema!`, true);
                return;
            }
        }

        // Processamento de imagem se houver anexo
        const urlDaFoto = arquivoFoto ? await subirFotoParaNuvem(arquivoFoto) : null;

        // Montagem do Objeto de Negócio
        const novoRegistro = {
            id: Date.now().toString(), // Timestamp como identificador único
            ...dados,
            finalizado: false,
            dataCriacao: new Date().toLocaleString('pt-BR').substring(0, 16),
            fotoCapa: urlDaFoto,
            historico: [{
                status: dados.status || "Registrado",
                data: new Date().toLocaleString('pt-BR').substring(0, 16),
                user: usuarioAtivo,
                nota: dados.descricao || "Registro inicializado via painel de inclusão.",
                foto: urlDaFoto
            }]
        };

        // Persistência local e redirecionamento
        bancoLocal.push(novoRegistro);
        localStorage.setItem('plas_tech_servicos', JSON.stringify(bancoLocal));

        mostrarNotificacao("✅ Registro concluído com sucesso!");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } catch (e) {
        console.error("Erro crítico na persistência local:", e);
        mostrarNotificacao("Falha ao processar o registro dos dados.", true);
    }
}

// --- CONFIGURAÇÃO DOS EVENTOS DE INTERAÇÃO (LISTENERS) ---

// 1. Formulário de Serviços (OS)
const formServico = document.getElementById('form-servico');
if (formServico) {
    formServico.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formServico.querySelector('.btn-save');
        btn.disabled = true;
        btn.textContent = "Processando...";

        await salvarNoBancoLocal({
            tipo: 'servico',
            nomeCliente: document.getElementById('cliente-nome').value,
            os: document.getElementById('os-numero').value,
            aparelho: document.getElementById('aparelho').value,
            descricao: document.getElementById('problema').value,
            valor: document.getElementById('orcamento').value,
            status: "🛠️ Em Manutencao"
        }, fotoInput?.files[0]);

        btn.disabled = false;
        btn.textContent = "Incluir na Fila";
    });
}

// 2. Formulário de Tarefas Particulares
const formTarefa = document.getElementById('form-tarefa');
if (formTarefa) {
    formTarefa.addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarNoBancoLocal({
            tipo: 'particular',
            tituloTarefa: document.getElementById('tarefa-titulo').value,
            descricao: document.getElementById('tarefa-notas').value,
            status: "📝 Pendente"
        });
    });
}

// 3. Formulário de Agendamentos
const formAgendar = document.getElementById('form-agendar');
if (formAgendar) {
    formAgendar.addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarNoBancoLocal({
            tipo: 'agendado',
            dataAgendamento: document.getElementById('agenda-data').value,
            tituloTarefa: document.getElementById('agenda-titulo').value,
            descricao: document.getElementById('agenda-notas').value,
            status: "📅 Agendado"
        });
    });
}

/**
 * COMPONENTE DE NOTIFICAÇÃO (TOAST)
 * Utiliza SweetAlert2 para feedback de interface não obstrutivo.
 */
function mostrarNotificacao(mensagem, erro = false) {
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
        // Fallback para ambientes onde a biblioteca externa falha
        console.log(`[Notification]: ${mensagem}`);
    }
}
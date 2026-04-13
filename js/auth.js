/**
 * SISTEMA DE AUTENTICAÇÃO E INICIALIZAÇÃO - PLAS Tech (Versão Demo)
 * DESCRIÇÃO: Este script gerencia o acesso via localStorage para permitir que
 * recrutadores testem o sistema de forma isolada e segura.
 */

/**
 * 1. CONFIGURAÇÃO DE DADOS INICIAIS (MOCK DATA)
 * Se o "banco de dados" do recrutador estiver vazio, preenchemos com exemplos.
 */
export  function inicializarDadosDemonstrativos() {
    if (!localStorage.getItem('plas_tech_servicos')) {
        const agora = new Date();
        const dataFormatada = (d) => d.toLocaleString('pt-BR').substring(0, 16);

        const dadosIniciais = [
            // 1. Serviço em andamento (Dashboard)
            {
                id: "1713000000001", tipo: "servico", nomeCliente: "Tony Stark",
                equipamento: "Reator Arc", aparelho: "Mark LXXXV",
                status: "🛠️ Em Manutencao", finalizado: false,
                dataCriacao: dataFormatada(agora), os: "2026-001",
                historico: [{status: "Em Manutencao", data: dataFormatada(agora), user: "Admin", nota: "Iniciado reparo na carcaça externa."}]
            },
            // 2. Serviço aguardando peça (Dashboard)
            {
                id: "1713000000002", tipo: "servico", nomeCliente: "Peter Parker",
                aparelho: "Lente de Câmera DSLR", status: "📦 Aguardando Peça",
                finalizado: false, dataCriacao: dataFormatada(agora), os: "2026-002",
                historico: [{status: "Aguardando Peça", data: dataFormatada(agora), user: "Admin", nota: "Pedido de obturador novo realizado."}]
            },
            // 3. Tarefa Particular (Dashboard)
            {
                id: "1713000000003", tipo: "particular", tituloTarefa: "Organizar bancada de solda",
                status: "📝 Pendente", finalizado: false,
                dataCriacao: dataFormatada(agora),
                historico: [{status: "Pendente", data: dataFormatada(agora), user: "Admin", nota: "Tarefa administrativa."}]
            },
            // 4. Agendamento (Dashboard)
            {
                id: "1713000000004", tipo: "agendado", tituloTarefa: "Visita Técnica: Restaurante Lazzarella",
                dataAgendamento: new Date().toISOString().split('T')[0], // Hoje
                status: "📅 Agendado", finalizado: false,
                dataCriacao: dataFormatada(agora),
                historico: [{status: "Agendado", data: dataFormatada(agora), user: "Admin", nota: "Verificar rede de PDVs."}]
            },
            // 5. Item Concluído (Histórico)
            {
                id: "1713000000005", tipo: "servico", nomeCliente: "Ariel Quaresma",
                aparelho: "Notebook Dell G15", status: "✅ Concluido",
                finalizado: true, dataCriacao: "10/04/2026 10:00", os: "1001",
                historico: [
                    {status: "Em Analise", data: "10/04/2026 10:00", user: "Sistema", nota: "Entrada para formatação."},
                    {status: "Concluido", data: "10/04/2026 16:30", user: "Admin", nota: "Sistema reinstalado e drivers atualizados."}
                ]
            },
            // 6. Item Perda Total (Histórico)
            {
                id: "1713000000006", tipo: "servico", nomeCliente: "Empresa Teste",
                aparelho: "iPhone 14 Pro Max", status: "❌ Perda Total",
                finalizado: true, dataCriacao: "11/04/2026 09:00", os: "1002",
                historico: [{status: "Perda Total", data: "11/04/2026", user: "Admin", nota: "Aparelho com oxidação severa na placa principal."}]
            }
        ];

        localStorage.setItem('plas_tech_servicos', JSON.stringify(dadosIniciais));
        console.log("Mock Database PLAS Tech inicializado com sucesso!");
    }
}


/**
 * 2. LÓGICA DE LOGIN
 * Simula uma autenticação aceitando apenas as credenciais de teste.
 */
export async function realizarLogin(usuarioDigitado, senhaDigitada) {
    const user = usuarioDigitado.trim().toLowerCase();
    const pass = String(senhaDigitada).trim().toLowerCase();

    // Login simplificado para Recrutadores
    if (user === 'teste' && pass === 'teste') {
        sessionStorage.setItem('logado', 'true');
        sessionStorage.setItem('usuario', 'Recrutador');

        // Prepara o banco de dados local para o primeiro uso
        inicializarDadosDemonstrativos();

        return true;
    }
    return false;
}

/**
 * 3. PROTEÇÃO DE ROTAS
 */
export function verificarAcesso() {
    const logado = sessionStorage.getItem('logado');
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/') || path === '';

    if (logado === 'true' && isLoginPage) {
        window.location.href = 'dashboard.html';
        return;
    }

    if (logado !== 'true' && !isLoginPage) {
        window.location.href = 'index.html';
    }
}
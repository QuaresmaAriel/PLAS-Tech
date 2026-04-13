/**
 * INTERAÇÃO DA PÁGINA DE LOGIN - PLAS Tech
 * Gerencia o formulário de entrada e a experiência do usuário.
 */
import { realizarLogin, verificarAcesso } from "./auth.js";
import { aplicarPreferencias } from "./utils.js";

// 1. Aplica preferências visuais (como tema Dark/Light) ao carregar
aplicarPreferencias();

// 2. Proteção de rota: Se já houver sessão ativa, pula o login
verificarAcesso();

const form = document.getElementById('login-form');
const erroMsg = document.getElementById('login-error');
const btnLogin = document.getElementById('btn-login');

/**
 * EVENTO DE SUBMIT
 * Gerencia a tentativa de login do recrutador/usuário.
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Feedback visual de carregamento (mesmo sendo local, mantém o profissionalismo)
    btnLogin.disabled = true;
    btnLogin.innerText = "Verificando...";
    if (erroMsg) erroMsg.innerText = "";

    const user = document.getElementById('usuario').value;
    const pass = document.getElementById('password').value;

    try {
        // Agora valida contra o Mock Data do localStorage em vez do Firestore
        const logadoComSucesso = await realizarLogin(user, pass);

        if (logadoComSucesso) {
            // Sucesso: Redireciona para o painel principal
            window.location.href = 'dashboard.html';
        } else {
            // Falha: Libera o botão para nova tentativa
            btnLogin.disabled = false;
            btnLogin.innerText = "Entrar";
            if (erroMsg) {
                erroMsg.innerText = "Usuário ou senha inválidos. (Dica: Use teste/teste)";
            }
        }
    } catch (err) {
        console.error("Erro no processo de login local:", err);
        btnLogin.disabled = false;
        btnLogin.innerText = "Entrar";
        if (erroMsg) erroMsg.innerText = "Erro ao processar login. Tente novamente.";
    }
});
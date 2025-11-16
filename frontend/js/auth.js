// js/auth.js

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentUser = null;
        this.isAuthenticated = false;
        this.pendingRequests = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupInterceptors();
        this.checkInitialAuth();
        
        console.log('🔐 Serviço de Autenticação inicializado');
    }

    setupEventListeners() {
        // Escutar mudanças de autenticação em outros componentes
        document.addEventListener('authStateChanged', (e) => {
            this.handleAuthStateChange(e.detail);
        });

        // Escutar tentativas de requisições não autenticadas
        document.addEventListener('authRequired', () => {
            this.handleAuthRequired();
        });

        // Configurar auto-logout após inatividade
        this.setupInactivityTimer();
    }

    setupInterceptors() {
        // Interceptar fetch requests para adicionar token
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            
            // Adicionar token às requisições para a API
            if (typeof url === 'string' && url.includes(API_BASE)) {
                const headers = {
                    'Content-Type': 'application/json',
                    ...options.headers
                };

                if (this.token) {
                    headers['Authorization'] = `Bearer ${this.token}`;
                }

                try {
                    const response = await originalFetch(url, {
                        ...options,
                        headers
                    });

                    // Verificar se o token expirou
                    if (response.status === 401) {
                        this.handleTokenExpired();
                        throw new Error('Token expirado');
                    }

                    return response;
                } catch (error) {
                    if (error.message === 'Token expirado') {
                        // Já tratado no handleTokenExpired
                        throw error;
                    }
                    
                    // Para outros erros de rede, tentar usar dados mock se disponível
                    if (!navigator.onLine) {
                        this.handleOfflineMode();
                    }
                    
                    throw error;
                }
            }

            return originalFetch(...args);
        };
    }

    setupInactivityTimer() {
        let inactivityTimer;
        const logoutTime = 30 * 60 * 1000; // 30 minutos

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (this.isAuthenticated) {
                    this.autoLogout();
                }
            }, logoutTime);
        };

        // Eventos que resetam o timer
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer, false);
        });

        resetTimer();
    }

    // =============================================
    // AUTENTICAÇÃO PRINCIPAL
    // =============================================

    async login(email, senha) {
        try {
            this.showLoading('Entrando...');

            // Validações básicas
            if (!this.validarCredenciais(email, senha)) {
                return false;
            }

            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await this.handleLoginSuccess(data.data);
                return true;
            } else {
                this.handleLoginError(data.error || 'Erro no login');
                return false;
            }

        } catch (error) {
            this.handleLoginError(this.getErrorMessage(error));
            return false;
        } finally {
            this.hideLoading();
        }
    }

    async register(nome, email, senha, tipo) {
        try {
            this.showLoading('Criando conta...');

            // Validações
            if (!this.validarRegistro(nome, email, senha, tipo)) {
                return false;
            }

            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    nome: nome.trim(),
                    email: email.toLowerCase().trim(),
                    senha,
                    tipo 
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await this.handleRegisterSuccess(data.data, email, senha);
                return true;
            } else {
                this.handleRegisterError(data.error || 'Erro no cadastro');
                return false;
            }

        } catch (error) {
            this.handleRegisterError(this.getErrorMessage(error));
            return false;
        } finally {
            this.hideLoading();
        }
    }

    async checkAuth() {
        try {
            if (!this.token) {
                throw new Error('Token não encontrado');
            }

            // Verificar se o token é válido
            const payload = this.parseJWT(this.token);
            if (!payload || this.isTokenExpired(payload)) {
                throw new Error('Token expirado');
            }

            this.currentUser = payload;
            this.isAuthenticated = true;

            // Verificar se precisa atualizar informações do usuário
            await this.refreshUserData();

            this.showDashboard();
            this.loadUserData();

            console.log('✅ Usuário autenticado:', this.currentUser);
            return true;

        } catch (error) {
            console.log('❌ Verificação de autenticação falhou:', error);
            this.logout(false); // Não mostrar mensagem
            return false;
        }
    }

    async refreshUserData() {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.currentUser = { ...this.currentUser, ...data.data };
                    this.saveUserToStorage();
                }
            }
        } catch (error) {
            console.log('Não foi possível atualizar dados do usuário:', error);
        }
    }

    logout(showMessage = true) {
        // Limpar dados de autenticação
        this.token = null;
        this.currentUser = null;
        this.isAuthenticated = false;

        // Limpar storage
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('session_data');

        // Limpar dados sensíveis da interface
        this.clearSensitiveData();

        // Mostrar mensagem
        if (showMessage) {
            NotificationUtils.showSuccess('Logout realizado com sucesso');
        }

        // Redirecionar para login
        this.showLogin();

        // Disparar evento
        this.dispatchAuthStateChange({ isAuthenticated: false });

        console.log('🚪 Usuário deslogado');
    }

    // =============================================
    // HANDLERS DE SUCESSO E ERRO
    // =============================================

    async handleLoginSuccess(data) {
        this.token = data.token;
        this.currentUser = data.user;
        this.isAuthenticated = true;

        // Salvar no storage
        this.saveAuthData();

        // Mostrar tela de acessibilidade
        this.showAccessibilityScreen();

        // Disparar evento de autenticação
        this.dispatchAuthStateChange({ 
            isAuthenticated: true, 
            user: this.currentUser 
        });

        console.log('✅ Login bem-sucedido:', this.currentUser);

        // Feedback de voz
        if (window.sistemaVoz && sistemaVoz.estaAtivo) {
            sistemaVoz.falar(`Bem-vindo de volta, ${this.currentUser.nome}`);
        }
    }

    handleLoginError(error) {
        console.error('❌ Erro no login:', error);
        
        let mensagem = error;
        
        // Mensagens mais amigáveis para erros comuns
        if (error.includes('Credenciais inválidas') || error.includes('401')) {
            mensagem = 'Email ou senha incorretos';
        } else if (error.includes('Network') || error.includes('Failed to fetch')) {
            mensagem = 'Erro de conexão. Verifique sua internet.';
        } else if (error.includes('500')) {
            mensagem = 'Erro interno do servidor. Tente novamente.';
        }

        NotificationUtils.showError(mensagem);

        // Feedback de voz
        if (window.sistemaVoz && sistemaVoz.estaAtivo) {
            sistemaVoz.falar('Erro no login. ' + mensagem);
        }
    }

    async handleRegisterSuccess(data, email, senha) {
        NotificationUtils.showSuccess('✅ Cadastro realizado com sucesso!');

        // Preencher automaticamente o login
        DOMUtils.setValue('login-email', email);
        DOMUtils.setValue('login-senha', senha);

        // Voltar para tela de login
        this.showLogin();

        // Feedback de voz
        if (window.sistemaVoz && sistemaVoz.estaAtivo) {
            sistemaVoz.falar('Cadastro realizado com sucesso. Você já pode fazer login.');
        }
    }

    handleRegisterError(error) {
        console.error('❌ Erro no cadastro:', error);
        
        let mensagem = error;
        
        // Mensagens mais amigáveis para erros comuns
        if (error.includes('Email já cadastrado') || error.includes('duplicate')) {
            mensagem = 'Este email já está cadastrado';
        } else if (error.includes('Network') || error.includes('Failed to fetch')) {
            mensagem = 'Erro de conexão. Verifique sua internet.';
        } else if (error.includes('senha') && error.includes('fraca')) {
            mensagem = 'A senha deve ter pelo menos 6 caracteres';
        } else if (error.includes('500')) {
            mensagem = 'Erro interno do servidor. Tente novamente.';
        }

        NotificationUtils.showError(mensagem);

        // Feedback de voz
        if (window.sistemaVoz && sistemaVoz.estaAtivo) {
            sistemaVoz.falar('Erro no cadastro. ' + mensagem);
        }
    }

    handleTokenExpired() {
        console.warn('⚠️ Token expirado');
        NotificationUtils.showError('Sessão expirada. Faça login novamente.');
        this.logout(false);
        this.showLogin();
    }

    handleAuthRequired() {
        if (!this.isAuthenticated) {
            NotificationUtils.showError('Você precisa estar logado para acessar esta funcionalidade');
            this.showLogin();
        }
    }

    handleOfflineMode() {
        console.log('🌐 Modo offline ativado');
        // Aqui você pode implementar funcionalidades offline
    }

    handleAuthStateChange(detail) {
        if (detail.isAuthenticated !== this.isAuthenticated) {
            console.log('🔄 Estado de autenticação alterado:', detail);
        }
    }

    // =============================================
    // VALIDAÇÕES
    // =============================================

    validarCredenciais(email, senha) {
        if (!email || !senha) {
            NotificationUtils.showError('Preencha email e senha');
            return false;
        }

        if (!this.validarEmail(email)) {
            NotificationUtils.showError('Digite um email válido');
            return false;
        }

        if (senha.length < 6) {
            NotificationUtils.showError('A senha deve ter pelo menos 6 caracteres');
            return false;
        }

        return true;
    }

    validarRegistro(nome, email, senha, tipo) {
        if (!nome || !email || !senha || !tipo) {
            NotificationUtils.showError('Preencha todos os campos');
            return false;
        }

        if (nome.trim().length < 2) {
            NotificationUtils.showError('Nome deve ter pelo menos 2 caracteres');
            return false;
        }

        if (!this.validarEmail(email)) {
            NotificationUtils.showError('Digite um email válido');
            return false;
        }

        if (senha.length < 6) {
            NotificationUtils.showError('A senha deve ter pelo menos 6 caracteres');
            return false;
        }

        if (!['aluno', 'professor'].includes(tipo)) {
            NotificationUtils.showError('Tipo de usuário inválido');
            return false;
        }

        return true;
    }

    validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // =============================================
    // GERENCIAMENTO DE TOKEN JWT
    // =============================================

    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Erro ao decodificar JWT:', error);
            return null;
        }
    }

    isTokenExpired(payload) {
        if (!payload.exp) return true;
        return Date.now() >= payload.exp * 1000;
    }

    getTokenRemainingTime() {
        if (!this.token) return 0;
        
        const payload = this.parseJWT(this.token);
        if (!payload || !payload.exp) return 0;
        
        return Math.max(0, (payload.exp * 1000) - Date.now());
    }

    // =============================================
    // GERENCIAMENTO DE STORAGE
    // =============================================

    saveAuthData() {
        localStorage.setItem('token', this.token);
        this.saveUserToStorage();
    }

    saveUserToStorage() {
        if (this.currentUser) {
            localStorage.setItem('user_data', JSON.stringify({
                ...this.currentUser,
                savedAt: new Date().toISOString()
            }));
        }
    }

    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const data = JSON.parse(userData);
                // Verificar se os dados não estão muito antigos (1 dia)
                const savedAt = new Date(data.savedAt);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                
                if (savedAt > oneDayAgo) {
                    return data;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar usuário do storage:', error);
        }
        return null;
    }

    clearSensitiveData() {
        // Limpar campos de formulário sensíveis
        DOMUtils.setValue('login-senha', '');
        DOMUtils.setValue('register-senha', '');
        
        // Limpar dados da interface
        DOMUtils.setInnerHTML('user-name', 'Usuário');
        DOMUtils.setInnerHTML('atividades-list', '');
        DOMUtils.setInnerHTML('trabalhos-list', '');
        
        // Esconder aba de professor
        DOMUtils.hideElement('professor-tab');
    }

    // =============================================
    // NAVEGAÇÃO ENTRE TELAS
    // =============================================

    showLogin() {
        this.hideAllScreens();
        DOMUtils.showElement('login-screen');
        
        // Focar no campo de email
        setTimeout(() => {
            const emailField = document.getElementById('login-email');
            if (emailField) {
                emailField.focus();
                
                // Ler instruções se acessibilidade ativa
                if (window.sistemaVoz && sistemaVoz.estaAtivo) {
                    setTimeout(() => {
                        sistemaVoz.falar('Tela de login. Digite seu email e senha para entrar.');
                    }, 1000);
                }
            }
        }, 100);
    }

    showRegister() {
        this.hideAllScreens();
        DOMUtils.showElement('register-screen');
        
        // Focar no campo de nome
        setTimeout(() => {
            const nomeField = document.getElementById('register-nome');
            if (nomeField) {
                nomeField.focus();
                
                // Ler instruções se acessibilidade ativa
                if (window.sistemaVoz && sistemaVoz.estaAtivo) {
                    setTimeout(() => {
                        sistemaVoz.falar('Tela de cadastro. Preencha seus dados para criar uma conta.');
                    }, 1000);
                }
            }
        }, 100);
    }

    showDashboard() {
        this.hideAllScreens();
        DOMUtils.showElement('dashboard');
        
        // Atualizar dados do usuário na interface
        this.loadUserData();
        
        // Feedback de voz
        if (window.sistemaVoz && sistemaVoz.estaAtivo) {
            setTimeout(() => {
                sistemaVoz.falar(`Painel principal carregado. Bem-vindo, ${this.currentUser.nome}.`);
            }, 500);
        }
    }

    showAccessibilityScreen() {
        this.hideAllScreens();
        DOMUtils.showElement('accessibility-screen');
        
        // Feedback de voz
        if (window.sistemaVoz && sistemaVoz.estaAtivo) {
            setTimeout(() => {
                sistemaVoz.falar('Configurações de acessibilidade. Você pode ativar a navegação por voz.');
            }, 500);
        }
    }

    hideAllScreens() {
        const screens = ['login-screen', 'accessibility-screen', 'dashboard', 'register-screen'];
        screens.forEach(screen => {
            DOMUtils.hideElement(screen);
        });
    }

    // =============================================
    // CARREGAMENTO DE DADOS DO USUÁRIO
    // =============================================

    loadUserData() {
        if (!this.currentUser) return;

        // Atualizar nome do usuário na interface
        DOMUtils.setInnerHTML('user-name', this.currentUser.nome);
        
        // Configurar interface baseada no tipo de usuário
        this.setupUserInterface();

        // Atualizar título da página
        document.title = `ByteWave - ${this.currentUser.nome}`;

        // Carregar dados iniciais
        this.loadInitialData();
    }

    setupUserInterface() {
        // Mostrar/ocultar funcionalidades baseadas no tipo de usuário
        if (this.currentUser.tipo === 'professor' || this.currentUser.tipo === 'admin') {
            DOMUtils.showElement('professor-tab');
            
            // Feedback de voz
            if (window.sistemaVoz && sistemaVoz.estaAtivo) {
                setTimeout(() => {
                    sistemaVoz.falar('Modo professor ativado. Você pode criar e gerenciar atividades.');
                }, 1000);
            }
        } else {
            DOMUtils.hideElement('professor-tab');
        }

        // Configurar elementos específicos do tipo de usuário
        this.setupRoleBasedElements();
    }

    setupRoleBasedElements() {
        const role = this.currentUser.tipo;
        
        // Adicionar classes CSS baseadas no papel
        document.body.classList.remove('user-aluno', 'user-professor', 'user-admin');
        document.body.classList.add(`user-${role}`);
        
        // Configurar elementos específicos
        const professorElements = document.querySelectorAll('[data-role="professor"]');
        const alunoElements = document.querySelectorAll('[data-role="aluno"]');
        
        if (role === 'professor' || role === 'admin') {
            professorElements.forEach(el => el.style.display = '');
            alunoElements.forEach(el => el.style.display = 'none');
        } else {
            professorElements.forEach(el => el.style.display = 'none');
            alunoElements.forEach(el => el.style.display = '');
        }
    }

    async loadInitialData() {
        try {
            // Carregar dados iniciais em paralelo
            await Promise.allSettled([
                this.loadUserStats(),
                this.loadUserPreferences()
            ]);
        } catch (error) {
            console.log('Erro ao carregar dados iniciais:', error);
        }
    }

    async loadUserStats() {
        // Carregar estatísticas do usuário
        try {
            // Implementar busca de estatísticas reais
            console.log('📊 Carregando estatísticas do usuário...');
        } catch (error) {
            console.log('Usando estatísticas mock');
        }
    }

    async loadUserPreferences() {
        // Carregar preferências do usuário
        try {
            const prefs = localStorage.getItem(`user_prefs_${this.currentUser.id}`);
            if (prefs) {
                const preferences = JSON.parse(prefs);
                this.applyUserPreferences(preferences);
            }
        } catch (error) {
            console.log('Erro ao carregar preferências:', error);
        }
    }

    applyUserPreferences(preferences) {
        // Aplicar preferências do usuário (tema, etc.)
        if (preferences.theme) {
            // Aplicar tema preferido
        }
    }

    // =============================================
    // UTILITÁRIOS
    // =============================================

    showLoading(mensagem = 'Carregando...') {
        // Implementar loading spinner
        console.log('⏳ ' + mensagem);
    }

    hideLoading() {
        // Esconder loading spinner
        console.log('✅ Loading completo');
    }

    getErrorMessage(error) {
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        return 'Erro desconhecido';
    }

    dispatchAuthStateChange(detail) {
        const event = new CustomEvent('authStateChanged', { detail });
        document.dispatchEvent(event);
    }

    checkInitialAuth() {
        // Verificar se há token salvo ao carregar a página
        if (this.token) {
            this.checkAuth();
        } else {
            // Tentar carregar usuário do storage como fallback
            const savedUser = this.loadUserFromStorage();
            if (savedUser) {
                this.currentUser = savedUser;
                this.showDashboard();
            }
        }
    }

    autoLogout() {
        if (this.isAuthenticated) {
            NotificationUtils.showInfo('Sessão encerrada por inatividade');
            this.logout(false);
        }
    }

    // =============================================
    // GETTERS E STATUS
    // =============================================

    getCurrentUser() {
        return this.currentUser;
    }

    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            user: this.currentUser,
            token: this.token ? '***' + this.token.slice(-8) : null,
            tokenExpiresIn: this.getTokenRemainingTime()
        };
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'professor': ['create_activities', 'grade_assignments', 'view_reports'],
            'aluno': ['submit_assignments', 'view_grades', 'participate_forum'],
            'admin': ['manage_users', 'system_config', 'view_all_data']
        };

        return permissions[this.currentUser.tipo]?.includes(permission) || false;
    }

    isProfessor() {
        return this.currentUser && (this.currentUser.tipo === 'professor' || this.currentUser.tipo === 'admin');
    }

    isStudent() {
        return this.currentUser && this.currentUser.tipo === 'aluno';
    }

    isAdmin() {
        return this.currentUser && this.currentUser.tipo === 'admin';
    }

    // =============================================
    // MÉTODOS ESTÁTICOS
    // =============================================

    static criarInstancia() {
        if (!window.authServiceInstancia) {
            window.authServiceInstancia = new AuthService();
        }
        return window.authServiceInstancia;
    }

    static getInstancia() {
        return window.authServiceInstancia || this.criarInstancia();
    }
}

// =============================================
// INICIALIZAÇÃO E FUNÇÕES GLOBAIS
// =============================================

// Criar instância global
const authService = AuthService.criarInstancia();

// Funções globais para uso no HTML
window.login = function() {
    const email = DOMUtils.getValue('login-email');
    const senha = DOMUtils.getValue('login-senha');
    authService.login(email, senha);
}

window.register = function() {
    const nome = DOMUtils.getValue('register-nome');
    const email = DOMUtils.getValue('register-email');
    const senha = DOMUtils.getValue('register-senha');
    const tipo = DOMUtils.getValue('register-tipo');
    authService.register(nome, email, senha, tipo);
}

window.logout = function() {
    authService.logout();
}

window.showRegister = function() {
    authService.showRegister();
}

window.showLogin = function() {
    authService.showLogin();
}

window.checkAuth = function() {
    return authService.checkAuth();
}

window.setAccessibility = function(access) {
    if (access) {
        // Ativar sistema de voz
        if (window.sistemaVoz) {
            sistemaVoz.estaAtivo = true;
            sistemaVoz.salvarConfiguracoes();
            sistemaVoz.criarInterfaceControle();
            sistemaVoz.falar('Acessibilidade ativada. Navegação por voz habilitada.');
        }
    } else {
        // Desativar sistema de voz
        if (window.sistemaVoz) {
            sistemaVoz.estaAtivo = false;
            sistemaVoz.salvarConfiguracoes();
            sistemaVoz.criarInterfaceControle();
        }
    }
    authService.showDashboard();
    authService.loadUserData();
}

// Exportar para uso em outros módulos
window.AuthService = AuthService;
window.authService = authService;

console.log('🔐 Módulo de autenticação carregado e pronto!');
import { authAPI, atividadesAPI, trabalhosAPI, socialAPI } from './api.js';
import type { User, Atividade, ApiResponse, AuthResponse } from './types.js';

class SistemaAtividadesApp {
  private currentUser: User | null = null;
  private token: string | null = localStorage.getItem('token');

  constructor() {
    this.init();
  }

  async init() {
    if (this.token) {
      await this.checkAuth();
    } else {
      this.showLogin();
    }
  }

  async checkAuth() {
    try {
      const payload = JSON.parse(atob(this.token!.split('.')[1]));
      this.currentUser = payload;
      this.showDashboard();
      this.loadUserData();
    } catch (error) {
      localStorage.removeItem('token');
      this.showLogin();
    }
  }

  async login() {
    const email = (document.getElementById('login-email') as HTMLInputElement).value;
    const senha = (document.getElementById('login-senha') as HTMLInputElement).value;

    try {
      const response: ApiResponse<AuthResponse> = await authAPI.login(email, senha);
      
      if (response.success && response.data) {
        this.token = response.data.token;
        localStorage.setItem('token', this.token);
        this.currentUser = response.data.user;
        this.showDashboard();
        this.loadUserData();
        this.showSuccess('Login realizado com sucesso!');
      } else {
        this.showError(response.error || 'Erro no login');
      }
    } catch (error) {
      this.showError('Erro ao fazer login');
    }
  }

  async register() {
    const nome = (document.getElementById('register-nome') as HTMLInputElement).value;
    const email = (document.getElementById('register-email') as HTMLInputElement).value;
    const senha = (document.getElementById('register-senha') as HTMLInputElement).value;
    const tipo = (document.getElementById('register-tipo') as HTMLSelectElement).value;

    try {
      const response: ApiResponse<AuthResponse> = await authAPI.register(nome, email, senha, tipo);
      
      if (response.success) {
        this.showLogin();
        this.showSuccess('Conta criada com sucesso! Faça login.');
      } else {
        this.showError(response.error || 'Erro no registro');
      }
    } catch (error) {
      this.showError('Erro ao criar conta');
    }
  }

  showLogin() {
    this.hideAllScreens();
    document.getElementById('login-screen')!.classList.remove('hidden');
  }

  showRegister() {
    this.hideAllScreens();
    document.getElementById('register-screen')!.classList.remove('hidden');
  }

  showDashboard() {
    this.hideAllScreens();
    document.getElementById('dashboard')!.classList.remove('hidden');
  }

  hideAllScreens() {
    const screens = ['login-screen', 'register-screen', 'dashboard'];
    screens.forEach(screen => {
      const element = document.getElementById(screen);
      if (element) element.classList.add('hidden');
    });
  }

  loadUserData() {
    if (!this.currentUser) return;

    document.getElementById('user-name')!.textContent = this.currentUser.nome;
    
    if (this.currentUser.tipo === 'professor' || this.currentUser.tipo === 'admin') {
      document.getElementById('professor-tab')!.classList.remove('hidden');
    }

    this.loadAtividades();
    this.loadPostsSociais();
  }

  async loadAtividades() {
    try {
      const response: ApiResponse<Atividade[]> = await atividadesAPI.listar();
      
      if (response.success && response.data) {
        this.renderAtividades(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  }

  async loadPostsSociais() {
    try {
      const response = await socialAPI.listarPosts();
      
      if (response.success && response.data) {
        this.renderPosts(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    }
  }

  renderAtividades(atividades: Atividade[]) {
    const list = document.getElementById('atividades-list')!;
    
    list.innerHTML = atividades.map(atividade => `
      <div class="activity-item">
        <h4>${atividade.titulo}</h4>
        <p>${atividade.descricao || 'Sem descrição'}</p>
        <p><strong>Entrega:</strong> ${new Date(atividade.data_entrega).toLocaleString()}</p>
        <p><strong>Professor:</strong> ${atividade.professor_nome}</p>
        <button onclick="app.entregarTrabalho(${atividade.id})" class="btn btn-primary">
          Entregar Trabalho
        </button>
      </div>
    `).join('');
  }

  renderPosts(posts: any[]) {
    const list = document.getElementById('posts-list')!;
    
    list.innerHTML = posts.map(post => `
      <div class="post-card">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <div style="width: 40px; height: 40px; background: #ddd; border-radius: 50%; margin-right: 12px;"></div>
          <div>
            <strong>${post.autor_nome}</strong>
            <div style="font-size: 12px; color: #666;">${new Date(post.criado_em).toLocaleString()}</div>
          </div>
        </div>
        <h4>${post.titulo}</h4>
        <p>${post.conteudo}</p>
        <div style="display: flex; gap: 16px; margin-top: 12px; color: #666;">
          <span>❤️ ${post.total_curtidas} curtidas</span>
          <span>💬 ${post.total_comentarios} comentários</span>
        </div>
        <button onclick="app.curtirPost(${post.id})" class="btn" style="margin-top: 8px;">
          Curtir
        </button>
      </div>
    `).join('');
  }

  async entregarTrabalho(idAtividade: number) {
    const titulo = prompt('Título do seu trabalho:');
    const conteudo = prompt('Conteúdo/descrição do trabalho:');
    const visibilidade = prompt('Visibilidade (privado, turma, publico):', 'privado');

    if (titulo && conteudo) {
      try {
        const response = await trabalhosAPI.entregar({
          id_atividade: idAtividade,
          titulo,
          conteudo,
          visibilidade
        });

        if (response.success) {
          this.showSuccess(response.message || 'Trabalho entregue com sucesso!');
          this.loadAtividades();
        } else {
          this.showError(response.error || 'Erro ao entregar trabalho');
        }
      } catch (error) {
        this.showError('Erro ao entregar trabalho');
      }
    }
  }

  async criarAtividade() {
    const titulo = (document.getElementById('activity-titulo') as HTMLInputElement).value;
    const descricao = (document.getElementById('activity-descricao') as HTMLTextAreaElement).value;
    const data_entrega = (document.getElementById('activity-data-entrega') as HTMLInputElement).value;

    if (!titulo || !data_entrega) {
      this.showError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await atividadesAPI.criar({
        titulo,
        descricao,
        tipo: 'trabalho',
        data_entrega,
        valor_maximo: 10.00,
        instrucoes: '',
        anexos_permitidos: true
      });

      if (response.success) {
        this.showSuccess('Atividade criada com sucesso!');
        (document.getElementById('activity-titulo') as HTMLInputElement).value = '';
        (document.getElementById('activity-descricao') as HTMLTextAreaElement).value = '';
        (document.getElementById('activity-data-entrega') as HTMLInputElement).value = '';
        this.loadAtividades();
      } else {
        this.showError(response.error || 'Erro ao criar atividade');
      }
    } catch (error) {
      this.showError('Erro ao criar atividade');
    }
  }

  async curtirPost(postId: number) {
    try {
      const response = await socialAPI.curtirPost(postId);
      
      if (response.success) {
        this.loadPostsSociais();
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  }

  showTab(tabName: string) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });
    
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`)!.classList.remove('hidden');
    (event!.target as HTMLElement).classList.add('active');
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser = null;
    this.token = null;
    this.showLogin();
  }

  showError(message: string) {
    alert(`❌ ${message}`);
  }

  showSuccess(message: string) {
    alert(`✅ ${message}`);
  }
}

declare global {
  interface Window {
    app: SistemaAtividadesApp;
  }
}

const app = new SistemaAtividadesApp();
window.app = app;

export default app;
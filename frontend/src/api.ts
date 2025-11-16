const API_BASE = 'http://localhost:3000/api';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    return response.json();
  },

  async get(endpoint: string) {
    return this.request(endpoint);
  },

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const authAPI = {
  login: (email: string, senha: string) => 
    api.post('/auth/login', { email, senha }),

  register: (nome: string, email: string, senha: string, tipo: string) => 
    api.post('/auth/register', { nome, email, senha, tipo }),
};

export const atividadesAPI = {
  listar: () => api.get('/atividades'),
  criar: (dados: any) => api.post('/atividades', dados),
};

export const trabalhosAPI = {
  entregar: (dados: any) => api.post('/trabalhos', dados),
  listar: () => api.get('/trabalhos'),
};

export const socialAPI = {
  listarPosts: () => api.get('/social/posts'),
  curtirPost: (postId: number) => api.post(`/social/posts/${postId}/curtir`, {}),
};
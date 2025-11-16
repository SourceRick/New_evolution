export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: 'aluno' | 'professor' | 'admin';
  foto_url?: string;
  ativo: boolean;
  criado_em: string;
}

export interface Atividade {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: 'trabalho' | 'prova' | 'exercicio' | 'projeto';
  data_criacao: string;
  data_entrega: string;
  id_professor: number;
  valor_maximo: number;
  instrucoes?: string;
  anexos_permitidos: boolean;
  professor_nome?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
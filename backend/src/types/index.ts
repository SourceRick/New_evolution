export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: 'aluno' | 'professor' | 'admin';
  foto_url?: string;
  ativo: boolean;
  criado_em: Date;
}

export interface Atividade {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: 'trabalho' | 'prova' | 'exercicio' | 'projeto';
  data_criacao: Date;
  data_entrega: Date;
  id_professor: number;
  valor_maximo: number;
  instrucoes?: string;
  anexos_permitidos: boolean;
  professor_nome?: string;
}

export interface Trabalho {
  id: number;
  id_atividade: number;
  id_aluno: number;
  titulo: string;
  conteudo: string;
  data_entrega: Date;
  nota?: number;
  comentario_professor?: string;
  status: 'rascunho' | 'entregue' | 'avaliado' | 'atrasado';
  visibilidade: 'privado' | 'turma' | 'publico';
  anonimo: boolean;
}

export interface PostSocial {
  id: number;
  id_trabalho: number;
  titulo: string;
  conteudo: string;
  tags: string[];
  visualizacoes: number;
  curtidas: number;
  permite_comentarios: boolean;
  ativo: boolean;
  criado_em: Date;
  autor_nome?: string;
  foto_url?: string;
  trabalho_titulo?: string;
  total_curtidas?: number;
  total_comentarios?: number;
}

export interface Comentario {
  id: number;
  id_post: number;
  id_usuario: number;
  conteudo: string;
  editado: boolean;
  ativo: boolean;
  criado_em: Date;
  autor_nome?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  tipo: 'aluno' | 'professor' | 'admin';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: Omit<User, 'senha'>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sua_chave_secreta_super_segura';

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bdinteligente'
};

// Mock data para desenvolvimento
let usuarios = [
  {
    id: 1,
    nome: 'Professor Silva',
    email: 'prof.silva@email.com',
    senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    tipo: 'professor',
    ativo: true
  },
  {
    id: 2,
    nome: 'Aluno João',
    email: 'joao@email.com',
    senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    tipo: 'aluno',
    ativo: true
  }
];

let atividades = [
  {
    id: 1,
    titulo: 'Trabalho de Programação Web',
    descricao: 'Desenvolver um site responsivo usando HTML, CSS e JavaScript',
    tipo: 'trabalho',
    data_entrega: '2024-03-15T23:59:00',
    id_professor: 1,
    valor_maximo: 10.00,
    professor_nome: 'Professor Silva'
  },
  {
    id: 2,
    titulo: 'Prova de Banco de Dados',
    descricao: 'Prova teórica sobre modelagem ER e SQL',
    tipo: 'prova',
    data_entrega: '2024-03-20T14:00:00',
    id_professor: 1,
    valor_maximo: 8.00,
    professor_nome: 'Professor Silva'
  }
];

let trabalhos = [
  {
    id: 1,
    id_atividade: 1,
    id_aluno: 2,
    titulo: 'Meu Site Pessoal',
    conteudo: 'Desenvolvi um site pessoal com portfolio',
    data_entrega: new Date().toISOString(),
    nota: 9.5,
    status: 'avaliado',
    visibilidade: 'publico',
    aluno_nome: 'Aluno João'
  }
];

let postsSociais = [
  {
    id: 1,
    id_trabalho: 1,
    titulo: 'Meu Site Pessoal - Feedback',
    conteudo: 'Gostaria de feedback no meu site pessoal que desenvolvi!',
    autor_nome: 'Aluno João',
    total_curtidas: 5,
    total_comentarios: 3,
    criado_em: new Date().toISOString()
  }
];

// Rotas de Autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, tipo = 'aluno' } = req.body;
    
    const usuarioExistente = usuarios.find(u => u.email === email);
    if (usuarioExistente) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email já cadastrado' 
      });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const novoUsuario = {
      id: usuarios.length + 1,
      nome,
      email,
      senha: hashedPassword,
      tipo,
      ativo: true,
      criado_em: new Date()
    };

    usuarios.push(novoUsuario);

    const token = jwt.sign(
      { id: novoUsuario.id, email: novoUsuario.email, tipo: novoUsuario.tipo },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        message: 'Usuário criado com sucesso',
        token,
        user: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          tipo: novoUsuario.tipo,
          ativo: novoUsuario.ativo,
          criado_em: novoUsuario.criado_em
        }
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const usuario = usuarios.find(u => u.email === email && u.ativo);
    
    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas' 
      });
    }

    const validPassword = await bcrypt.compare(senha, usuario.senha);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas' 
      });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
          ativo: usuario.ativo,
          criado_em: usuario.criado_em
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Middleware de autenticação
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rotas de Atividades
app.get('/api/atividades', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: atividades
  });
});

app.post('/api/atividades', authenticateToken, (req, res) => {
  if (req.user.tipo !== 'professor' && req.user.tipo !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acesso negado' });
  }

  const { titulo, descricao, tipo, data_entrega, valor_maximo } = req.body;
  
  const novaAtividade = {
    id: atividades.length + 1,
    titulo,
    descricao,
    tipo: tipo || 'trabalho',
    data_entrega,
    id_professor: req.user.id,
    valor_maximo: valor_maximo || 10.00,
    professor_nome: 'Professor Silva'
  };

  atividades.push(novaAtividade);

  res.status(201).json({
    success: true,
    data: {
      message: 'Atividade criada com sucesso',
      atividade: novaAtividade
    }
  });
});

// Rotas de Trabalhos
app.post('/api/trabalhos', authenticateToken, (req, res) => {
  const { id_atividade, titulo, conteudo, visibilidade = 'privado' } = req.body;
  
  const novoTraballho = {
    id: trabalhos.length + 1,
    id_atividade,
    id_aluno: req.user.id,
    titulo,
    conteudo,
    data_entrega: new Date().toISOString(),
    status: 'entregue',
    visibilidade,
    aluno_nome: req.user.nome || 'Aluno'
  };

  trabalhos.push(novoTraballho);

  // Se for público, criar post na rede social
  if (visibilidade === 'publico') {
    const novoPost = {
      id: postsSociais.length + 1,
      id_trabalho: novoTraballho.id,
      titulo: titulo,
      conteudo: conteudo,
      autor_nome: novoTraballho.aluno_nome,
      total_curtidas: 0,
      total_comentarios: 0,
      criado_em: new Date().toISOString()
    };
    postsSociais.push(novoPost);
  }

  res.json({
    success: true,
    data: {
      message: 'Trabalho entregue com sucesso',
      trabalho: novoTraballho
    }
  });
});

app.get('/api/trabalhos', authenticateToken, (req, res) => {
  const userTrabalhos = trabalhos.filter(t => t.id_aluno === req.user.id);
  res.json({
    success: true,
    data: userTrabalhos
  });
});

// Rotas da Rede Social
app.get('/api/social/posts', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: postsSociais
  });
});

app.post('/api/social/posts/:id/curtir', authenticateToken, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = postsSociais.find(p => p.id === postId);
  
  if (post) {
    post.total_curtidas += 1;
    res.json({
      success: true,
      data: {
        message: 'Post curtido',
        total_curtidas: post.total_curtidas
      }
    });
  } else {
    res.status(404).json({ success: false, error: 'Post não encontrado' });
  }
});

// Dashboard Data
app.get('/api/dashboard/aluno', authenticateToken, (req, res) => {
  if (req.user.tipo !== 'aluno') {
    return res.status(403).json({ success: false, error: 'Acesso apenas para alunos' });
  }

  const userTrabalhos = trabalhos.filter(t => t.id_aluno === req.user.id);
  const atividadesPendentes = atividades.filter(a => 
    new Date(a.data_entrega) > new Date() &&
    !userTrabalhos.some(t => t.id_atividade === a.id)
  );

  const dashboardData = {
    total_atividades: atividades.length,
    atividades_entregues: userTrabalhos.length,
    atividades_pendentes: atividadesPendentes.length,
    media_notas: userTrabalhos.filter(t => t.nota).reduce((acc, t) => acc + t.nota, 0) / userTrabalhos.filter(t => t.nota).length || 0,
    trabalhos_recentes: userTrabalhos.slice(0, 5),
    atividades_recentes: atividades.slice(0, 3)
  };

  res.json({ success: true, data: dashboardData });
});

app.get('/api/dashboard/professor', authenticateToken, (req, res) => {
  if (req.user.tipo !== 'professor') {
    return res.status(403).json({ success: false, error: 'Acesso apenas para professores' });
  }

  const minhasAtividades = atividades.filter(a => a.id_professor === req.user.id);
  const totalTrabalhos = trabalhos.filter(t => 
    minhasAtividades.some(a => a.id === t.id_atividade)
  );
  const trabalhosPendentes = totalTrabalhos.filter(t => t.status === 'entregue' && !t.nota);

  const dashboardData = {
    total_atividades: minhasAtividades.length,
    total_trabalhos: totalTrabalhos.length,
    trabalhos_pendentes: trabalhosPendentes.length,
    atividades_recentes: minhasAtividades.slice(0, 5),
    trabalhos_recentes: totalTrabalhos.slice(0, 5)
  };

  res.json({ success: true, data: dashboardData });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Sistema de Atividades API',
    usuarios: usuarios.length,
    atividades: atividades.length,
    trabalhos: trabalhos.length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📚 API disponível em: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
import express from 'express';
import { 
    authenticateToken, 
    logAuthenticatedRequest,
    requireActiveUser
} from '../middleware/auth.js';

const router = express.Router();

// Dados mock (em produção, viriam do banco de dados)
let postsSociais = [
    {
        id: 1,
        id_trabalho: 1,
        titulo: 'Meu Site Pessoal - Portfolio Profissional',
        conteudo: 'Acabei de entregar meu site pessoal desenvolvido para a disciplina de Programação Web. Gostaria de feedbacks sobre o design e usabilidade! 🚀\n\nRecursos implementados:\n• Design responsivo\n• Animações CSS\n• Formulário de contato funcional\n• Portfolio interativo\n\nConfira o código no GitHub!',
        tags: JSON.stringify(['web', 'portfolio', 'html', 'css', 'javascript', 'frontend']),
        visualizacoes: 47,
        curtidas: 12,
        permite_comentarios: true,
        ativo: true,
        criado_em: new Date('2024-01-14T10:30:00').toISOString(),
        atualizado_em: new Date('2024-01-14T10:30:00').toISOString(),
        autor_nome: 'Aluno João',
        autor_id: 2,
        trabalho_titulo: 'Meu Site Pessoal - Portfolio',
        atividade_titulo: 'Trabalho de Programação Web',
        anexos: [
            {
                tipo: 'imagem',
                url: '/arquivos/site-preview.jpg',
                descricao: 'Preview do site'
            },
            {
                tipo: 'link',
                url: 'https://github.com/joao/meu-portfolio',
                descricao: 'Código no GitHub'
            }
        ]
    },
    {
        id: 2,
        id_trabalho: 3,
        titulo: 'Site Institucional - Empresa XYZ',
        conteudo: 'Compartilhando meu projeto de site institucional desenvolvido em grupo! Focamos em:\n• UX/UI moderna\n• Performance otimizada\n• SEO básico implementado\n• Integração com redes sociais\n\nAceitamos sugestões para melhorias! 💡',
        tags: JSON.stringify(['web', 'empresa', 'grupo', 'ux', 'seo', 'projeto']),
        visualizacoes: 32,
        curtidas: 8,
        permite_comentarios: true,
        ativo: true,
        criado_em: new Date('2024-01-15T14:20:00').toISOString(),
        atualizado_em: new Date('2024-01-15T14:20:00').toISOString(),
        autor_nome: 'Aluna Maria',
        autor_id: 3,
        trabalho_titulo: 'Site Institucional - Empresa XYZ',
        atividade_titulo: 'Trabalho de Programação Web',
        anexos: [
            {
                tipo: 'imagem',
                url: '/arquivos/empresa-xyz-preview.jpg',
                descricao: 'Layout do site'
            }
        ]
    },
    {
        id: 3,
        titulo: 'Dicas para Organização de Estudos',
        conteudo: 'Compartilhando meu método de organização que tem me ajudado muito:\n\n📚 **Técnica Pomodoro**: 25min foco + 5min descanso\n🗂️ **Organização por pastas**: Separar por disciplina\n📝 **Resumos visuais**: Mapas mentais funcionam!\n🎯 **Metas diárias**: Pequenas conquistas todo dia\n\nQual método vocês usam? Compartilhem suas experiências! 👇',
        tags: JSON.stringify(['dicas', 'organização', 'estudos', 'produtividade', 'aprendizado']),
        visualizacoes: 89,
        curtidas: 25,
        permite_comentarios: true,
        ativo: true,
        criado_em: new Date('2024-01-16T09:15:00').toISOString(),
        atualizado_em: new Date('2024-01-16T09:15:00').toISOString(),
        autor_nome: 'Professor Silva',
        autor_id: 1,
        trabalho_titulo: null,
        atividade_titulo: null,
        anexos: [
            {
                tipo: 'documento',
                url: '/arquivos/plano-estudos.pdf',
                descricao: 'Modelo de plano de estudos'
            }
        ]
    }
];

let comentarios = [
    {
        id: 1,
        id_post: 1,
        id_usuario: 3,
        conteudo: 'Parabéns pelo trabalho! O design está muito clean e profissional. 👏\nGostei especialmente da paleta de cores e da tipografia.',
        editado: false,
        ativo: true,
        criado_em: new Date('2024-01-14T11:15:00').toISOString(),
        atualizado_em: new Date('2024-01-14T11:15:00').toISOString(),
        autor_nome: 'Aluna Maria',
        autor_id: 3,
        respostas: [
            {
                id: 101,
                id_comentario: 1,
                id_usuario: 2,
                conteudo: 'Obrigado, Maria! A paleta foi inspirada no Material Design.',
                editado: false,
                ativo: true,
                criado_em: new Date('2024-01-14T11:30:00').toISOString(),
                autor_nome: 'Aluno João',
                autor_id: 2
            }
        ]
    },
    {
        id: 2,
        id_post: 1,
        id_usuario: 1,
        conteudo: 'Muito bom ver o projeto publicado aqui! A navegação mobile está excelente. 💪\nSugestão: testar o contraste de cores para acessibilidade.',
        editado: false,
        ativo: true,
        criado_em: new Date('2024-01-14T14:20:00').toISOString(),
        atualizado_em: new Date('2024-01-14T14:20:00').toISOString(),
        autor_nome: 'Professor Silva',
        autor_id: 1
    },
    {
        id: 3,
        id_post: 3,
        id_usuario: 2,
        conteudo: 'Ótimas dicas, professor! Uso o Pomodoro também e mudou minha produtividade. 🕒\nRecomendo o app "Forest" para ajudar no foco.',
        editado: false,
        ativo: true,
        criado_em: new Date('2024-01-16T10:30:00').toISOString(),
        atualizado_em: new Date('2024-01-16T10:30:00').toISOString(),
        autor_nome: 'Aluno João',
        autor_id: 2
    }
];

let avaliacoesSociais = [
    {
        id: 1,
        id_post: 1,
        id_avaliador: 3,
        tipo: 'curtir',
        comentario: null,
        criado_em: new Date('2024-01-14T11:15:00').toISOString()
    },
    {
        id: 2,
        id_post: 1,
        id_avaliador: 1,
        tipo: 'curtir',
        comentario: null,
        criado_em: new Date('2024-01-14T14:20:00').toISOString()
    },
    {
        id: 3,
        id_post: 3,
        id_avaliador: 2,
        tipo: 'util',
        comentario: 'Vou implementar essas dicas!',
        criado_em: new Date('2024-01-16T10:30:00').toISOString()
    }
];

// =============================================
// MIDDLEWARE ESPECÍFICO PARA REDE SOCIAL
// =============================================

/**
 * Middleware para verificar se o post existe
 */
const validatePostExists = (req, res, next) => {
    const postId = parseInt(req.params.id);
    
    const post = postsSociais.find(p => p.id === postId && p.ativo);
    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post não encontrado ou desativado'
        });
    }

    req.post = post;
    next();
};

/**
 * Middleware para verificar se o comentário existe
 */
const validateCommentExists = (req, res, next) => {
    const commentId = parseInt(req.params.commentId);
    
    const comment = comentarios.find(c => c.id === commentId && c.ativo);
    if (!comment) {
        return res.status(404).json({
            success: false,
            error: 'Comentário não encontrado'
        });
    }

    req.comment = comment;
    next();
};

/**
 * Middleware para incrementar visualizações
 */
const incrementViewCount = (req, res, next) => {
    if (req.post && req.method === 'GET') {
        req.post.visualizacoes += 1;
        console.log(`👀 Visualização no post ${req.post.id}. Total: ${req.post.visualizacoes}`);
    }
    next();
};

// =============================================
// ROTAS DE POSTS
// =============================================

/**
 * @route   GET /api/social/posts
 * @desc    Obter feed de posts (com paginação)
 * @access  Private
 */
router.get('/posts',
    authenticateToken,
    logAuthenticatedRequest,
    (req, res) => {
        try {
            const { page = 1, limit = 10, search, tag } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            
            console.log('📱 Carregando feed social para:', req.user.nome);

            let postsFiltrados = [...postsSociais].filter(post => post.ativo);

            // Aplicar filtros
            if (search) {
                const searchLower = search.toLowerCase();
                postsFiltrados = postsFiltrados.filter(post => 
                    post.titulo.toLowerCase().includes(searchLower) ||
                    post.conteudo.toLowerCase().includes(searchLower) ||
                    post.autor_nome.toLowerCase().includes(searchLower)
                );
            }

            if (tag) {
                postsFiltrados = postsFiltrados.filter(post => {
                    const tags = JSON.parse(post.tags || '[]');
                    return tags.some(t => t.toLowerCase() === tag.toLowerCase());
                });
            }

            // Ordenar por data (mais recentes primeiro)
            postsFiltrados.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

            // Paginação
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            const postsPaginados = postsFiltrados.slice(startIndex, endIndex);

            // Adicionar comentários e informações de curtida do usuário
            const postsComDetalhes = postsPaginados.map(post => {
                const comentariosPost = comentarios
                    .filter(comentario => comentario.id_post === post.id && comentario.ativo)
                    .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));

                const userCurtiu = avaliacoesSociais.some(
                    avaliacao => avaliacao.id_post === post.id && 
                               avaliacao.id_avaliador === req.user.id && 
                               avaliacao.tipo === 'curtir'
                );

                return {
                    ...post,
                    comentarios: comentariosPost.slice(0, 5), // Últimos 5 comentários
                    user_curtiu: userCurtiu,
                    total_comentarios: comentariosPost.length
                };
            });

            console.log(`✅ Feed carregado: ${postsComDetalhes.length} posts para ${req.user.nome}`);

            res.json({
                success: true,
                data: postsComDetalhes,
                meta: {
                    page: pageNum,
                    limit: limitNum,
                    total: postsFiltrados.length,
                    totalPages: Math.ceil(postsFiltrados.length / limitNum),
                    hasNext: endIndex < postsFiltrados.length,
                    hasPrev: pageNum > 1
                }
            });

        } catch (error) {
            console.error('💥 Erro ao carregar feed:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao carregar feed'
            });
        }
    }
);

/**
 * @route   GET /api/social/posts/:id
 * @desc    Obter detalhes de um post específico
 * @access  Private
 */
router.get('/posts/:id',
    authenticateToken,
    validatePostExists,
    incrementViewCount,
    (req, res) => {
        try {
            const post = req.post;

            // Buscar todos os comentários do post
            const comentariosPost = comentarios
                .filter(comentario => comentario.id_post === post.id && comentario.ativo)
                .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));

            // Verificar se usuário curtiu
            const userCurtiu = avaliacoesSociais.some(
                avaliacao => avaliacao.id_post === post.id && 
                           avaliacao.id_avaliador === req.user.id && 
                           avaliacao.tipo === 'curtir'
            );

            // Estatísticas de engajamento
            const engajamento = {
                total_curtidas: post.curtidas,
                total_comentarios: comentariosPost.length,
                total_visualizacoes: post.visualizacoes,
                user_curtiu: userCurtiu
            };

            console.log(`📄 Post ${post.id} visualizado por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    ...post,
                    comentarios: comentariosPost,
                    engajamento: engajamento
                }
            });

        } catch (error) {
            console.error('💥 Erro ao buscar post:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar post'
            });
        }
    }
);

/**
 * @route   POST /api/social/posts
 * @desc    Criar um novo post
 * @access  Private
 */
router.post('/posts',
    authenticateToken,
    requireActiveUser,
    (req, res) => {
        try {
            const { titulo, conteudo, tags, id_trabalho, permite_comentarios = true, anexos = [] } = req.body;

            console.log('📝 Criando novo post:', { autor: req.user.nome, titulo });

            // Validações
            if (!titulo || titulo.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Título do post é obrigatório'
                });
            }

            if (!conteudo || conteudo.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Conteúdo do post é obrigatório'
                });
            }

            if (titulo.length > 200) {
                return res.status(400).json({
                    success: false,
                    error: 'Título deve ter no máximo 200 caracteres'
                });
            }

            // Criar novo post
            const novoPost = {
                id: postsSociais.length + 1,
                id_trabalho: id_trabalho || null,
                titulo: titulo.trim(),
                conteudo: conteudo.trim(),
                tags: JSON.stringify(tags || []),
                visualizacoes: 0,
                curtidas: 0,
                permite_comentarios: permite_comentarios,
                ativo: true,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
                autor_nome: req.user.nome,
                autor_id: req.user.id,
                trabalho_titulo: null,
                atividade_titulo: null,
                anexos: anexos
            };

            // Se for vinculado a um trabalho, buscar informações
            if (id_trabalho) {
                // Em produção, buscar do banco
                novoPost.trabalho_titulo = 'Trabalho Vinculado';
                novoPost.atividade_titulo = 'Atividade Relacionada';
            }

            postsSociais.push(novoPost);
            
            console.log(`✅ Post criado com sucesso: ${novoPost.id} - "${novoPost.titulo}"`);

            res.status(201).json({
                success: true,
                data: {
                    message: 'Post criado com sucesso!',
                    post: novoPost
                }
            });

        } catch (error) {
            console.error('💥 Erro ao criar post:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao criar post'
            });
        }
    }
);

/**
 * @route   PUT /api/social/posts/:id
 * @desc    Atualizar um post (apenas autor)
 * @access  Private
 */
router.put('/posts/:id',
    authenticateToken,
    validatePostExists,
    (req, res) => {
        try {
            const post = req.post;

            // Verificar se o usuário é o autor
            if (post.autor_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode editar seus próprios posts.'
                });
            }

            const { titulo, conteudo, tags, permite_comentarios, anexos } = req.body;

            // Atualizar campos permitidos
            if (titulo !== undefined) post.titulo = titulo.trim();
            if (conteudo !== undefined) post.conteudo = conteudo.trim();
            if (tags !== undefined) post.tags = JSON.stringify(tags || []);
            if (permite_comentarios !== undefined) post.permite_comentarios = permite_comentarios;
            if (anexos !== undefined) post.anexos = anexos;
            
            post.atualizado_em = new Date().toISOString();

            console.log(`✏️ Post ${post.id} atualizado por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Post atualizado com sucesso!',
                    post: post
                }
            });

        } catch (error) {
            console.error('💥 Erro ao atualizar post:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao atualizar post'
            });
        }
    }
);

/**
 * @route   DELETE /api/social/posts/:id
 * @desc    Excluir/desativar um post (apenas autor)
 * @access  Private
 */
router.delete('/posts/:id',
    authenticateToken,
    validatePostExists,
    (req, res) => {
        try {
            const post = req.post;

            // Verificar se o usuário é o autor
            if (post.autor_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode excluir seus próprios posts.'
                });
            }

            // Soft delete - marcar como inativo
            post.ativo = false;
            post.atualizado_em = new Date().toISOString();

            console.log(`🗑️ Post ${post.id} desativado por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Post excluído com sucesso!'
                }
            });

        } catch (error) {
            console.error('💥 Erro ao excluir post:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao excluir post'
            });
        }
    }
);

// =============================================
// ROTAS DE CURTIDAS/AVALIAÇÕES
// =============================================

/**
 * @route   POST /api/social/posts/:id/curtir
 * @desc    Curtir/descurtir um post
 * @access  Private
 */
router.post('/posts/:id/curtir',
    authenticateToken,
    validatePostExists,
    (req, res) => {
        try {
            const post = req.post;

            // Verificar se post permite interações
            if (!post.ativo) {
                return res.status(400).json({
                    success: false,
                    error: 'Este post não está mais disponível'
                });
            }

            // Verificar se usuário já curtiu
            const existingAvaliacaoIndex = avaliacoesSociais.findIndex(
                avaliacao => avaliacao.id_post === post.id && 
                           avaliacao.id_avaliador === req.user.id && 
                           avaliacao.tipo === 'curtir'
            );

            let action;
            if (existingAvaliacaoIndex !== -1) {
                // Descurtir - remover avaliação
                avaliacoesSociais.splice(existingAvaliacaoIndex, 1);
                post.curtidas = Math.max(0, post.curtidas - 1);
                action = 'descurtido';
            } else {
                // Curtir - adicionar avaliação
                const novaAvaliacao = {
                    id: avaliacoesSociais.length + 1,
                    id_post: post.id,
                    id_avaliador: req.user.id,
                    tipo: 'curtir',
                    comentario: null,
                    criado_em: new Date().toISOString()
                };
                avaliacoesSociais.push(novaAvaliacao);
                post.curtidas += 1;
                action = 'curtido';
            }

            console.log(`❤️ Post ${post.id} ${action} por ${req.user.nome}. Total: ${post.curtidas}`);

            res.json({
                success: true,
                data: {
                    message: `Post ${action} com sucesso!`,
                    total_curtidas: post.curtidas,
                    user_curtiu: action === 'curtido'
                }
            });

        } catch (error) {
            console.error('💥 Erro ao curtir post:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao curtir post'
            });
        }
    }
);

/**
 * @route   POST /api/social/posts/:id/avaliar
 * @desc    Avaliar um post com tipo específico (útil, criativo, etc)
 * @access  Private
 */
router.post('/posts/:id/avaliar',
    authenticateToken,
    validatePostExists,
    (req, res) => {
        try {
            const post = req.post;
            const { tipo, comentario } = req.body;

            // Tipos de avaliação permitidos
            const tiposPermitidos = ['curtir', 'util', 'criativo', 'interessante'];
            if (!tiposPermitidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    error: `Tipo de avaliação inválido. Permitidos: ${tiposPermitidos.join(', ')}`
                });
            }

            // Verificar se já existe avaliação do usuário
            const existingAvaliacaoIndex = avaliacoesSociais.findIndex(
                avaliacao => avaliacao.id_post === post.id && 
                           avaliacao.id_avaliador === req.user.id
            );

            if (existingAvaliacaoIndex !== -1) {
                // Atualizar avaliação existente
                avaliacoesSociais[existingAvaliacaoIndex].tipo = tipo;
                avaliacoesSociais[existingAvaliacaoIndex].comentario = comentario;
                avaliacoesSociais[existingAvaliacaoIndex].criado_em = new Date().toISOString();
            } else {
                // Nova avaliação
                const novaAvaliacao = {
                    id: avaliacoesSociais.length + 1,
                    id_post: post.id,
                    id_avaliador: req.user.id,
                    tipo: tipo,
                    comentario: comentario,
                    criado_em: new Date().toISOString()
                };
                avaliacoesSociais.push(novaAvaliacao);
            }

            console.log(`⭐ Post ${post.id} avaliado como "${tipo}" por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Avaliação registrada com sucesso!',
                    tipo: tipo
                }
            });

        } catch (error) {
            console.error('💥 Erro ao avaliar post:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao avaliar post'
            });
        }
    }
);

// =============================================
// ROTAS DE COMENTÁRIOS
// =============================================

/**
 * @route   POST /api/social/posts/:id/comentarios
 * @desc    Adicionar comentário a um post
 * @access  Private
 */
router.post('/posts/:id/comentarios',
    authenticateToken,
    validatePostExists,
    (req, res) => {
        try {
            const post = req.post;
            const { conteudo } = req.body;

            // Verificar se post permite comentários
            if (!post.permite_comentarios) {
                return res.status(400).json({
                    success: false,
                    error: 'Este post não permite comentários'
                });
            }

            if (!conteudo || conteudo.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Conteúdo do comentário é obrigatório'
                });
            }

            if (conteudo.length > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Comentário deve ter no máximo 1000 caracteres'
                });
            }

            const novoComentario = {
                id: comentarios.length + 1,
                id_post: post.id,
                id_usuario: req.user.id,
                conteudo: conteudo.trim(),
                editado: false,
                ativo: true,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
                autor_nome: req.user.nome,
                autor_id: req.user.id,
                respostas: []
            };

            comentarios.push(novoComentario);
            
            console.log(`💬 Novo comentário no post ${post.id} por ${req.user.nome}`);

            res.status(201).json({
                success: true,
                data: {
                    message: 'Comentário adicionado com sucesso!',
                    comentario: novoComentario
                }
            });

        } catch (error) {
            console.error('💥 Erro ao adicionar comentário:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao adicionar comentário'
            });
        }
    }
);

/**
 * @route   PUT /api/social/posts/:id/comentarios/:commentId
 * @desc    Editar um comentário (apenas autor)
 * @access  Private
 */
router.put('/posts/:id/comentarios/:commentId',
    authenticateToken,
    validatePostExists,
    validateCommentExists,
    (req, res) => {
        try {
            const comment = req.comment;
            const { conteudo } = req.body;

            // Verificar se o usuário é o autor
            if (comment.autor_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode editar seus próprios comentários.'
                });
            }

            if (!conteudo || conteudo.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Conteúdo do comentário é obrigatório'
                });
            }

            comment.conteudo = conteudo.trim();
            comment.editado = true;
            comment.atualizado_em = new Date().toISOString();

            console.log(`✏️ Comentário ${comment.id} editado por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Comentário atualizado com sucesso!',
                    comentario: comment
                }
            });

        } catch (error) {
            console.error('💥 Erro ao editar comentário:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao editar comentário'
            });
        }
    }
);

/**
 * @route   DELETE /api/social/posts/:id/comentarios/:commentId
 * @desc    Excluir um comentário (apenas autor)
 * @access  Private
 */
router.delete('/posts/:id/comentarios/:commentId',
    authenticateToken,
    validatePostExists,
    validateCommentExists,
    (req, res) => {
        try {
            const comment = req.comment;

            // Verificar se o usuário é o autor
            if (comment.autor_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode excluir seus próprios comentários.'
                });
            }

            // Soft delete
            comment.ativo = false;
            comment.atualizado_em = new Date().toISOString();

            console.log(`🗑️ Comentário ${comment.id} excluído por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Comentário excluído com sucesso!'
                }
            });

        } catch (error) {
            console.error('💥 Erro ao excluir comentário:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao excluir comentário'
            });
        }
    }
);

// =============================================
// ROTAS DE ESTATÍSTICAS E RELATÓRIOS
// =============================================

/**
 * @route   GET /api/social/estatisticas
 * @desc    Obter estatísticas da rede social
 * @access  Private
 */
router.get('/estatisticas',
    authenticateToken,
    (req, res) => {
        try {
            const postsAtivos = postsSociais.filter(post => post.ativo);
            const comentariosAtivos = comentarios.filter(comment => comment.ativo);

            const estatisticas = {
                total_posts: postsAtivos.length,
                total_comentarios: comentariosAtivos.length,
                total_curtidas: postsAtivos.reduce((acc, post) => acc + post.curtidas, 0),
                total_visualizacoes: postsAtivos.reduce((acc, post) => acc + post.visualizacoes, 0),
                posts_por_tipo: {
                    com_trabalho: postsAtivos.filter(post => post.id_trabalho).length,
                    sem_trabalho: postsAtivos.filter(post => !post.id_trabalho).length
                },
                engajamento_medio: postsAtivos.length > 0 ? 
                    (postsAtivos.reduce((acc, post) => acc + post.curtidas, 0) / postsAtivos.length).toFixed(2) : 0,
                top_posts: postsAtivos
                    .sort((a, b) => b.curtidas - a.curtidas)
                    .slice(0, 5)
                    .map(post => ({
                        id: post.id,
                        titulo: post.titulo,
                        curtidas: post.curtidas,
                        visualizacoes: post.visualizacoes
                    }))
            };

            console.log(`📈 Estatísticas da rede social geradas para ${req.user.nome}`);

            res.json({
                success: true,
                data: estatisticas
            });

        } catch (error) {
            console.error('💥 Erro ao gerar estatísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao gerar estatísticas'
            });
        }
    }
);

/**
 * @route   GET /api/social/tags
 * @desc    Obter lista de tags populares
 * @access  Private
 */
router.get('/tags',
    authenticateToken,
    (req, res) => {
        try {
            const tagCount = {};

            postsSociais.forEach(post => {
                if (post.ativo) {
                    const tags = JSON.parse(post.tags || '[]');
                    tags.forEach(tag => {
                        tagCount[tag] = (tagCount[tag] || 0) + 1;
                    });
                }
            });

            const tagsPopulares = Object.entries(tagCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20)
                .map(([tag, count]) => ({ tag, count }));

            res.json({
                success: true,
                data: tagsPopulares
            });

        } catch (error) {
            console.error('💥 Erro ao buscar tags:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar tags'
            });
        }
    }
);

export default router;
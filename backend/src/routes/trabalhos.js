import express from 'express';
import { 
    authenticateToken, 
    requireAluno, 
    requireProfessor,
    requireOwnershipOrAdmin,
    logAuthenticatedRequest 
} from '../middleware/auth.js';

const router = express.Router();

// Dados mock (em produção, viriam do banco de dados)
let trabalhos = [
    {
        id: 1,
        id_atividade: 1,
        id_aluno: 2,
        titulo: 'Meu Site Pessoal - Portfolio',
        conteudo: 'Desenvolvi um site pessoal completo com portfolio, blog e formulário de contato. Usei HTML5, CSS3 com Grid/Flexbox, e JavaScript vanilla para as interações.',
        data_entrega: new Date('2024-01-14T10:30:00').toISOString(),
        nota: 9.5,
        comentario_professor: 'Excelente trabalho! Design responsivo muito bem implementado. Código limpo e bem organizado.',
        status: 'avaliado',
        visibilidade: 'publico',
        anonimo: false,
        aluno_nome: 'Aluno João',
        atividade_titulo: 'Trabalho de Programação Web',
        arquivos: [
            {
                nome: 'projeto-site.zip',
                tipo: 'zip',
                tamanho: '2.4 MB',
                url: '/arquivos/projeto-site.zip'
            }
        ],
        criado_em: new Date('2024-01-14T10:30:00').toISOString(),
        atualizado_em: new Date('2024-01-16T14:20:00').toISOString()
    },
    {
        id: 2,
        id_atividade: 2,
        id_aluno: 2,
        titulo: 'Prova de Banco de Dados - Respostas',
        conteudo: 'Respostas da prova teórica sobre modelagem ER e comandos SQL.',
        data_entrega: new Date('2024-01-18T14:00:00').toISOString(),
        nota: null,
        comentario_professor: null,
        status: 'entregue',
        visibilidade: 'privado',
        anonimo: false,
        aluno_nome: 'Aluno João',
        atividade_titulo: 'Prova de Banco de Dados',
        arquivos: [
            {
                nome: 'respostas-prova.pdf',
                tipo: 'pdf',
                tamanho: '1.2 MB',
                url: '/arquivos/respostas-prova.pdf'
            }
        ],
        criado_em: new Date('2024-01-18T13:45:00').toISOString(),
        atualizado_em: new Date('2024-01-18T13:45:00').toISOString()
    },
    {
        id: 3,
        id_atividade: 1,
        id_aluno: 3,
        titulo: 'Site Institucional - Empresa XYZ',
        conteudo: 'Desenvolvimento de site institucional para uma empresa fictícia, com páginas: Home, Sobre, Serviços e Contato.',
        data_entrega: new Date('2024-01-15T23:59:00').toISOString(),
        nota: 8.0,
        comentario_professor: 'Bom trabalho! Falta um pouco de responsividade em dispositivos móveis.',
        status: 'avaliado',
        visibilidade: 'turma',
        anonimo: false,
        aluno_nome: 'Aluna Maria',
        atividade_titulo: 'Trabalho de Programação Web',
        arquivos: [
            {
                nome: 'site-empresa-xyz.zip',
                tipo: 'zip',
                tamanho: '3.1 MB',
                url: '/arquivos/site-empresa-xyz.zip'
            }
        ],
        criado_em: new Date('2024-01-15T22:30:00').toISOString(),
        atualizado_em: new Date('2024-01-17T09:15:00').toISOString()
    }
];

let atividades = [
    {
        id: 1,
        titulo: 'Trabalho de Programação Web',
        descricao: 'Desenvolver um site responsivo usando HTML, CSS e JavaScript',
        tipo: 'trabalho',
        data_entrega: '2024-12-15T23:59:00',
        id_professor: 1,
        valor_maximo: 10.00,
        professor_nome: 'Professor Silva'
    },
    {
        id: 2,
        titulo: 'Prova de Banco de Dados',
        descricao: 'Prova teórica sobre modelagem ER e SQL',
        tipo: 'prova',
        data_entrega: '2024-12-20T14:00:00',
        id_professor: 1,
        valor_maximo: 8.00,
        professor_nome: 'Professor Silva'
    }
];

// =============================================
// MIDDLEWARE ESPECÍFICO PARA TRABALHOS
// =============================================

/**
 * Middleware para verificar se a atividade existe
 */
const validateAtividadeExists = (req, res, next) => {
    const { id_atividade } = req.body;
    
    if (!id_atividade) {
        return res.status(400).json({
            success: false,
            error: 'ID da atividade é obrigatório'
        });
    }

    const atividade = atividades.find(a => a.id === parseInt(id_atividade));
    if (!atividade) {
        return res.status(404).json({
            success: false,
            error: 'Atividade não encontrada'
        });
    }

    req.atividade = atividade;
    next();
};

/**
 * Middleware para verificar se o trabalho existe
 */
const validateTrabalhoExists = (req, res, next) => {
    const trabalhoId = parseInt(req.params.id);
    
    const trabalho = trabalhos.find(t => t.id === trabalhoId);
    if (!trabalho) {
        return res.status(404).json({
            success: false,
            error: 'Trabalho não encontrado'
        });
    }

    req.trabalho = trabalho;
    next();
};

/**
 * Middleware para verificar se o aluno já entregou a atividade
 */
const checkDuplicateEntrega = (req, res, next) => {
    const { id_atividade } = req.body;
    const userId = req.user.id;

    const trabalhoExistente = trabalhos.find(t => 
        t.id_atividade === parseInt(id_atividade) && t.id_aluno === userId
    );

    if (trabalhoExistente) {
        return res.status(400).json({
            success: false,
            error: 'Você já entregou esta atividade'
        });
    }

    next();
};

// =============================================
// ROTAS DE TRABALHOS
// =============================================

/**
 * @route   GET /api/trabalhos
 * @desc    Listar trabalhos do usuário
 * @access  Private
 */
router.get('/', 
    authenticateToken, 
    logAuthenticatedRequest,
    (req, res) => {
        try {
            console.log('📋 Buscando trabalhos para:', req.user.nome);
            
            let trabalhosFiltrados = [];
            
            if (req.user.tipo === 'aluno') {
                // Aluno vê apenas seus trabalhos
                trabalhosFiltrados = trabalhos.filter(t => t.id_aluno === req.user.id);
            } else if (req.user.tipo === 'professor') {
                // Professor vê trabalhos de suas atividades
                const minhasAtividades = atividades.filter(a => a.id_professor === req.user.id);
                const idsMinhasAtividades = minhasAtividades.map(a => a.id);
                trabalhosFiltrados = trabalhos.filter(t => idsMinhasAtividades.includes(t.id_atividade));
            } else if (req.user.tipo === 'admin') {
                // Admin vê todos os trabalhos
                trabalhosFiltrados = trabalhos;
            }

            // Ordenar por data de entrega (mais recentes primeiro)
            trabalhosFiltrados.sort((a, b) => new Date(b.data_entrega) - new Date(a.data_entrega));

            console.log(`✅ Retornando ${trabalhosFiltrados.length} trabalhos para ${req.user.nome}`);

            res.json({
                success: true,
                data: trabalhosFiltrados,
                meta: {
                    total: trabalhosFiltrados.length,
                    avaliados: trabalhosFiltrados.filter(t => t.status === 'avaliado').length,
                    pendentes: trabalhosFiltrados.filter(t => t.status === 'entregue').length
                }
            });

        } catch (error) {
            console.error('💥 Erro ao buscar trabalhos:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar trabalhos'
            });
        }
    }
);

/**
 * @route   GET /api/trabalhos/:id
 * @desc    Obter detalhes de um trabalho específico
 * @access  Private
 */
router.get('/:id',
    authenticateToken,
    validateTrabalhoExists,
    (req, res) => {
        try {
            const trabalho = req.trabalho;

            // Verificar permissões de acesso
            if (req.user.tipo === 'aluno' && trabalho.id_aluno !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode visualizar seus próprios trabalhos.'
                });
            }

            if (req.user.tipo === 'professor') {
                const atividade = atividades.find(a => a.id === trabalho.id_atividade);
                if (!atividade || atividade.id_professor !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        error: 'Acesso negado. Este trabalho não pertence às suas atividades.'
                    });
                }
            }

            console.log(`📄 Detalhes do trabalho ${trabalho.id} visualizados por ${req.user.nome}`);

            res.json({
                success: true,
                data: trabalho
            });

        } catch (error) {
            console.error('💥 Erro ao buscar detalhes do trabalho:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar detalhes do trabalho'
            });
        }
    }
);

/**
 * @route   POST /api/trabalhos
 * @desc    Entregar um novo trabalho
 * @access  Private (Apenas alunos)
 */
router.post('/',
    authenticateToken,
    requireAluno,
    validateAtividadeExists,
    checkDuplicateEntrega,
    (req, res) => {
        try {
            const { id_atividade, titulo, conteudo, visibilidade = 'privado', arquivos = [] } = req.body;
            
            console.log('📤 Entregando trabalho:', { 
                aluno: req.user.nome, 
                atividade: req.atividade.titulo,
                visibilidade 
            });

            // Validações
            if (!titulo || titulo.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Título do trabalho é obrigatório'
                });
            }

            if (!conteudo || conteudo.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Conteúdo do trabalho é obrigatório'
                });
            }

            if (titulo.length > 200) {
                return res.status(400).json({
                    success: false,
                    error: 'Título deve ter no máximo 200 caracteres'
                });
            }

            if (conteudo.length > 5000) {
                return res.status(400).json({
                    success: false,
                    error: 'Conteúdo deve ter no máximo 5000 caracteres'
                });
            }

            // Verificar se a data de entrega não passou
            const dataEntregaAtividade = new Date(req.atividade.data_entrega);
            const agora = new Date();
            
            if (agora > dataEntregaAtividade) {
                return res.status(400).json({
                    success: false,
                    error: 'Data de entrega da atividade já passou'
                });
            }

            // Criar novo trabalho
            const novoTrabalho = {
                id: trabalhos.length + 1,
                id_atividade: parseInt(id_atividade),
                id_aluno: req.user.id,
                titulo: titulo.trim(),
                conteudo: conteudo.trim(),
                data_entrega: new Date().toISOString(),
                nota: null,
                comentario_professor: null,
                status: 'entregue',
                visibilidade: visibilidade,
                anonimo: false,
                aluno_nome: req.user.nome,
                atividade_titulo: req.atividade.titulo,
                arquivos: arquivos,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString()
            };

            trabalhos.push(novoTrabalho);
            
            console.log(`✅ Trabalho entregue com sucesso: ${novoTrabalho.id} - "${novoTrabalho.titulo}"`);

            res.status(201).json({
                success: true,
                data: {
                    message: 'Trabalho entregue com sucesso!',
                    trabalho: novoTrabalho
                }
            });

        } catch (error) {
            console.error('💥 Erro ao entregar trabalho:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao entregar trabalho'
            });
        }
    }
);

/**
 * @route   PUT /api/trabalhos/:id
 * @desc    Atualizar um trabalho (apenas rascunho)
 * @access  Private (Apenas proprietário do trabalho)
 */
router.put('/:id',
    authenticateToken,
    requireAluno,
    validateTrabalhoExists,
    (req, res) => {
        try {
            const trabalho = req.trabalho;

            // Verificar se o trabalho pertence ao aluno
            if (trabalho.id_aluno !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode editar seus próprios trabalhos.'
                });
            }

            // Verificar se o trabalho ainda está como rascunho
            if (trabalho.status !== 'rascunho') {
                return res.status(400).json({
                    success: false,
                    error: 'Só é possível editar trabalhos no status "rascunho"'
                });
            }

            const { titulo, conteudo, visibilidade, arquivos } = req.body;

            // Atualizar campos permitidos
            if (titulo !== undefined) trabalho.titulo = titulo.trim();
            if (conteudo !== undefined) trabalho.conteudo = conteudo.trim();
            if (visibilidade !== undefined) trabalho.visibilidade = visibilidade;
            if (arquivos !== undefined) trabalho.arquivos = arquivos;
            
            trabalho.atualizado_em = new Date().toISOString();

            console.log(`✏️ Trabalho ${trabalho.id} atualizado por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Trabalho atualizado com sucesso!',
                    trabalho: trabalho
                }
            });

        } catch (error) {
            console.error('💥 Erro ao atualizar trabalho:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao atualizar trabalho'
            });
        }
    }
);

/**
 * @route   DELETE /api/trabalhos/:id
 * @desc    Excluir um trabalho (apenas rascunho)
 * @access  Private (Apenas proprietário do trabalho)
 */
router.delete('/:id',
    authenticateToken,
    requireAluno,
    validateTrabalhoExists,
    (req, res) => {
        try {
            const trabalho = req.trabalho;

            // Verificar se o trabalho pertence ao aluno
            if (trabalho.id_aluno !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode excluir seus próprios trabalhos.'
                });
            }

            // Verificar se o trabalho ainda está como rascunho
            if (trabalho.status !== 'rascunho') {
                return res.status(400).json({
                    success: false,
                    error: 'Só é possível excluir trabalhos no status "rascunho"'
                });
            }

            // Remover trabalho
            const index = trabalhos.findIndex(t => t.id === trabalho.id);
            if (index !== -1) {
                trabalhos.splice(index, 1);
            }

            console.log(`🗑️ Trabalho ${trabalho.id} excluído por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Trabalho excluído com sucesso!'
                }
            });

        } catch (error) {
            console.error('💥 Erro ao excluir trabalho:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao excluir trabalho'
            });
        }
    }
);

/**
 * @route   POST /api/trabalhos/:id/avaliar
 * @desc    Avaliar um trabalho (apenas professor)
 * @access  Private (Apenas professores)
 */
router.post('/:id/avaliar',
    authenticateToken,
    requireProfessor,
    validateTrabalhoExists,
    (req, res) => {
        try {
            const trabalho = req.trabalho;
            const { nota, comentario_professor } = req.body;

            // Verificar se o professor é o responsável pela atividade
            const atividade = atividades.find(a => a.id === trabalho.id_atividade);
            if (!atividade || atividade.id_professor !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você não é o professor responsável por esta atividade.'
                });
            }

            // Validações
            if (nota === undefined || nota === null) {
                return res.status(400).json({
                    success: false,
                    error: 'Nota é obrigatória'
                });
            }

            const notaNum = parseFloat(nota);
            if (isNaN(notaNum) || notaNum < 0 || notaNum > atividade.valor_maximo) {
                return res.status(400).json({
                    success: false,
                    error: `Nota deve ser um número entre 0 e ${atividade.valor_maximo}`
                });
            }

            // Atualizar avaliação
            trabalho.nota = notaNum;
            trabalho.comentario_professor = comentario_professor?.trim() || '';
            trabalho.status = 'avaliado';
            trabalho.atualizado_em = new Date().toISOString();

            console.log(`📊 Trabalho ${trabalho.id} avaliado por ${req.user.nome}. Nota: ${nota}`);

            res.json({
                success: true,
                data: {
                    message: 'Trabalho avaliado com sucesso!',
                    trabalho: trabalho
                }
            });

        } catch (error) {
            console.error('💥 Erro ao avaliar trabalho:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao avaliar trabalho'
            });
        }
    }
);

/**
 * @route   GET /api/trabalhos/atividade/:atividadeId
 * @desc    Listar trabalhos de uma atividade específica
 * @access  Private (Professor da atividade ou Admin)
 */
router.get('/atividade/:atividadeId',
    authenticateToken,
    requireProfessor,
    (req, res) => {
        try {
            const atividadeId = parseInt(req.params.atividadeId);
            
            // Verificar se a atividade existe e pertence ao professor
            const atividade = atividades.find(a => a.id === atividadeId);
            if (!atividade) {
                return res.status(404).json({
                    success: false,
                    error: 'Atividade não encontrada'
                });
            }

            if (atividade.id_professor !== req.user.id && req.user.tipo !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você não é o professor responsável por esta atividade.'
                });
            }

            // Buscar trabalhos da atividade
            const trabalhosAtividade = trabalhos.filter(t => t.id_atividade === atividadeId);
            
            // Estatísticas
            const totalTrabalhos = trabalhosAtividade.length;
            const trabalhosAvaliados = trabalhosAtividade.filter(t => t.status === 'avaliado').length;
            const trabalhosPendentes = trabalhosAtividade.filter(t => t.status === 'entregue').length;
            const mediaNotas = trabalhosAvaliados > 0 
                ? trabalhosAvaliados.reduce((acc, t) => acc + t.nota, 0) / trabalhosAvaliados 
                : 0;

            console.log(`📊 Professor ${req.user.nome} visualizou trabalhos da atividade ${atividadeId}`);

            res.json({
                success: true,
                data: {
                    atividade: atividade,
                    trabalhos: trabalhosAtividade,
                    estatisticas: {
                        total: totalTrabalhos,
                        avaliados: trabalhosAvaliados,
                        pendentes: trabalhosPendentes,
                        media_notas: parseFloat(mediaNotas.toFixed(2))
                    }
                }
            });

        } catch (error) {
            console.error('💥 Erro ao buscar trabalhos da atividade:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar trabalhos da atividade'
            });
        }
    }
);

/**
 * @route   GET /api/trabalhos/estatisticas/aluno
 * @desc    Obter estatísticas dos trabalhos do aluno
 * @access  Private (Apenas alunos)
 */
router.get('/estatisticas/aluno',
    authenticateToken,
    requireAluno,
    (req, res) => {
        try {
            const userTrabalhos = trabalhos.filter(t => t.id_aluno === req.user.id);
            const trabalhosAvaliados = userTrabalhos.filter(t => t.status === 'avaliado');
            const trabalhosPendentes = userTrabalhos.filter(t => t.status === 'entregue');

            const mediaNotas = trabalhosAvaliados.length > 0
                ? trabalhosAvaliados.reduce((acc, t) => acc + t.nota, 0) / trabalhosAvaliados.length
                : 0;

            const estatisticas = {
                total_trabalhos: userTrabalhos.length,
                trabalhos_avaliados: trabalhosAvaliados.length,
                trabalhos_pendentes: trabalhosPendentes.length,
                media_geral: parseFloat(mediaNotas.toFixed(2)),
                melhor_nota: trabalhosAvaliados.length > 0 ? Math.max(...trabalhosAvaliados.map(t => t.nota)) : 0,
                pior_nota: trabalhosAvaliados.length > 0 ? Math.min(...trabalhosAvaliados.map(t => t.nota)) : 0
            };

            console.log(`📈 Estatísticas do aluno ${req.user.nome} geradas`);

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

export default router;
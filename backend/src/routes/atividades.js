import express from 'express';
import { 
    authenticateToken, 
    requireProfessor,
    requireActiveUser,
    logAuthenticatedRequest 
} from '../middleware/auth.js';

const router = express.Router();

// Dados mock para atividades
let atividades = [
    {
        id: 1,
        titulo: 'Trabalho de Programação Web',
        descricao: 'Desenvolver um site responsivo usando HTML, CSS e JavaScript. O tema é livre, mas deve conter pelo menos 3 páginas com navegação entre elas.',
        tipo: 'trabalho',
        data_criacao: new Date('2024-01-10').toISOString(),
        data_entrega: '2024-12-15T23:59:00',
        id_professor: 1,
        valor_maximo: 10.00,
        instrucoes: 'Entregar o código fonte em ZIP e o link do GitHub. Incluir README com instruções de execução.',
        anexos_permitidos: true,
        professor_nome: 'Professor Silva',
        disciplina: 'Programação Web',
        tags: ['html', 'css', 'javascript', 'responsivo'],
        status: 'ativa'
    },
    {
        id: 2,
        titulo: 'Prova de Banco de Dados',
        descricao: 'Prova teórica sobre modelagem ER, normalização e comandos SQL avançados.',
        tipo: 'prova',
        data_criacao: new Date('2024-01-12').toISOString(),
        data_entrega: '2024-12-20T14:00:00',
        id_professor: 1,
        valor_maximo: 8.00,
        instrucoes: 'Prova individual, sem consulta. Responder todas as questões no papel.',
        anexos_permitidos: false,
        professor_nome: 'Professor Silva',
        disciplina: 'Banco de Dados',
        tags: ['sql', 'modelagem', 'normalização'],
        status: 'ativa'
    },
    {
        id: 3,
        titulo: 'Projeto de Sistema Acadêmico',
        descricao: 'Em grupo, desenvolver um sistema completo de gestão acadêmica com cadastro de alunos, professores e disciplinas.',
        tipo: 'projeto',
        data_criacao: new Date('2024-01-15').toISOString(),
        data_entrega: '2024-12-25T23:59:00',
        id_professor: 1,
        valor_maximo: 15.00,
        instrucoes: 'Trabalho em grupo de 3-4 pessoas. Entregar documentação e código. Apresentação obrigatória.',
        anexos_permitidos: true,
        professor_nome: 'Professor Silva',
        disciplina: 'Desenvolvimento de Sistemas',
        tags: ['projeto', 'grupo', 'sistema', 'documentação'],
        status: 'ativa'
    },
    {
        id: 4,
        titulo: 'Exercícios de Lógica de Programação',
        descricao: 'Lista de exercícios para praticar lógica de programação com JavaScript.',
        tipo: 'exercicio',
        data_criacao: new Date('2024-01-08').toISOString(),
        data_entrega: '2024-12-18T23:59:00',
        id_professor: 1,
        valor_maximo: 5.00,
        instrucoes: 'Resolver os 10 exercícios propostos. Entregar arquivo .js com as soluções.',
        anexos_permitidos: true,
        professor_nome: 'Professor Silva',
        disciplina: 'Algoritmos',
        tags: ['javascript', 'lógica', 'exercícios'],
        status: 'ativa'
    }
];

// Dados mock para trabalhos (para estatísticas)
let trabalhos = [
    {
        id: 1,
        id_atividade: 1,
        id_aluno: 2,
        status: 'avaliado',
        nota: 9.5
    },
    {
        id: 2,
        id_atividade: 1,
        id_aluno: 3,
        status: 'avaliado',
        nota: 8.0
    },
    {
        id: 3,
        id_atividade: 2,
        id_aluno: 2,
        status: 'entregue',
        nota: null
    }
];

// =============================================
// MIDDLEWARE ESPECÍFICO PARA ATIVIDADES
// =============================================

/**
 * Middleware para validar dados de atividade
 */
const validateAtividadeData = (req, res, next) => {
    const { titulo, data_entrega, valor_maximo } = req.body;

    if (!titulo || titulo.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Título da atividade é obrigatório'
        });
    }

    if (!data_entrega) {
        return res.status(400).json({
            success: false,
            error: 'Data de entrega é obrigatória'
        });
    }

    // Verificar se a data é futura
    const dataEntrega = new Date(data_entrega);
    if (dataEntrega <= new Date()) {
        return res.status(400).json({
            success: false,
            error: 'Data de entrega deve ser futura'
        });
    }

    if (!valor_maximo || parseFloat(valor_maximo) <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Valor máximo deve ser maior que zero'
        });
    }

    if (titulo.length > 200) {
        return res.status(400).json({
            success: false,
            error: 'Título deve ter no máximo 200 caracteres'
        });
    }

    next();
};

/**
 * Middleware para verificar se atividade existe
 */
const validateAtividadeExists = (req, res, next) => {
    const atividadeId = parseInt(req.params.id);
    
    const atividade = atividades.find(a => a.id === atividadeId && a.status === 'ativa');
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
 * Middleware para verificar se usuário é o professor da atividade
 */
const validateAtividadeOwnership = (req, res, next) => {
    const atividade = req.atividade;

    if (atividade.id_professor !== req.user.id && req.user.tipo !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado. Você não é o professor responsável por esta atividade.'
        });
    }

    next();
};

// =============================================
// ROTAS DE ATIVIDADES
// =============================================

/**
 * @route   GET /api/atividades
 * @desc    Listar atividades
 * @access  Private
 */
router.get('/',
    authenticateToken,
    requireActiveUser,
    logAuthenticatedRequest,
    (req, res) => {
        try {
            console.log('📚 Buscando atividades para:', req.user.nome);
            
            let atividadesFiltradas = atividades.filter(a => a.status === 'ativa');
            
            // Para alunos, mostrar todas as atividades ativas
            // Para professores, mostrar apenas suas atividades
            if (req.user.tipo === 'professor') {
                atividadesFiltradas = atividadesFiltradas.filter(a => a.id_professor === req.user.id);
            }

            // Ordenar por data de entrega (mais próximas primeiro)
            atividadesFiltradas.sort((a, b) => new Date(a.data_entrega) - new Date(b.data_entrega));

            console.log(`✅ Retornando ${atividadesFiltradas.length} atividades para ${req.user.nome}`);

            res.json({
                success: true,
                data: atividadesFiltradas,
                meta: {
                    total: atividadesFiltradas.length,
                    proximas_entrega: atividadesFiltradas.filter(a => 
                        new Date(a.data_entrega) > new Date()
                    ).length,
                    atrasadas: atividadesFiltradas.filter(a => 
                        new Date(a.data_entrega) < new Date()
                    ).length
                }
            });

        } catch (error) {
            console.error('💥 Erro ao buscar atividades:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar atividades'
            });
        }
    }
);

/**
 * @route   GET /api/atividades/:id
 * @desc    Obter detalhes de uma atividade específica
 * @access  Private
 */
router.get('/:id',
    authenticateToken,
    requireActiveUser,
    validateAtividadeExists,
    (req, res) => {
        try {
            const atividade = req.atividade;

            // Verificar permissões
            if (req.user.tipo === 'professor' && atividade.id_professor !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Esta atividade não pertence a você.'
                });
            }

            // Buscar estatísticas de trabalhos para esta atividade
            const trabalhosAtividade = trabalhos.filter(t => t.id_atividade === atividade.id);
            const estatisticas = {
                total_trabalhos: trabalhosAtividade.length,
                trabalhos_entregues: trabalhosAtividade.filter(t => t.status === 'entregue' || t.status === 'avaliado').length,
                trabalhos_avaliados: trabalhosAtividade.filter(t => t.status === 'avaliado').length,
                media_notas: trabalhosAtividade.filter(t => t.nota).length > 0 ?
                    trabalhosAtividade.filter(t => t.nota)
                        .reduce((acc, t) => acc + t.nota, 0) / trabalhosAtividade.filter(t => t.nota).length : 0
            };

            console.log(`📄 Detalhes da atividade ${atividade.id} visualizados por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    ...atividade,
                    estatisticas: estatisticas
                }
            });

        } catch (error) {
            console.error('💥 Erro ao buscar detalhes da atividade:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar detalhes da atividade'
            });
        }
    }
);

/**
 * @route   POST /api/atividades
 * @desc    Criar nova atividade (apenas professores)
 * @access  Private (Professores)
 */
router.post('/',
    authenticateToken,
    requireProfessor,
    requireActiveUser,
    validateAtividadeData,
    (req, res) => {
        try {
            const { titulo, descricao, tipo, data_entrega, valor_maximo, instrucoes, disciplina, tags } = req.body;
            
            console.log('📝 Criando nova atividade:', { professor: req.user.nome, titulo });

            // Criar nova atividade
            const novaAtividade = {
                id: atividades.length + 1,
                titulo: titulo.trim(),
                descricao: descricao?.trim() || '',
                tipo: tipo || 'trabalho',
                data_criacao: new Date().toISOString(),
                data_entrega: data_entrega,
                id_professor: req.user.id,
                valor_maximo: parseFloat(valor_maximo) || 10.00,
                instrucoes: instrucoes?.trim() || '',
                anexos_permitidos: true,
                professor_nome: req.user.nome,
                disciplina: disciplina?.trim() || 'Geral',
                tags: tags || [],
                status: 'ativa'
            };

            atividades.push(novaAtividade);
            
            console.log(`✅ Atividade criada com sucesso: ${novaAtividade.id} - "${novaAtividade.titulo}"`);

            res.status(201).json({
                success: true,
                data: {
                    message: 'Atividade criada com sucesso!',
                    atividade: novaAtividade
                }
            });

        } catch (error) {
            console.error('💥 Erro ao criar atividade:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao criar atividade'
            });
        }
    }
);

/**
 * @route   PUT /api/atividades/:id
 * @desc    Atualizar atividade (apenas professor responsável)
 * @access  Private (Professores)
 */
router.put('/:id',
    authenticateToken,
    requireProfessor,
    requireActiveUser,
    validateAtividadeExists,
    validateAtividadeOwnership,
    (req, res) => {
        try {
            const atividade = req.atividade;
            const { titulo, descricao, tipo, data_entrega, valor_maximo, instrucoes, disciplina, tags } = req.body;

            // Atualizar campos permitidos
            if (titulo !== undefined) atividade.titulo = titulo.trim();
            if (descricao !== undefined) atividade.descricao = descricao?.trim() || '';
            if (tipo !== undefined) atividade.tipo = tipo;
            if (data_entrega !== undefined) atividade.data_entrega = data_entrega;
            if (valor_maximo !== undefined) atividade.valor_maximo = parseFloat(valor_maximo);
            if (instrucoes !== undefined) atividade.instrucoes = instrucoes?.trim() || '';
            if (disciplina !== undefined) atividade.disciplina = disciplina?.trim() || 'Geral';
            if (tags !== undefined) atividade.tags = tags;

            console.log(`✏️ Atividade ${atividade.id} atualizada por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Atividade atualizada com sucesso!',
                    atividade: atividade
                }
            });

        } catch (error) {
            console.error('💥 Erro ao atualizar atividade:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao atualizar atividade'
            });
        }
    }
);

/**
 * @route   DELETE /api/atividades/:id
 * @desc    Excluir/desativar atividade (apenas professor responsável)
 * @access  Private (Professores)
 */
router.delete('/:id',
    authenticateToken,
    requireProfessor,
    requireActiveUser,
    validateAtividadeExists,
    validateAtividadeOwnership,
    (req, res) => {
        try {
            const atividade = req.atividade;

            // Soft delete - marcar como inativa
            atividade.status = 'inativa';

            console.log(`🗑️ Atividade ${atividade.id} desativada por ${req.user.nome}`);

            res.json({
                success: true,
                data: {
                    message: 'Atividade excluída com sucesso!'
                }
            });

        } catch (error) {
            console.error('💥 Erro ao excluir atividade:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao excluir atividade'
            });
        }
    }
);

/**
 * @route   GET /api/atividades/professor/estatisticas
 * @desc    Obter estatísticas das atividades do professor
 * @access  Private (Professores)
 */
router.get('/professor/estatisticas',
    authenticateToken,
    requireProfessor,
    requireActiveUser,
    (req, res) => {
        try {
            const minhasAtividades = atividades.filter(a => 
                a.id_professor === req.user.id && a.status === 'ativa'
            );

            const estatisticas = {
                total_atividades: minhasAtividades.length,
                atividades_por_tipo: {
                    trabalho: minhasAtividades.filter(a => a.tipo === 'trabalho').length,
                    prova: minhasAtividades.filter(a => a.tipo === 'prova').length,
                    projeto: minhasAtividades.filter(a => a.tipo === 'projeto').length,
                    exercicio: minhasAtividades.filter(a => a.tipo === 'exercicio').length
                },
                proximas_entregas: minhasAtividades
                    .filter(a => new Date(a.data_entrega) > new Date())
                    .sort((a, b) => new Date(a.data_entrega) - new Date(b.data_entrega))
                    .slice(0, 5)
                    .map(a => ({
                        id: a.id,
                        titulo: a.titulo,
                        data_entrega: a.data_entrega,
                        dias_restantes: Math.ceil((new Date(a.data_entrega) - new Date()) / (1000 * 60 * 60 * 24))
                    })),
                atividades_sem_trabalhos: minhasAtividades.filter(a => {
                    const trabalhosAtividade = trabalhos.filter(t => t.id_atividade === a.id);
                    return trabalhosAtividade.length === 0;
                }).length
            };

            console.log(`📊 Estatísticas do professor ${req.user.nome} geradas`);

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
 * @route   GET /api/atividades/aluno/pendentes
 * @desc    Obter atividades pendentes do aluno
 * @access  Private (Alunos)
 */
router.get('/aluno/pendentes',
    authenticateToken,
    requireActiveUser,
    (req, res) => {
        try {
            // Atividades ativas com data futura
            const atividadesPendentes = atividades
                .filter(a => a.status === 'ativa' && new Date(a.data_entrega) > new Date())
                .sort((a, b) => new Date(a.data_entrega) - new Date(b.data_entrega));

            // Verificar quais atividades já foram entregues
            const atividadesComStatus = atividadesPendentes.map(atividade => {
                const trabalhoEntregue = trabalhos.some(t => 
                    t.id_atividade === atividade.id && t.id_aluno === req.user.id
                );

                const diasRestantes = Math.ceil((new Date(atividade.data_entrega) - new Date()) / (1000 * 60 * 60 * 24));

                return {
                    ...atividade,
                    entregue: trabalhoEntregue,
                    dias_restantes: diasRestantes,
                    prioridade: diasRestantes <= 3 ? 'alta' : diasRestantes <= 7 ? 'media' : 'baixa'
                };
            });

            console.log(`📋 Atividades pendentes do aluno ${req.user.nome}: ${atividadesComStatus.length}`);

            res.json({
                success: true,
                data: atividadesComStatus
            });

        } catch (error) {
            console.error('💥 Erro ao buscar atividades pendentes:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar atividades pendentes'
            });
        }
    }
);

export default router;
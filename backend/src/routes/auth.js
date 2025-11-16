import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
    generateToken, 
    hashPassword, 
    comparePassword,
    authenticateToken,
    requireActiveUser,
    logAuthenticatedRequest 
} from '../middleware/auth.js';

const router = express.Router();

// Dados mock de usuários (em produção, viriam do banco de dados)
let usuarios = [
    {
        id: 1,
        nome: 'Professor Silva',
        email: 'prof.silva@email.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'professor',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-01T10:00:00').toISOString(),
        ultimo_acesso: new Date('2024-01-15T14:30:00').toISOString()
    },
    {
        id: 2,
        nome: 'Aluno João',
        email: 'joao@email.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'aluno',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-02T09:00:00').toISOString(),
        ultimo_acesso: new Date('2024-01-15T16:45:00').toISOString()
    },
    {
        id: 3,
        nome: 'Aluna Maria',
        email: 'maria@email.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'aluno',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-03T11:30:00').toISOString(),
        ultimo_acesso: new Date('2024-01-15T18:20:00').toISOString()
    },
    {
        id: 4,
        nome: 'Administrador Sistema',
        email: 'admin@bytewave.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'admin',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-01T08:00:00').toISOString(),
        ultimo_acesso: new Date('2024-01-15T20:15:00').toISOString()
    }
];

// =============================================
// MIDDLEWARE ESPECÍFICO PARA AUTH
// =============================================

/**
 * Middleware para validar dados de registro
 */
const validateRegisterData = (req, res, next) => {
    const { nome, email, senha, tipo } = req.body;

    // Validações básicas
    if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({
            success: false,
            error: 'Todos os campos são obrigatórios: nome, email, senha, tipo'
        });
    }

    if (nome.trim().length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Nome deve ter pelo menos 2 caracteres'
        });
    }

    if (senha.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Senha deve ter pelo menos 6 caracteres'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Email inválido'
        });
    }

    if (!['aluno', 'professor'].includes(tipo)) {
        return res.status(400).json({
            success: false,
            error: 'Tipo de usuário deve ser "aluno" ou "professor"'
        });
    }

    next();
};

/**
 * Middleware para validar dados de login
 */
const validateLoginData = (req, res, next) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            success: false,
            error: 'Email e senha são obrigatórios'
        });
    }

    next();
};

/**
 * Middleware para verificar se email já existe
 */
const checkEmailExists = (req, res, next) => {
    const { email } = req.body;

    const usuarioExistente = usuarios.find(u => u.email === email.toLowerCase());
    if (usuarioExistente) {
        return res.status(400).json({
            success: false,
            error: 'Email já cadastrado'
        });
    }

    next();
};

// =============================================
// ROTAS DE AUTENTICAÇÃO
// =============================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post('/register',
    validateRegisterData,
    checkEmailExists,
    async (req, res) => {
        try {
            const { nome, email, senha, tipo } = req.body;
            
            console.log('📝 Tentativa de registro:', { nome, email, tipo });

            // Hash da senha
            const hashedPassword = await hashPassword(senha);

            // Criar novo usuário
            const novoUsuario = {
                id: usuarios.length + 1,
                nome: nome.trim(),
                email: email.toLowerCase().trim(),
                senha: hashedPassword,
                tipo: tipo,
                ativo: true,
                foto_url: null,
                criado_em: new Date().toISOString(),
                ultimo_acesso: new Date().toISOString()
            };

            usuarios.push(novoUsuario);
            console.log('✅ Novo usuário criado:', novoUsuario.id, novoUsuario.nome);

            // Gerar token JWT
            const token = generateToken(novoUsuario);

            // Remover senha do response
            const { senha: _, ...usuarioSemSenha } = novoUsuario;

            res.status(201).json({
                success: true,
                data: {
                    message: 'Usuário criado com sucesso!',
                    token,
                    user: usuarioSemSenha
                }
            });

        } catch (error) {
            console.error('💥 Erro no registro:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login',
    validateLoginData,
    async (req, res) => {
        try {
            const { email, senha } = req.body;
            
            console.log('🔐 Tentativa de login:', email);

            // Buscar usuário
            const usuario = usuarios.find(u => 
                u.email === email.toLowerCase() && u.ativo === true
            );
            
            if (!usuario) {
                console.log('❌ Usuário não encontrado:', email);
                return res.status(401).json({
                    success: false,
                    error: 'Credenciais inválidas'
                });
            }

            // Verificar senha
            const validPassword = await comparePassword(senha, usuario.senha);
            
            if (!validPassword) {
                console.log('❌ Senha incorreta para:', email);
                return res.status(401).json({
                    success: false,
                    error: 'Credenciais inválidas'
                });
            }

            // Atualizar último acesso
            usuario.ultimo_acesso = new Date().toISOString();

            // Gerar token JWT
            const token = generateToken(usuario);

            // Remover senha do response
            const { senha: _, ...usuarioSemSenha } = usuario;

            console.log('✅ Login bem-sucedido:', usuario.nome);

            res.json({
                success: true,
                data: {
                    message: 'Login realizado com sucesso!',
                    token,
                    user: usuarioSemSenha
                }
            });

        } catch (error) {
            console.error('💥 Erro no login:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout do usuário (invalidação do token no frontend)
 * @access  Private
 */
router.post('/logout',
    authenticateToken,
    logAuthenticatedRequest,
    (req, res) => {
        try {
            console.log('🚪 Logout realizado por:', req.user.nome);

            // Em uma implementação real, você poderia adicionar o token a uma blacklist
            // Por enquanto, o logout é gerenciado no frontend removendo o token

            res.json({
                success: true,
                data: {
                    message: 'Logout realizado com sucesso!'
                }
            });

        } catch (error) {
            console.error('💥 Erro no logout:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }
);

/**
 * @route   GET /api/auth/me
 * @desc    Obter informações do usuário atual
 * @access  Private
 */
router.get('/me',
    authenticateToken,
    requireActiveUser,
    logAuthenticatedRequest,
    (req, res) => {
        try {
            const usuario = usuarios.find(u => u.id === req.user.id && u.ativo);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Remover senha do response
            const { senha: _, ...usuarioSemSenha } = usuario;

            console.log('👤 Dados do usuário solicitados por:', usuario.nome);

            res.json({
                success: true,
                data: usuarioSemSenha
            });

        } catch (error) {
            console.error('💥 Erro ao buscar dados do usuário:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar dados do usuário'
            });
        }
    }
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Private
 */
router.put('/profile',
    authenticateToken,
    requireActiveUser,
    async (req, res) => {
        try {
            const { nome, foto_url } = req.body;
            const usuario = usuarios.find(u => u.id === req.user.id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Atualizar campos permitidos
            if (nome !== undefined && nome.trim().length >= 2) {
                usuario.nome = nome.trim();
            }

            if (foto_url !== undefined) {
                usuario.foto_url = foto_url;
            }

            usuario.atualizado_em = new Date().toISOString();

            // Remover senha do response
            const { senha: _, ...usuarioSemSenha } = usuario;

            console.log('✏️ Perfil atualizado por:', usuario.nome);

            res.json({
                success: true,
                data: {
                    message: 'Perfil atualizado com sucesso!',
                    user: usuarioSemSenha
                }
            });

        } catch (error) {
            console.error('💥 Erro ao atualizar perfil:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao atualizar perfil'
            });
        }
    }
);

/**
 * @route   PUT /api/auth/password
 * @desc    Alterar senha do usuário
 * @access  Private
 */
router.put('/password',
    authenticateToken,
    requireActiveUser,
    async (req, res) => {
        try {
            const { senha_atual, nova_senha } = req.body;
            const usuario = usuarios.find(u => u.id === req.user.id);

            if (!senha_atual || !nova_senha) {
                return res.status(400).json({
                    success: false,
                    error: 'Senha atual e nova senha são obrigatórias'
                });
            }

            if (nova_senha.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Nova senha deve ter pelo menos 6 caracteres'
                });
            }

            // Verificar senha atual
            const validPassword = await comparePassword(senha_atual, usuario.senha);
            if (!validPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Senha atual incorreta'
                });
            }

            // Atualizar senha
            usuario.senha = await hashPassword(nova_senha);
            usuario.atualizado_em = new Date().toISOString();

            console.log('🔑 Senha alterada por:', usuario.nome);

            res.json({
                success: true,
                data: {
                    message: 'Senha alterada com sucesso!'
                }
            });

        } catch (error) {
            console.error('💥 Erro ao alterar senha:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao alterar senha'
            });
        }
    }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh token (renovar token expirado)
 * @access  Private
 */
router.post('/refresh',
    authenticateToken,
    requireActiveUser,
    (req, res) => {
        try {
            const usuario = usuarios.find(u => u.id === req.user.id && u.ativo);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Gerar novo token
            const newToken = generateToken(usuario);

            // Remover senha do response
            const { senha: _, ...usuarioSemSenha } = usuario;

            console.log('🔄 Token renovado para:', usuario.nome);

            res.json({
                success: true,
                data: {
                    message: 'Token renovado com sucesso!',
                    token: newToken,
                    user: usuarioSemSenha
                }
            });

        } catch (error) {
            console.error('💥 Erro ao renovar token:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao renovar token'
            });
        }
    }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperação de senha
 * @access  Public
 */
router.post('/forgot-password',
    (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email é obrigatório'
                });
            }

            const usuario = usuarios.find(u => u.email === email.toLowerCase() && u.ativo);
            
            if (!usuario) {
                // Por segurança, não revelar se o email existe ou não
                console.log('📧 Solicitação de recuperação de senha para email não cadastrado:', email);
                return res.json({
                    success: true,
                    data: {
                        message: 'Se o email estiver cadastrado, você receberá instruções para recuperação de senha.'
                    }
                });
            }

            // Em produção, aqui você enviaria um email com link de recuperação
            // Por enquanto, apenas logamos a solicitação
            console.log('📧 Solicitação de recuperação de senha para:', usuario.email);

            // Gerar token de recuperação (válido por 1 hora)
            const resetToken = jwt.sign(
                { id: usuario.id, email: usuario.email, action: 'password_reset' },
                process.env.JWT_SECRET || 'bytewave_super_secret_key_2024',
                { expiresIn: '1h' }
            );

            // Em produção, enviar email com link: /reset-password?token=${resetToken}
            console.log('🔐 Token de recuperação gerado (simulação):', resetToken.substring(0, 20) + '...');

            res.json({
                success: true,
                data: {
                    message: 'Se o email estiver cadastrado, você receberá instruções para recuperação de senha.',
                    // Em desenvolvimento, retornamos o token para testes
                    reset_token: process.env.NODE_ENV === 'development' ? resetToken : undefined
                }
            });

        } catch (error) {
            console.error('💥 Erro na recuperação de senha:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno na recuperação de senha'
            });
        }
    }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Redefinir senha com token
 * @access  Public
 */
router.post('/reset-password',
    async (req, res) => {
        try {
            const { token, nova_senha } = req.body;

            if (!token || !nova_senha) {
                return res.status(400).json({
                    success: false,
                    error: 'Token e nova senha são obrigatórios'
                });
            }

            if (nova_senha.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Nova senha deve ter pelo menos 6 caracteres'
                });
            }

            // Verificar token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET || 'bytewave_super_secret_key_2024');
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Token inválido ou expirado'
                });
            }

            // Verificar se é um token de recuperação
            if (decoded.action !== 'password_reset') {
                return res.status(400).json({
                    success: false,
                    error: 'Token inválido'
                });
            }

            // Buscar usuário
            const usuario = usuarios.find(u => u.id === decoded.id && u.email === decoded.email && u.ativo);
            if (!usuario) {
                return res.status(400).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Atualizar senha
            usuario.senha = await hashPassword(nova_senha);
            usuario.atualizado_em = new Date().toISOString();

            console.log('🔑 Senha redefinida via recuperação para:', usuario.email);

            res.json({
                success: true,
                data: {
                    message: 'Senha redefinida com sucesso!'
                }
            });

        } catch (error) {
            console.error('💥 Erro ao redefinir senha:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao redefinir senha'
            });
        }
    }
);

/**
 * @route   GET /api/auth/stats
 * @desc    Obter estatísticas de usuários (apenas admin)
 * @access  Private (Admin)
 */
router.get('/stats',
    authenticateToken,
    requireActiveUser,
    (req, res) => {
        try {
            // Verificar se é admin
            if (req.user.tipo !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso permitido apenas para administradores'
                });
            }

            const stats = {
                total_usuarios: usuarios.length,
                usuarios_ativos: usuarios.filter(u => u.ativo).length,
                por_tipo: {
                    alunos: usuarios.filter(u => u.tipo === 'aluno').length,
                    professores: usuarios.filter(u => u.tipo === 'professor').length,
                    admins: usuarios.filter(u => u.tipo === 'admin').length
                },
                novos_usuarios_30_dias: usuarios.filter(u => {
                    const criado = new Date(u.criado_em);
                    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    return criado > trintaDiasAtras;
                }).length
            };

            console.log('📊 Estatísticas de usuários solicitadas por admin:', req.user.nome);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('💥 Erro ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar estatísticas'
            });
        }
    }
);

/**
 * @route   GET /api/auth/validate
 * @desc    Validar token (usado pelo frontend para verificar se o token ainda é válido)
 * @access  Private
 */
router.get('/validate',
    authenticateToken,
    requireActiveUser,
    (req, res) => {
        try {
            res.json({
                success: true,
                data: {
                    valid: true,
                    user: req.user
                }
            });

        } catch (error) {
            console.error('💥 Erro na validação do token:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno na validação do token'
            });
        }
    }
);

export default router;
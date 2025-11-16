import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'bytewave_super_secret_key_2024';

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona o usuário à requisição
 */
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        console.log('🔐 Verificando autenticação...');
        
        if (!token) {
            console.log('❌ Token não fornecido');
            return res.status(401).json({
                success: false,
                error: 'Token de acesso necessário'
            });
        }

        // Verificar token
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('❌ Token inválido:', err.message);
                
                let errorMessage = 'Token inválido';
                if (err.name === 'TokenExpiredError') {
                    errorMessage = 'Token expirado';
                } else if (err.name === 'JsonWebTokenError') {
                    errorMessage = 'Token malformado';
                }

                return res.status(403).json({
                    success: false,
                    error: errorMessage
                });
            }

            // Token válido - adicionar usuário à requisição
            req.user = decoded;
            console.log(`✅ Usuário autenticado: ${decoded.nome} (${decoded.tipo})`);
            
            next();
        });

    } catch (error) {
        console.error('💥 Erro no middleware de autenticação:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno na autenticação'
        });
    }
};

/**
 * Middleware para verificar permissões de professor/admin
 */
export const requireProfessor = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        if (req.user.tipo !== 'professor' && req.user.tipo !== 'admin') {
            console.log(`❌ Acesso negado: ${req.user.nome} tentou acessar recurso de professor`);
            return res.status(403).json({
                success: false,
                error: 'Acesso permitido apenas para professores'
            });
        }

        console.log(`✅ Acesso de professor permitido para: ${req.user.nome}`);
        next();

    } catch (error) {
        console.error('💥 Erro na verificação de professor:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno na verificação de permissões'
        });
    }
};

/**
 * Middleware para verificar permissões de aluno
 */
export const requireAluno = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        if (req.user.tipo !== 'aluno') {
            console.log(`❌ Acesso negado: ${req.user.nome} tentou acessar recurso de aluno`);
            return res.status(403).json({
                success: false,
                error: 'Acesso permitido apenas para alunos'
            });
        }

        console.log(`✅ Acesso de aluno permitido para: ${req.user.nome}`);
        next();

    } catch (error) {
        console.error('💥 Erro na verificação de aluno:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno na verificação de permissões'
        });
    }
};

/**
 * Middleware para verificar permissões de admin
 */
export const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        if (req.user.tipo !== 'admin') {
            console.log(`❌ Acesso negado: ${req.user.nome} tentou acessar recurso de admin`);
            return res.status(403).json({
                success: false,
                error: 'Acesso permitido apenas para administradores'
            });
        }

        console.log(`✅ Acesso de admin permitido para: ${req.user.nome}`);
        next();

    } catch (error) {
        console.error('💥 Erro na verificação de admin:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno na verificação de permissões'
        });
    }
};

/**
 * Middleware para verificar se o usuário é o proprietário do recurso ou admin
 */
export const requireOwnershipOrAdmin = (resourceKey = 'id_usuario') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuário não autenticado'
                });
            }

            // Admin tem acesso total
            if (req.user.tipo === 'admin') {
                return next();
            }

            // Verificar se o usuário é o proprietário do recurso
            const resourceUserId = req.params[resourceKey] || req.body[resourceKey];
            
            if (!resourceUserId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do recurso não especificado'
                });
            }

            if (parseInt(resourceUserId) !== req.user.id) {
                console.log(`❌ Acesso negado: ${req.user.nome} tentou acessar recurso de outro usuário`);
                return res.status(403).json({
                    success: false,
                    error: 'Acesso permitido apenas ao proprietário do recurso'
                });
            }

            console.log(`✅ Acesso de proprietário permitido para: ${req.user.nome}`);
            next();

        } catch (error) {
            console.error('💥 Erro na verificação de propriedade:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno na verificação de propriedade'
            });
        }
    };
};

/**
 * Gerador de token JWT
 */
export const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        nome: user.nome,
        tipo: user.tipo,
        ativo: user.ativo
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'bytewave-api',
        subject: user.id.toString()
    });
};

/**
 * Validador de token (para uso em outras partes do sistema)
 */
export const validateToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error(`Token inválido: ${error.message}`);
    }
};

/**
 * Decodificar token sem validar (apenas para informações)
 */
export const decodeToken = (token) => {
    return jwt.decode(token);
};

/**
 * Middleware para log de requisições autenticadas
 */
export const logAuthenticatedRequest = (req, res, next) => {
    if (req.user) {
        console.log(`📝 [${new Date().toISOString()}] ${req.user.nome} (${req.user.tipo}) - ${req.method} ${req.originalUrl}`);
    }
    next();
};

/**
 * Middleware para verificar se o usuário está ativo
 */
export const requireActiveUser = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        if (req.user.ativo === false) {
            console.log(`❌ Usuário inativo tentou acesso: ${req.user.nome}`);
            return res.status(403).json({
                success: false,
                error: 'Sua conta está desativada. Entre em contato com o administrador.'
            });
        }

        next();

    } catch (error) {
        console.error('💥 Erro na verificação de usuário ativo:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno na verificação de conta'
        });
    }
};

/**
 * Utilitário para hash de senha
 */
export const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Utilitário para comparar senha
 */
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * Middleware combinado para autenticação + verificação de tipo de usuário
 */
export const requireAuthAndType = (allowedTypes = []) => {
    return [
        authenticateToken,
        requireActiveUser,
        (req, res, next) => {
            if (!allowedTypes.includes(req.user.tipo)) {
                const allowedTypesStr = allowedTypes.join(', ');
                console.log(`❌ Tipo de usuário não permitido: ${req.user.tipo}. Permitidos: ${allowedTypesStr}`);
                
                return res.status(403).json({
                    success: false,
                    error: `Acesso permitido apenas para: ${allowedTypesStr}`
                });
            }
            next();
        }
    ];
};

/**
 * Middleware para rotas públicas com log opcional
 */
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                req.user = decoded;
                console.log(`🔓 Autenticação opcional - Usuário identificado: ${decoded.nome}`);
            }
        });
    }

    next();
};

export default {
    authenticateToken,
    requireProfessor,
    requireAluno,
    requireAdmin,
    requireOwnershipOrAdmin,
    generateToken,
    validateToken,
    decodeToken,
    logAuthenticatedRequest,
    requireActiveUser,
    hashPassword,
    comparePassword,
    requireAuthAndType,
    optionalAuth
};
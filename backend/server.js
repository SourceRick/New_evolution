// server.js - ByteWave Backend com CORS Corrigido
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURAÇÃO CORS CORRETA - PERMITE TUDO
app.use(cors({
    origin: true, // Permite qualquer origem
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ MIDDLEWARE PARA HEADERS CORS (backup)
app.use((req, res, next) => {
    // Permite qualquer origem
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Log das requisições
    console.log('🌐 Request:', req.method, req.url, 'Origin:', req.headers.origin);
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('✅ Preflight CORS permitido');
        return res.status(200).end();
    }
    
    next();
});

// Middleware para parsing JSON
app.use(express.json());

// =============================================
// ROTAS BÁSICAS DE TESTE
// =============================================

// Rota principal
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 ByteWave Backend está funcionando!',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/health',
            '/api/test',
            '/api/auth/login',
            '/api/auth/register'
        ]
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'ByteWave API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ API ByteWave funcionando perfeitamente!',
        data: {
            service: 'Sistema de Gestão Acadêmica ByteWave',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            cors: 'Configurado corretamente'
        }
    });
});

// =============================================
// ROTA DE LOGIN SIMPLES PARA TESTE
// =============================================

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, senha } = req.body;
        
        console.log('🔐 Tentativa de login:', email);
        
        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }

        // Usuários mock para teste
        const usuarios = [
            {
                id: 1,
                nome: 'Professor Silva',
                email: 'prof.silva@email.com',
                senha: 'password', // Em produção, usar bcrypt
                tipo: 'professor'
            },
            {
                id: 2,
                nome: 'Aluno João',
                email: 'joao@email.com',
                senha: 'password',
                tipo: 'aluno'
            }
        ];

        // Buscar usuário
        const usuario = usuarios.find(u => u.email === email);
        
        if (!usuario) {
            console.log('❌ Usuário não encontrado:', email);
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }

        // Verificar senha (simplificado para teste)
        if (senha !== usuario.senha) {
            console.log('❌ Senha incorreta para:', email);
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }

        // Remover senha do response
        const { senha: _, ...usuarioSemSenha } = usuario;

        console.log('✅ Login bem-sucedido:', usuario.nome);

        res.json({
            success: true,
            data: {
                message: 'Login realizado com sucesso!',
                token: 'token_teste_jwt_' + usuario.id, // Token mock
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
});

// =============================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================

app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log('🚀      BYTEWAVE BACKEND INICIADO        ');
    console.log('🚀 ========================================');
    console.log(`📡 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('🔧 CORS: Configurado para permitir qualquer origem');
    console.log('');
    console.log('📚 ENDPOINTS DISPONÍVEIS:');
    console.log(`   ❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`   🧪 Teste API: http://localhost:${PORT}/api/test`);
    console.log(`   🔐 Login: http://localhost:${PORT}/api/auth/login`);
    console.log('');
    console.log('🔐 CREDENCIAIS DE TESTE:');
    console.log('   👨‍🏫 Professor: prof.silva@email.com / password');
    console.log('   👨‍🎓 Aluno: joao@email.com / password');
    console.log('🚀 ========================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando servidor...');
    process.exit(0);
});
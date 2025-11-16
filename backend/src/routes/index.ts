import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { AtividadeController } from '../controllers/atividadeController.js';
import { TrabalhoController } from '../controllers/trabalhoController.js';
import { SocialController } from '../controllers/socialController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const authController = new AuthController();
const atividadeController = new AtividadeController();
const trabalhoController = new TrabalhoController();
const socialController = new SocialController();

// Rotas públicas
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Rotas protegidas
router.get('/atividades', authenticateToken, atividadeController.listarAtividades);
router.post('/atividades', authenticateToken, atividadeController.criarAtividade);

router.post('/trabalhos', authenticateToken, trabalhoController.entregarTrabalho);
router.get('/trabalhos', authenticateToken, trabalhoController.listarTrabalhos);

router.get('/social/posts', authenticateToken, socialController.listarPosts);
router.post('/social/posts/:id/comentarios', authenticateToken, socialController.adicionarComentario);
router.post('/social/posts/:id/curtir', authenticateToken, socialController.curtirPost);

export default router;
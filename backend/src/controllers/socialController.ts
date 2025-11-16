import { Response } from 'express';
import { createConnection } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { PostSocial, ApiResponse } from '../types/index.js';

export class SocialController {
  async listarPosts(req: AuthRequest, res: Response) {
    try {
      const connection = await createConnection();
      
      const [posts] = await connection.execute(`
        SELECT ps.*, u.nome as autor_nome, u.foto_url, t.titulo as trabalho_titulo,
               (SELECT COUNT(*) FROM avaliacoes_sociais av WHERE av.id_post = ps.id) as total_curtidas,
               (SELECT COUNT(*) FROM comentarios c WHERE c.id_post = ps.id AND c.ativo = TRUE) as total_comentarios
        FROM posts_sociais ps
        JOIN trabalhos t ON ps.id_trabalho = t.id
        JOIN usuarios u ON t.id_aluno = u.id
        WHERE ps.ativo = TRUE
        ORDER BY ps.criado_em DESC
      `);

      const response: ApiResponse<PostSocial[]> = {
        success: true,
        data: posts as PostSocial[]
      };

      res.json(response);

    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      res.status(500).json({ success: false, error: 'Erro ao buscar posts' });
    }
  }

  async adicionarComentario(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { conteudo } = req.body;
      const connection = await createConnection();

      const [result] = await connection.execute(
        'INSERT INTO comentarios (id_post, id_usuario, conteudo) VALUES (?, ?, ?)',
        [id, req.user!.id, conteudo]
      );

      const response: ApiResponse = {
        success: true,
        message: 'Comentário adicionado com sucesso'
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      res.status(500).json({ success: false, error: 'Erro ao adicionar comentário' });
    }
  }

  async curtirPost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const connection = await createConnection();

      // Verificar se já curtiu
      const [existing] = await connection.execute(
        'SELECT id FROM avaliacoes_sociais WHERE id_post = ? AND id_avaliador = ?',
        [id, req.user!.id]
      );

      const existingArray = existing as any[];

      if (existingArray.length > 0) {
        // Remover curtida
        await connection.execute(
          'DELETE FROM avaliacoes_sociais WHERE id_post = ? AND id_avaliador = ?',
          [id, req.user!.id]
        );
      } else {
        // Adicionar curtida
        await connection.execute(
          'INSERT INTO avaliacoes_sociais (id_post, id_avaliador, tipo) VALUES (?, ?, ?)',
          [id, req.user!.id, 'curtir']
        );
      }

      const response: ApiResponse = {
        success: true,
        message: existingArray.length > 0 ? 'Curtida removida' : 'Post curtido'
      };

      res.json(response);

    } catch (error) {
      console.error('Erro ao curtir post:', error);
      res.status(500).json({ success: false, error: 'Erro ao curtir post' });
    }
  }
}
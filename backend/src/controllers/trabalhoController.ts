import { Response } from 'express';
import { createConnection } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse } from '../types/index.js';

export class TrabalhoController {
  async entregarTrabalho(req: AuthRequest, res: Response) {
    try {
      const { id_atividade, titulo, conteudo, visibilidade = 'privado' } = req.body;
      const connection = await createConnection();

      // Verificar se já existe entrega
      const [existing] = await connection.execute(
        'SELECT id FROM trabalhos WHERE id_atividade = ? AND id_aluno = ?',
        [id_atividade, req.user!.id]
      );

      const existingArray = existing as any[];

      let result;
      if (existingArray.length > 0) {
        // Atualizar entrega existente
        [result] = await connection.execute(
          `UPDATE trabalhos 
           SET titulo = ?, conteudo = ?, visibilidade = ?, data_entrega = NOW(), status = 'entregue'
           WHERE id_atividade = ? AND id_aluno = ?`,
          [titulo, conteudo, visibilidade, id_atividade, req.user!.id]
        );
      } else {
        // Nova entrega
        [result] = await connection.execute(
          `INSERT INTO trabalhos 
           (id_atividade, id_aluno, titulo, conteudo, visibilidade, status) 
           VALUES (?, ?, ?, ?, ?, 'entregue')`,
          [id_atividade, req.user!.id, titulo, conteudo, visibilidade]
        );
      }

      const insertResult = result as any;
      const trabalhoId = insertResult.insertId || existingArray[0].id;

      // Se o trabalho for público, criar post na rede social
      if (visibilidade === 'publico') {
        await connection.execute(
          `INSERT INTO posts_sociais (id_trabalho, titulo, conteudo, tags) 
           VALUES (?, ?, ?, ?)`,
          [trabalhoId, titulo, conteudo, JSON.stringify([])]
        );
      }

      const response: ApiResponse = {
        success: true,
        message: 'Trabalho entregue com sucesso'
      };

      res.json(response);

    } catch (error) {
      console.error('Erro ao entregar trabalho:', error);
      res.status(500).json({ success: false, error: 'Erro ao entregar trabalho' });
    }
  }

  async listarTrabalhos(req: AuthRequest, res: Response) {
    try {
      const connection = await createConnection();
      
      const [trabalhos] = await connection.execute(`
        SELECT t.*, a.titulo as atividade_titulo
        FROM trabalhos t
        JOIN atividades a ON t.id_atividade = a.id
        WHERE t.id_aluno = ?
        ORDER BY t.data_entrega DESC
      `, [req.user!.id]);

      const response: ApiResponse = {
        success: true,
        data: trabalhos
      };

      res.json(response);

    } catch (error) {
      console.error('Erro ao buscar trabalhos:', error);
      res.status(500).json({ success: false, error: 'Erro ao buscar trabalhos' });
    }
  }
}
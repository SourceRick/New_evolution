import { Response } from 'express';
import { createConnection } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { Atividade, ApiResponse } from '../types/index.js';

export class AtividadeController {
  async listarAtividades(req: AuthRequest, res: Response) {
    try {
      const connection = await createConnection();
      
      const [atividades] = await connection.execute(`
        SELECT a.*, u.nome as professor_nome 
        FROM atividades a 
        JOIN usuarios u ON a.id_professor = u.id 
        WHERE a.data_entrega > NOW() 
        ORDER BY a.data_entrega ASC
      `);

      const response: ApiResponse<Atividade[]> = {
        success: true,
        data: atividades as Atividade[]
      };

      res.json(response);

    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      res.status(500).json({ success: false, error: 'Erro ao buscar atividades' });
    }
  }

  async criarAtividade(req: AuthRequest, res: Response) {
    try {
      if (req.user?.tipo !== 'professor' && req.user?.tipo !== 'admin') {
        return res.status(403).json({ success: false, error: 'Acesso negado' });
      }

      const { titulo, descricao, tipo, data_entrega, valor_maximo, instrucoes } = req.body;
      const connection = await createConnection();

      const [result] = await connection.execute(
        `INSERT INTO atividades 
         (titulo, descricao, tipo, data_entrega, id_professor, valor_maximo, instrucoes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descricao, tipo, data_entrega, req.user.id, valor_maximo, instrucoes]
      );

      const insertResult = result as any;

      const response: ApiResponse = {
        success: true,
        message: 'Atividade criada com sucesso',
        data: {
          id: insertResult.insertId,
          titulo,
          data_entrega
        }
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      res.status(500).json({ success: false, error: 'Erro ao criar atividade' });
    }
  }
}
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createConnection } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types/index.js';

export class AuthController {
  async register(req: Request<{}, {}, RegisterRequest>, res: Response) {
    try {
      const { nome, email, senha, tipo = 'aluno' } = req.body;
      const connection = await createConnection();

      // Verificar se usuário já existe
      const [existing] = await connection.execute(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(senha, 10);

      // Inserir usuário
      const [result] = await connection.execute(
        'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
        [nome, email, hashedPassword, tipo]
      );

      const insertResult = result as any;

      // Gerar token
      const token = generateToken({
        id: insertResult.insertId,
        email,
        tipo
      });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          message: 'Usuário criado com sucesso',
          token,
          user: {
            id: insertResult.insertId,
            nome,
            email,
            tipo,
            ativo: true,
            criado_em: new Date()
          }
        }
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async login(req: Request<{}, {}, LoginRequest>, res: Response) {
    try {
      const { email, senha } = req.body;
      const connection = await createConnection();

      const [users] = await connection.execute(
        'SELECT * FROM usuarios WHERE email = ? AND ativo = TRUE',
        [email]
      );

      const userArray = users as any[];

      if (userArray.length === 0) {
        return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      }

      const user = userArray[0];
      const validPassword = await bcrypt.compare(senha, user.senha);

      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        tipo: user.tipo
      });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          message: 'Login realizado com sucesso',
          token,
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            tipo: user.tipo,
            foto_url: user.foto_url,
            ativo: user.ativo,
            criado_em: user.criado_em
          }
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}
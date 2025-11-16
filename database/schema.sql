-- sistema_atividades.sql
CREATE DATABASE IF NOT EXISTS sistema_atividades;
USE sistema_atividades;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('aluno', 'professor', 'admin') DEFAULT 'aluno',
    foto_url VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE atividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo ENUM('trabalho', 'prova', 'exercicio', 'projeto') DEFAULT 'trabalho',
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_entrega DATETIME NOT NULL,
    id_professor INT NOT NULL,
    valor_maximo DECIMAL(5,2) DEFAULT 10.00,
    instrucoes TEXT,
    anexos_permitidos BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_professor) REFERENCES usuarios(id)
);

CREATE TABLE trabalhos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_atividade INT NOT NULL,
    id_aluno INT NOT NULL,
    titulo VARCHAR(200),
    conteudo TEXT,
    data_entrega DATETIME DEFAULT CURRENT_TIMESTAMP,
    nota DECIMAL(5,2),
    comentario_professor TEXT,
    status ENUM('rascunho', 'entregue', 'avaliado', 'atrasado') DEFAULT 'rascunho',
    visibilidade ENUM('privado', 'turma', 'publico') DEFAULT 'privado',
    anonimo BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_atividade) REFERENCES atividades(id),
    FOREIGN KEY (id_aluno) REFERENCES usuarios(id)
);

CREATE TABLE posts_sociais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_trabalho INT NOT NULL,
    titulo VARCHAR(200),
    conteudo TEXT,
    tags JSON,
    visualizacoes INT DEFAULT 0,
    curtidas INT DEFAULT 0,
    permite_comentarios BOOLEAN DEFAULT TRUE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_trabalho) REFERENCES trabalhos(id)
);

CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_post INT NOT NULL,
    id_usuario INT NOT NULL,
    conteudo TEXT NOT NULL,
    editado BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_post) REFERENCES posts_sociais(id),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

CREATE TABLE avaliacoes_sociais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_post INT NOT NULL,
    id_avaliador INT NOT NULL,
    tipo ENUM('curtir', 'util', 'criativo') DEFAULT 'curtir',
    comentario TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_post) REFERENCES posts_sociais(id),
    FOREIGN KEY (id_avaliador) REFERENCES usuarios(id),
    UNIQUE KEY unique_avaliacao (id_post, id_avaliador)
);

-- Dados iniciais
INSERT INTO usuarios (nome, email, senha, tipo) VALUES 
('Professor Silva', 'prof.silva@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor'),
('Aluno João', 'joao@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aluno');
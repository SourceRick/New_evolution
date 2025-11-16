import mysql from 'mysql2/promise';

export const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1-8-2008',
  database: 'sistema_atividades'
};

export const createConnection = () => mysql.createConnection(dbConfig);
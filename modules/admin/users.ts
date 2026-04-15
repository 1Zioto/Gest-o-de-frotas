/**
 * modules/admin/users.ts
 * CRUD de usuários do sistema.
 */
import type { VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleUsers(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, search } = req.query;

    if (id) {
      const rows = await sql`
        SELECT id, nome, email AS login, perfil AS tipo, ativo, atualizado_em AS "lastAccess"
        FROM users
        WHERE id = ${id as string}
      `;
      return res.status(200).json(rows[0] ? { ...rows[0], idUser: rows[0]['id'] } : null);
    }

    const rows = search
      ? await sql`
          SELECT id, nome, email AS login, perfil AS tipo, ativo, atualizado_em AS "lastAccess"
          FROM users
          WHERE nome ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'}
          ORDER BY nome
        `
      : await sql`
          SELECT id, nome, email AS login, perfil AS tipo, ativo, atualizado_em AS "lastAccess"
          FROM users
          ORDER BY nome
        `;

    return res.status(200).json(rows.map(u => ({ ...u, idUser: u['id'] })));
  }

  if (req.method === 'POST') {
    const reqUser = req.user as any;
    const reqPerfil = (reqUser?.perfil || reqUser?.tipo || '').toLowerCase();
    if (reqPerfil !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar usuários.' });
    }

    const { nome, login, tipo, password, ativo } = req.body;

    if (!nome || !login || !password) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, login e password.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (nome, email, senha_hash, perfil, ativo)
      VALUES (${nome}, ${login}, ${hashedPassword}, ${tipo ?? 'operador'}, ${ativo ?? true})
      RETURNING id, nome, email AS login, perfil AS tipo, ativo, atualizado_em AS "lastAccess"
    `;
    return res.status(201).json({ ...rows[0], idUser: rows[0]['id'] });
  }

  if (req.method === 'PUT') {
    const reqUserPut = req.user as any;
    const reqPerfilPut = (reqUserPut?.perfil || reqUserPut?.tipo || '').toLowerCase();
    if (reqPerfilPut !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem editar usuários.' });
    }

    const { id } = req.query;
    const { nome, login, tipo, password, ativo } = req.body;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const rows = await sql`
        UPDATE users SET
          nome = ${nome}, email = ${login}, perfil = ${tipo},
          ativo = ${ativo}, senha_hash = ${hashedPassword}, atualizado_em = NOW()
        WHERE id = ${id as string}
        RETURNING id, nome, email AS login, perfil AS tipo, ativo, atualizado_em AS "lastAccess"
      `;
      return res.status(200).json({ ...rows[0], idUser: rows[0]['id'] });
    }

    const rows = await sql`
      UPDATE users SET
        nome = ${nome}, email = ${login}, perfil = ${tipo}, ativo = ${ativo}, atualizado_em = NOW()
      WHERE id = ${id as string}
      RETURNING id, nome, email AS login, perfil AS tipo, ativo, atualizado_em AS "lastAccess"
    `;
    return res.status(200).json({ ...rows[0], idUser: rows[0]['id'] });
  }

  if (req.method === 'DELETE') {
    const reqUserDel = req.user as any;
    const reqPerfilDel = (reqUserDel?.perfil || reqUserDel?.tipo || '').toLowerCase();
    if (reqPerfilDel !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir usuários.' });
    }

    const { id } = req.query;
    await sql`UPDATE users SET ativo = FALSE, atualizado_em = NOW() WHERE id = ${id as string}`;
    return res.status(200).json({ message: 'Usuário desativado.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}

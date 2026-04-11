/**
 * modules/admin/dashboard.ts
 * Dados agregados para o dashboard — alinhado ao schema real do Neon.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleDashboard(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const sql = getDb();

  const [
    veiculosCount,
    motoristasCount,
    abastecimentosMes,
    manutencoesMes,
    multasPendentes,
    totalAbastecimentoMes,
    totalManutencaoMes,
  ] = await Promise.all([
    sql`SELECT COUNT(*) AS total FROM veiculos  WHERE ativo = TRUE`,
    sql`SELECT COUNT(*) AS total FROM motoristas WHERE ativo = TRUE`,
    sql`SELECT COUNT(*) AS total FROM abastecimentos WHERE data >= DATE_TRUNC('month', NOW())`,
    // data_abertura é o campo correto (não data_manutencao)
    sql`SELECT COUNT(*) AS total FROM manutencoes  WHERE data_abertura >= DATE_TRUNC('month', NOW())`,
    sql`SELECT COUNT(*) AS total FROM multas WHERE status = 'Pendente'`,
    sql`SELECT COALESCE(SUM(valor_total), 0) AS total FROM abastecimentos WHERE data >= DATE_TRUNC('month', NOW())`,
    // valor_total é o campo correto (não custo_total)
    sql`SELECT COALESCE(SUM(valor_total), 0) AS total FROM manutencoes  WHERE data_abertura >= DATE_TRUNC('month', NOW())`,
  ]);

  // Últimos abastecimentos — JOIN correto: veiculo_id = veiculos.id
  const ultimosAbastecimentos = await sql`
    SELECT a.*, v.placa, v.modelo, p.nome AS proprietario_nome
    FROM abastecimentos a
    LEFT JOIN veiculos v      ON a.veiculo_id      = v.id
    LEFT JOIN proprietarios p ON a.proprietario_id = p.id
    ORDER BY COALESCE(a.data_hora, a.data::timestamptz) DESC
    LIMIT 5
  `;

  // Últimas manutenções — JOIN correto: veiculo_id = veiculos.id
  const ultimasManutencoes = await sql`
    SELECT m.*, v.placa
    FROM manutencoes m
    LEFT JOIN veiculos v ON m.veiculo_id = v.id
    ORDER BY COALESCE(m.data_abertura, m.criado_em::date) DESC
    LIMIT 5
  `;

  const abastecimentosPorMes = await sql`
    SELECT
      TO_CHAR(data, 'MM/YYYY')        AS mes,
      SUM(valor_total)                AS total,
      SUM(litros)                     AS litros
    FROM abastecimentos
    WHERE data >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(data, 'MM/YYYY'), DATE_TRUNC('month', data)
    ORDER BY DATE_TRUNC('month', data)
  `;

  return res.status(200).json({
    stats: {
      veiculos:              Number(veiculosCount[0]['total']),
      motoristas:            Number(motoristasCount[0]['total']),
      abastecimentosMes:     Number(abastecimentosMes[0]['total']),
      manutencoesMes:        Number(manutencoesMes[0]['total']),
      multasPendentes:       Number(multasPendentes[0]['total']),
      totalAbastecimentoMes: Number(totalAbastecimentoMes[0]['total']),
      totalManutencaoMes:    Number(totalManutencaoMes[0]['total']),
    },
    ultimosAbastecimentos,
    ultimasManutencoes,
    abastecimentosPorMes,
  });
}

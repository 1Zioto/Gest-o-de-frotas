export interface User {
  id?: number;
  idUser: string;
  nome: string;
  login: string;
  tipo: string;
  ativo?: boolean;
  lastAccess?: string;
}

export interface Proprietario {
  id?: number;
  id_proprietario: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ativo?: boolean;
  bloqueado?: boolean;
}

export interface Veiculo {
  id?: number;
  id_veiculo: string;
  placa: string;
  marca?: string;
  modelo?: string;
  ano?: string;
  tipo_combustivel?: string;
  numero_chassi?: string;
  proprietario_id?: string;
  proprietario_nome?: string;
  odometro?: string;
  renavam?: string;
  cor?: string;
  foto?: string;
  ativo?: boolean;
}

export interface Motorista {
  id?: number;
  id_motorista: string;
  nome: string;
  proprietario_id?: string;
  proprietario_nome?: string;
  cnh?: string;
  cel?: string;
  email?: string;
  ativo?: boolean;
}

export interface Abastecimento {
  id?: number;
  id_abastecimento: string;
  data?: string;
  data_hora?: string;
  frentista?: string;
  id_veiculo?: string;
  placa?: string;
  modelo?: string;
  id_motorista?: string;
  motorista_nome?: string;
  proprietario_id?: string;
  proprietario_nome?: string;
  local?: string;
  tipo_combustivel?: string;
  litros?: number;
  valor_litro?: number;
  valor_total?: number;
  odometro_atual?: string;
  odometro_anterior?: string;
  km_rodados?: string;
  media_km_litro?: string;
  status?: string;
  numero_nf?: string;
}

export interface Manutencao {
  id?: number;
  id_manutencao: string;
  id_veiculo?: string;
  placa?: string;
  modelo?: string;
  odometro_manutencao?: string;
  data_manutencao?: string;
  descricao_servico?: string;
  tipo_manutencao?: string;
  oficina_id?: string;
  oficina_nome?: string;
  custo_total?: number;
  numero_nf?: string;
  observacoes?: string;
  status?: string;
}

export interface Carreta {
  id?: number;
  id_carreta: string;
  placa: string;
  tipo_carroceria?: string;
  fabricante?: string;
  ano?: string;
  numero_chassi?: string;
  cor?: string;
  capacidade?: number;
  foto?: string;
  ativo?: boolean;
}

export interface Oficina {
  id?: number;
  id_oficina: string;
  nome: string;
  cnpj?: string;
  cel?: string;
  ativo?: boolean;
}

export interface Pneu {
  id?: number;
  id_pneu: string;
  numero?: number;
  numero_serie?: string;
  marca?: string;
  modelo?: string;
  medida?: string;
  veiculo_id?: string;
  placa?: string;
  posicao?: string;
  data_instalacao?: string;
  km_inicial?: number;
  data_substituicao?: string;
  status?: string;
  observacoes?: string;
}

export interface DespesaAdministrativa {
  id?: number;
  id_despesa: string;
  data_registro?: string;
  receita?: string;
  veiculo_id?: string;
  placa?: string;
  motorista_id?: string;
  motorista_nome?: string;
  pagamento?: string;
  data?: string;
  classificacao?: string;
  detalhamento?: string;
  valor?: number;
  numero_doc?: string;
  imagem?: string;
}

export interface Transporte {
  id?: number;
  id_transporte: string;
  data?: string;
  distancia?: number;
  origem?: string;
  destino?: string;
  contrato_frete?: string;
  veiculo_id?: string;
  placa?: string;
  motorista_id?: string;
  motorista_nome?: string;
  carreta_id?: string;
  carreta_placa?: string;
  tonelada?: number;
  km_inicial?: number;
  km_final?: number;
  quantidade_eixos_rodo?: number;
  valor_frete?: number;
  frete_total?: number;
  adiantamento_frete?: number;
  saldo_frete?: number;
  descontos?: number;
  frete_liquido?: number;
  valor_diaria?: number;
  quantidade_diarias?: number;
  valor_total_diarias?: number;
  valor_pedagio?: number;
  resultado_liquido?: number;
  tipo_veiculo?: string;
  stl?: number;
  margem_lucro?: number;
  media_km_l?: number;
  status?: string;
  viagem?: string;
  observacoes?: string;
}

export interface Registro {
  id?: number;
  id_registro: string;
  motorista_id?: string;
  motorista_nome?: string;
  status?: string;
  data?: string;
  hora_entrada1?: string;
  hora_saida1?: string;
  hora_entrada2?: string;
  hora_saida2?: string;
  total?: string;
}

export interface ValorCombustivel {
  id?: number;
  id_valor: string;
  tipo_combustivel: string;
  valor: number;
  data?: string;
  responsavel?: string;
}

export interface Multa {
  id?: number;
  id_multa: string;
  placa?: string;
  modelo?: string;
  renavam?: string;
  uf?: string;
  ait?: string;
  codigo_notificacao?: string;
  data_emissao?: string;
  enquadramento?: string;
  local_infracao?: string;
  valor?: number;
  desconto?: number;
  data_vencimento?: string;
  status?: string;
  motorista_id?: string;
  motorista_nome?: string;
  observacoes?: string;
}

export interface Inspecao {
  id?: number;
  id_inspecao: string;
  data_hora?: string;
  data?: string;
  motorista_id?: string;
  motorista_nome?: string;
  veiculo_id?: string;
  placa?: string;
  modelo?: string;
  tipo_carreta?: string;
  odometro?: string;
  combustivel_nivel?: string;
  observacoes_gerais?: string;
  itens_checklist?: Record<string, any>;
  status?: string;
}

export interface DashboardStats {
  veiculos: number;
  motoristas: number;
  abastecimentosMes: number;
  manutencoesMes: number;
  multasPendentes: number;
  totalAbastecimentoMes: number;
  totalManutencaoMes: number;
}

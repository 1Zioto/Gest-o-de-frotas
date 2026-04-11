import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Mapa de rotas: endpoint simples → função serverless + resource param.
 *
 * Contexto: o Vercel Hobby Plan permite no máximo 12 Serverless Functions.
 * Por isso, o backend usa um "Internal Router Pattern" onde poucos arquivos
 * em /api delegam para módulos internos via query param `resource`.
 *
 * Referência: MIGRATION.md
 */
const ROUTE_MAP: Record<string, { fn: string; resource: string }> = {
  // /api/frota
  veiculos:       { fn: 'frota',      resource: 'veiculos' },
  motoristas:     { fn: 'frota',      resource: 'motoristas' },
  proprietarios:  { fn: 'frota',      resource: 'proprietarios' },
  inspecoes:      { fn: 'frota',      resource: 'inspecoes' },
  transportes:    { fn: 'frota',      resource: 'transportes' },

  // /api/manutencao
  manutencoes:    { fn: 'manutencao', resource: 'manutencoes' },
  multas:         { fn: 'manutencao', resource: 'multas' },
  pneus:          { fn: 'manutencao', resource: 'pneus' },

  // /api/financeiro
  abastecimentos: { fn: 'financeiro', resource: 'abastecimentos' },
  despesas:       { fn: 'financeiro', resource: 'despesas' },
  registros:      { fn: 'financeiro', resource: 'registros' },

  // /api/catalogos
  carretas:       { fn: 'catalogos',  resource: 'carretas' },
  oficinas:       { fn: 'catalogos',  resource: 'oficinas' },
  valores:        { fn: 'catalogos',  resource: 'valores' },

  // /api/admin
  users:          { fn: 'admin',      resource: 'users' },
  dashboard:      { fn: 'admin',      resource: 'dashboard' },
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  /**
   * Resolve o endpoint simples (ex: 'veiculos') para a URL correta
   * da função serverless (ex: '/api/frota?resource=veiculos').
   * Endpoints não mapeados passam direto (ex: 'auth').
   */
  private resolve(endpoint: string, extraParams?: Record<string, string>): { url: string; params: HttpParams } {
    let httpParams = new HttpParams();

    const mapped = ROUTE_MAP[endpoint];
    let url: string;

    if (mapped) {
      url = `/api/${mapped.fn}`;
      httpParams = httpParams.set('resource', mapped.resource);
    } else {
      url = `/api/${endpoint}`;
    }

    if (extraParams) {
      Object.keys(extraParams).forEach(k => {
        if (extraParams[k]) httpParams = httpParams.set(k, extraParams[k]);
      });
    }

    return { url, params: httpParams };
  }

  get<T>(endpoint: string, params?: Record<string, string>): Observable<T> {
    const { url, params: httpParams } = this.resolve(endpoint, params);
    return this.http.get<T>(url, { headers: this.getHeaders(), params: httpParams });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    const { url, params } = this.resolve(endpoint);
    return this.http.post<T>(url, body, { headers: this.getHeaders(), params });
  }

  put<T>(endpoint: string, id: string, body: any): Observable<T> {
    const { url, params } = this.resolve(endpoint);
    return this.http.put<T>(url, body, { headers: this.getHeaders(), params: params.set('id', id) });
  }

  delete<T>(endpoint: string, id: string): Observable<T> {
    const { url, params } = this.resolve(endpoint);
    return this.http.delete<T>(url, { headers: this.getHeaders(), params: params.set('id', id) });
  }
}

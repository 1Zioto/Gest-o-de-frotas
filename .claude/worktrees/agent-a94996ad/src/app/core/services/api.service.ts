import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  get<T>(endpoint: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<T>(`/api/${endpoint}`, { headers: this.getHeaders(), params: httpParams });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`/api/${endpoint}`, body, { headers: this.getHeaders() });
  }

  put<T>(endpoint: string, id: string, body: any): Observable<T> {
    return this.http.put<T>(`/api/${endpoint}?id=${id}`, body, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string, id: string): Observable<T> {
    return this.http.delete<T>(`/api/${endpoint}?id=${id}`, { headers: this.getHeaders() });
  }
}

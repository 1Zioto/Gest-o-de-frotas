import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<any>(null);
  user = this._user.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) this._user.set(JSON.parse(stored));
  }

  isLoggedIn(): boolean {
    return !!this._user() || !!localStorage.getItem('user');
  }

  login(email: string, password: string) {
    return this.http.post<any>('/api/auth-login', { email, password }).pipe(
      tap(res => {
        this._user.set(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('token', res.token);
      })
    );
  }

  logout() {
    this._user.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  getUser() {
    return this._user();
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <div class="login-logo">
          <div class="logo-icon">
            <mat-icon>local_shipping</mat-icon>
          </div>
          <h1>GestFrota <span>5.0</span></h1>
          <p>Sistema de Gestão de Frotas</p>
        </div>

        <form class="login-form" (ngSubmit)="onLogin()">
          <div class="field">
            <label>E-mail</label>
            <div class="input-wrap">
              <mat-icon>email</mat-icon>
              <input type="email" [(ngModel)]="email" name="email" placeholder="seu@email.com" required />
            </div>
          </div>

          <div class="field">
            <label>Senha</label>
            <div class="input-wrap">
              <mat-icon>lock</mat-icon>
              <input [type]="showPass() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="••••••••" required />
              <button type="button" class="eye-btn" (click)="showPass.update(v => !v)">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
          </div>

          <div class="error" *ngIf="error()">{{ error() }}</div>

          <button class="btn-login" type="submit" [disabled]="loading()" matRipple>
            <span *ngIf="!loading()">Entrar</span>
            <span *ngIf="loading()">Entrando...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f1724 0%, #1e293b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.3);
    }
    .login-logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      mat-icon { color: white; font-size: 30px; width: 30px; height: 30px; }
    }
    h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 6px; span { color: #3b82f6; } }
    p { color: #64748b; font-size: 14px; margin: 0; }
    .login-form { display: flex; flex-direction: column; gap: 18px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 600; color: #374151; }
    .input-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 0 14px;
      transition: border-color 0.2s;
      &:focus-within { border-color: #3b82f6; }
      mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
      input { flex: 1; border: none; outline: none; padding: 12px 0; font-size: 14px; color: #1e293b; background: transparent; font-family: inherit; }
    }
    .eye-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; color: #94a3b8; &:hover { color: #475569; } }
    .error { background: #fef2f2; color: #dc2626; padding: 10px 14px; border-radius: 8px; font-size: 13px; border: 1px solid #fecaca; }
    .btn-login {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      font-family: inherit;
      transition: opacity 0.2s, transform 0.1s;
      &:hover { opacity: 0.92; }
      &:active { transform: scale(0.99); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.error.set('Preencha e-mail e senha.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService.login(this.email, this.password).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Credenciais inválidas.'); }
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <h1 class="logo">Панель управления</h1>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="admin@example.com"
              autocomplete="email"
            />
          </div>

          <div class="field">
            <label for="password">Пароль</label>
            <input
              id="password"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              placeholder="Введите пароль"
              autocomplete="current-password"
            />
          </div>

          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }

          <button
            type="submit"
            class="btn-ghost login-btn"
            [disabled]="loading()"
          >
            {{ loading() ? 'Вход...' : 'Войти' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: var(--space-6);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-sm);
      padding: var(--space-8);
    }

    .login-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .logo {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: var(--tracking-display);
      color: var(--fg);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .login-form .field {
      margin-bottom: 0;
    }

    .error-msg {
      color: var(--status-cancelled);
      font-size: var(--text-sm);
      text-align: center;
    }

    .login-btn {
      width: 100%;
      justify-content: center;
      margin-top: var(--space-2);
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  onLogin(): void {
    if (!this.email || !this.password) {
      this.error.set('Введите email и пароль.');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.auth.login(this.email, this.password).subscribe({
      next: (response) => {
        this.auth.setSession(response);
        this.loading.set(false);
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Неверный email или пароль.');
      },
    });
  }
}

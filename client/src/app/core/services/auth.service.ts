import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  email: string;
  name: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private tokenKey = 'zapankov_token';

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
  }

  private loadUser() {
    const token = this.getToken();
    if (token) {
      this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
        next: (user) => this.currentUser.set(user),
        error: () => this.logout(),
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  setSession(response: LoginResponse) {
    localStorage.setItem(this.tokenKey, response.token);
    this.currentUser.set(response.user);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}

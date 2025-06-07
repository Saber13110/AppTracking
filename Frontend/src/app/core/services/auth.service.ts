import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Utilisation de l'URL complète de l'API backend
  private apiUrl = 'http://127.0.0.1:8000/api/v1/auth'; // URL de base de votre API backend

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    // Endpoint pour l'enregistrement
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http
      .post<{ access_token: string }>(`${this.apiUrl}/token`, credentials)
      .pipe(
        tap(response => {
          if (response && response.access_token) {
            localStorage.setItem('token', response.access_token);
          }
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  googleLogin(): void {
    window.location.href = `${this.apiUrl}/google/login`;
  }

  // Vous pourriez ajouter d'autres méthodes ici, comme logout, getUserInfo, etc.
} 
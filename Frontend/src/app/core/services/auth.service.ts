import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    // Endpoint pour la connexion
    return this.http.post(`${this.apiUrl}/token`, credentials);
  }

  googleLogin(): void {
    window.location.href = `${this.apiUrl}/google/login`;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenType');
  }

  // Vous pourriez ajouter d'autres méthodes ici, comme logout, getUserInfo, etc.
} 
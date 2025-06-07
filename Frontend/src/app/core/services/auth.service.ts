import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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
    // Endpoint pour la connexion avec envoi en x-www-form-urlencoded
    const params = new HttpParams()
      .set('username', credentials.email)
      .set('password', credentials.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(
      `${this.apiUrl}/token`,
      params.toString(),
      { headers }
    );
  }

  googleLogin(): void {
    window.location.href = `${this.apiUrl}/google/login`;
  }

  // Vous pourriez ajouter d'autres méthodes ici, comme logout, getUserInfo, etc.
} 
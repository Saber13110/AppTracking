import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NewsArticle } from '../models/news';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private baseUrl = `${environment.apiUrl}/news`;

  constructor(private http: HttpClient) {}

  getArticle(slug: string): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${this.baseUrl}/${slug}`);
  }

  getArticles(): Observable<NewsArticle[]> {
    return this.http.get<NewsArticle[]>(this.baseUrl);
  }
}

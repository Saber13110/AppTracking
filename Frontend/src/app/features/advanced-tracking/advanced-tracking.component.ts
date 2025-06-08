import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-advanced-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-tracking.component.html',
  styleUrls: ['./advanced-tracking.component.scss']
})
export class AdvancedTrackingComponent implements OnInit {
  stats: any;
  query = '';
  results: any[] = [];
  loadingStats = false;
  loadingResults = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchStats();
  }

  fetchStats() {
    this.loadingStats = true;
    this.http.get<any>(`${environment.apiUrl}/tracking/stats`).subscribe({
      next: (resp) => {
        this.stats = resp.data;
        this.loadingStats = false;
      },
      error: () => {
        this.loadingStats = false;
      }
    });
  }

  search() {
    if (!this.query) {
      return;
    }
    this.loadingResults = true;
    this.http.post<any>(`${environment.apiUrl}/tracking/search`, { tracking_number: this.query }).subscribe({
      next: (resp) => {
        this.results = resp.data || [];
        this.loadingResults = false;
      },
      error: () => {
        this.loadingResults = false;
      }
    });
  }
}

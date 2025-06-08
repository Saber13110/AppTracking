import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TrackingHistoryService, HistoryRecord } from '../../core/services/tracking-history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  history: HistoryRecord[] = [];
  filteredHistory: HistoryRecord[] = [];
  searchTerm = '';
  statusFilter = '';

  constructor(private historyService: TrackingHistoryService) {}

  ngOnInit(): void {
    this.historyService.syncWithServer().then(() => this.loadHistory());
  }

  private loadHistory(): void {
    this.history = this.historyService.getHistory();
    this.applyFilters();
  }

  delete(id: string): void {
    this.historyService.removeIdentifier(id);
    this.loadHistory();
  }

  clear(): void {
    this.historyService.clear();
    this.loadHistory();
  }

  applyFilters(): void {
    this.filteredHistory = this.history
      .filter(item => {
        const matchesSearch = !this.searchTerm || item.tracking_number.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesStatus = !this.statusFilter || (item.status || '').toLowerCase().includes(this.statusFilter.toLowerCase());
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const da = new Date(a.last_consulted || '').getTime();
        const db = new Date(b.last_consulted || '').getTime();
        return db - da;
      });
  }

  isDelivered(item: HistoryRecord): boolean {
    return (item.status || '').toLowerCase().includes('delivered');
  }
}

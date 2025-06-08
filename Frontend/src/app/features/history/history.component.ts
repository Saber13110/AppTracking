import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrackingHistoryService, TrackedShipment } from '../../core/services/tracking-history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  history: TrackedShipment[] = [];
  searchTerm = '';
  filterStatus = '';
  filterDate: string | null = null;
  sortAsc = false;

  constructor(private historyService: TrackingHistoryService) {}

  ngOnInit(): void {
    this.historyService.syncWithServer().then(() => this.loadHistory());
  }

  private loadHistory(): void {
    this.history = this.historyService.getHistory();
  }

  get filteredHistory(): TrackedShipment[] {
    return this.history.filter(item => {
      const matchSearch = !this.searchTerm || item.tracking_number.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.filterStatus || (item.status || '').toLowerCase().includes(this.filterStatus.toLowerCase());
      const matchDate = !this.filterDate || (item.created_at || '').startsWith(this.filterDate);
      return matchSearch && matchStatus && matchDate;
    });
  }

  get sortedHistory(): TrackedShipment[] {
    return [...this.filteredHistory].sort((a, b) => {
      const da = new Date(a.created_at || '').getTime();
      const db = new Date(b.created_at || '').getTime();
      return this.sortAsc ? da - db : db - da;
    });
  }

  toggleSort() {
    this.sortAsc = !this.sortAsc;
  }

  delete(id: string): void {
    this.historyService.removeIdentifier(id);
    this.loadHistory();
  }

  clear(): void {
    this.historyService.deleteAll();
    this.loadHistory();
  }

  export(format: 'csv' | 'pdf' = 'csv'): void {
    this.historyService.exportHistory(format).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}

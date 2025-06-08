import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  history: string[] = [];

  constructor(private historyService: TrackingHistoryService) {}

  ngOnInit(): void {
    this.historyService.syncWithServer().then(() => this.loadHistory());
  }

  private loadHistory(): void {
    this.history = this.historyService.getHistory();
  }

  delete(id: string): void {
    this.historyService.removeIdentifier(id);
    this.loadHistory();
  }

  clear(): void {
    this.historyService.clear();
    this.loadHistory();
  }

  export(format: 'csv' | 'excel' | 'xml', all: boolean) {
    const ids = all ? undefined : this.history;
    this.historyService.exportHistory(format, ids).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = format === 'excel' ? 'xlsx' : format;
      a.href = url;
      a.download = `history.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}

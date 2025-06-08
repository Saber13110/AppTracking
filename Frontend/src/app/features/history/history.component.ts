import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

  constructor(private historyService: TrackingHistoryService) {}

  ngOnInit(): void {
    this.historyService.syncWithServer().then(() => this.loadHistory());
  }

  private loadHistory(): void {
    this.historyService.getServerHistory().subscribe(records => this.history = records);
  }

  delete(id: string): void {
    this.historyService.updateRecord(id, { pinned: false, note: '' }).subscribe();
    this.historyService.removeIdentifier(id);
    this.loadHistory();
  }

  clear(): void {
    this.historyService.deleteAll().subscribe(() => {
      this.historyService.clear();
      this.loadHistory();
    });
  }

  togglePin(rec: HistoryRecord): void {
    this.historyService.updateRecord(rec.id, { pinned: !rec.pinned }).subscribe(u => rec.pinned = u.pinned);
  }

  saveNote(rec: HistoryRecord): void {
    this.historyService.updateRecord(rec.id, { note: rec.note || '' }).subscribe();
  }

  download(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  records: any[] = [];

  constructor(private historyService: TrackingHistoryService) {}

  ngOnInit(): void {
    this.loadFromServer();
  }

  private async loadFromServer(): Promise<void> {
    try {
      this.records = await this.historyService.getServerHistory();
    } catch {
      this.records = [];
    }
  }

  delete(id: string): void {
    this.historyService.removeIdentifier(id);
    this.loadFromServer();
  }

  clear(): void {
    this.historyService.clear();
    this.loadFromServer();
  }

  togglePin(rec: any): void {
    rec.pinned = !rec.pinned;
    this.historyService.updateRecord(rec.id, { pinned: rec.pinned });
  }

  updateNote(rec: any): void {
    this.historyService.updateRecord(rec.id, { note: rec.note });
  }
}

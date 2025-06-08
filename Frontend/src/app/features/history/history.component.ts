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

  toggleFavorite(id: string): void {
    const newValue = !this.historyService.isFavorite(id);
    this.historyService.setFavorite(id, newValue);
  }

  editNickname(id: string): void {
    const current = this.historyService.getNickname(id) || '';
    const value = window.prompt('Nickname', current);
    if (value !== null) {
      this.historyService.setNickname(id, value);
    }
  }
}

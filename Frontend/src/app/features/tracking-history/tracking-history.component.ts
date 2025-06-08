import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TrackingHistoryService, TrackingHistoryItem } from '../tracking/services/tracking-history.service';

@Component({
  selector: 'app-tracking-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tracking-history.component.html',
  styleUrls: ['./tracking-history.component.scss']
})
export class TrackingHistoryComponent implements OnInit {
  history: TrackingHistoryItem[] = [];

  constructor(private historyService: TrackingHistoryService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.history = this.historyService.getHistory();
  }

  view(identifier: string): void {
    this.router.navigate(['/track', identifier]);
  }

  remove(identifier: string): void {
    this.historyService.remove(identifier);
    this.load();
  }

  clear(): void {
    this.historyService.clear();
    this.load();
  }
}

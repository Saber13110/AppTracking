import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';
import { ViewConfigService, ViewConfig } from '../../core/services/view-config.service';
import { TrackedShipment } from './tracked-shipment';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCheckboxModule,
    MatTabsModule,
    DragDropModule,
    FormsModule
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  shipments: TrackedShipment[] = [];
  availableColumns = ['tracking_number', 'status', 'note', 'created_at'];
  displayedColumns = [...this.availableColumns, 'actions'];

  savedViews: ViewConfig[] = [];
  selectedView = 0;

  newViewName = '';

  constructor(
    private historyService: TrackingHistoryService,
    private viewConfigService: ViewConfigService
  ) {}

  ngOnInit(): void {
    this.savedViews = this.viewConfigService.getConfigs();
    if (this.savedViews.length) {
      this.applyView(this.savedViews[0], 0);
    }
    this.historyService.syncWithServer().then(() => this.loadHistory());
  }

  private loadHistory(): void {
    this.historyService.fetchDetailedHistory().subscribe(data => {
      this.shipments = data;
    });
  }

  delete(id: string): void {
    this.historyService.removeIdentifier(id);
    this.loadHistory();
  }

  clear(): void {
    this.historyService.clear();
    this.loadHistory();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }

  toggleColumn(col: string) {
    const idx = this.displayedColumns.indexOf(col);
    if (idx > -1) {
      this.displayedColumns.splice(idx, 1);
    } else {
      this.displayedColumns.splice(this.displayedColumns.length - 1, 0, col);
    }
  }

  saveView() {
    if (!this.newViewName.trim()) return;
    const config: ViewConfig = {
      name: this.newViewName.trim(),
      columns: this.displayedColumns.filter(c => c !== 'actions')
    };
    this.viewConfigService.saveConfig(config);
    this.savedViews = this.viewConfigService.getConfigs();
    this.newViewName = '';
  }

  applyView(view: ViewConfig, index: number) {
    this.displayedColumns = [...view.columns, 'actions'];
    this.selectedView = index;
  }
}

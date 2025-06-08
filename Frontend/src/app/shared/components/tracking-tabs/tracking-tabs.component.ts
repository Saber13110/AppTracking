import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tracking-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-tabs.component.html',
  styleUrls: ['./tracking-tabs.component.scss']
})
export class TrackingTabsComponent {
  active: 'number' | 'reference' | 'tcn' | 'proof' = 'number';

  @Output() tabChange = new EventEmitter<'number' | 'reference' | 'tcn' | 'proof'>();

  setTab(tab: 'number' | 'reference' | 'tcn' | 'proof') {
    this.active = tab;
    this.tabChange.emit(this.active);
  }
}

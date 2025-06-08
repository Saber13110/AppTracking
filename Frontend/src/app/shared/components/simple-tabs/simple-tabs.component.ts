import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-simple-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simple-tabs.component.html',
  styleUrls: ['./simple-tabs.component.scss']
})
export class SimpleTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() active = '';
  @Output() select = new EventEmitter<string>();

  setActive(id: string) {
    this.active = id;
    this.select.emit(id);
  }
}

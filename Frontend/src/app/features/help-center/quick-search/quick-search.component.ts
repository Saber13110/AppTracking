import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quick-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-search.component.html',
  styleUrls: ['./quick-search.component.scss']
})
export class QuickSearchComponent {
  query = '';

  @Output() search = new EventEmitter<string>();

  submit() {
    this.search.emit(this.query);
  }
}

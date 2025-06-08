import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Faq {
  question: string;
  answer: string;
  open?: boolean;
}

@Component({
  selector: 'app-faq-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-list.component.html',
  styleUrls: ['./faq-list.component.scss']
})
export class FaqListComponent {
  @Input() faqs: Faq[] = [];

  toggleFaq(f: Faq) {
    f.open = !f.open;
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

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
  styleUrls: ['./faq-list.component.scss'],
  animations: [
    trigger('expand', [
      transition(':enter', [style({ height: 0, opacity: 0 }), animate('200ms ease-out', style({ height: '*', opacity: 1 }))]),
      transition(':leave', [animate('200ms ease-in', style({ height: 0, opacity: 0 }))])
    ])
  ]
})
export class FaqListComponent {
  @Input() faqs: Faq[] = [];

  toggleFaq(f: Faq) {
    f.open = !f.open;
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-emergency-notice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emergency-notice.component.html',
  styleUrls: ['./emergency-notice.component.scss'],
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease-in', style({ opacity: 1 }))]),
      transition(':leave', [animate('200ms ease-out', style({ opacity: 0 }))])
    ])
  ]
})
export class EmergencyNoticeComponent {
  @Input() message = '';
  @Output() closed = new EventEmitter<void>();
  visible = true;

  dismiss() {
    this.visible = false;
    this.closed.emit();
  }
}

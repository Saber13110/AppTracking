import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-track-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-actions.component.html',
  styleUrls: ['./track-actions.component.scss']
})
export class TrackActionsComponent {
  changeAddress() {}
  selectDeliverySlot() {}
  requestRedelivery() {}
}

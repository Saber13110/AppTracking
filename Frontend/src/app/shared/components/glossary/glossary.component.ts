import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GlossaryItem {
  term: string;
  description: string;
}

@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './glossary.component.html',
  styleUrls: ['./glossary.component.scss']
})
export class GlossaryComponent {
  statuses: GlossaryItem[] = [
    { term: 'Label created', description: 'Shipping label has been created.' },
    { term: 'In transit', description: 'Package is moving within the FedEx network.' },
    { term: 'Out for delivery', description: 'Courier is delivering the package today.' },
    { term: 'Delivered', description: 'Package delivered to the recipient.' },
    { term: 'Exception', description: 'An unexpected event is delaying delivery.' }
  ];
}

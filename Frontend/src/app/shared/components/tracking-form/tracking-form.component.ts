import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-tracking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tracking-form.component.html',
  styleUrls: ['./tracking-form.component.scss']
})
export class TrackingFormComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() includePackageName = true;
  @Input() buttonIcon = 'fas fa-search';

  @Output() formSubmit = new EventEmitter<void>();

  submit() {
    this.formSubmit.emit();
  }
}

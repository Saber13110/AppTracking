import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { showNotification } from '../../../shared/services/notification.util';

@Component({
  selector: 'app-delivery-instructions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <h1 mat-dialog-title>Delivery Instructions</h1>
    <form [formGroup]="form" (ngSubmit)="confirm()">
      <div mat-dialog-content>
        <label>
          Instructions
          <textarea formControlName="instructions" rows="4"></textarea>
        </label>
        <div class="error" *ngIf="form.get('instructions')?.touched && form.get('instructions')?.invalid">
          Instructions required
        </div>
      </div>
      <div mat-dialog-actions>
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-button color="primary" type="submit">Save</button>
      </div>
    </form>
  `
})
export class DeliveryInstructionsDialogComponent {
  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<DeliveryInstructionsDialogComponent>, private fb: FormBuilder) {
    this.form = this.fb.group({
      instructions: ['', Validators.required]
    });
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    showNotification('Instructions saved', 'success');
    this.dialogRef.close(this.form.value);
  }

  close(): void {
    this.dialogRef.close();
  }
}

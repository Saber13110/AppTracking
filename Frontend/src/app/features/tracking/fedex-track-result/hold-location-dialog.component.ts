import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { showNotification } from '../../../shared/services/notification.util';

@Component({
  selector: 'app-hold-location-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <h1 mat-dialog-title>Hold at Location</h1>
    <form [formGroup]="form" (ngSubmit)="confirm()">
      <div mat-dialog-content>
        <label>
          Location
          <input formControlName="location" />
        </label>
        <div class="error" *ngIf="form.get('location')?.touched && form.get('location')?.invalid">
          Location required
        </div>
        <label>
          Date
          <input type="date" formControlName="date" />
        </label>
        <div class="error" *ngIf="form.get('date')?.touched && form.get('date')?.invalid">
          Date required
        </div>
      </div>
      <div mat-dialog-actions>
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-button color="primary" type="submit">Confirm</button>
      </div>
    </form>
  `
})
export class HoldLocationDialogComponent {
  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<HoldLocationDialogComponent>, private fb: FormBuilder) {
    this.form = this.fb.group({
      location: ['', Validators.required],
      date: ['', Validators.required]
    });
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    showNotification('Hold location saved', 'success');
    this.dialogRef.close(this.form.value);
  }

  close(): void {
    this.dialogRef.close();
  }
}

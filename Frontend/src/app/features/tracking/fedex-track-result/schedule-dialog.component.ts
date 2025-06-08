import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { showNotification } from '../../../shared/services/notification.util';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <h1 mat-dialog-title>Schedule Delivery</h1>
    <form [formGroup]="form" (ngSubmit)="confirm()">
      <div mat-dialog-content>
        <label>
          Date
          <input type="date" formControlName="date" />
        </label>
        <div class="error" *ngIf="form.get('date')?.touched && form.get('date')?.invalid">
          Date required
        </div>
        <label>
          Time
          <input type="time" formControlName="time" />
        </label>
        <div class="error" *ngIf="form.get('time')?.touched && form.get('time')?.invalid">
          Time required
        </div>
      </div>
      <div mat-dialog-actions>
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-button color="primary" type="submit">Confirm</button>
      </div>
    </form>
  `
})
export class ScheduleDialogComponent {
  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<ScheduleDialogComponent>, private fb: FormBuilder) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    showNotification('Schedule saved', 'success');
    this.dialogRef.close(this.form.value);
  }

  close(): void {
    this.dialogRef.close();
  }
}

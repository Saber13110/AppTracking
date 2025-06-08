import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-schedule-delivery-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h1 mat-dialog-title>Schedule Delivery</h1>
    <div mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="fill">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" />
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Time</mat-label>
          <input matInput type="time" formControlName="time" />
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" [disabled]="form.invalid" (click)="confirm()">Confirm</button>
    </div>
  `
})
export class ScheduleDeliveryDialogComponent {
  form: FormGroup;
  constructor(public dialogRef: MatDialogRef<ScheduleDeliveryDialogComponent>, private fb: FormBuilder) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  confirm() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

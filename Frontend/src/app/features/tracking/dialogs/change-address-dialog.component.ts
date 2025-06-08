import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-change-address-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h1 mat-dialog-title>Change Address</h1>
    <div mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="fill">
          <mat-label>Street</mat-label>
          <input matInput formControlName="street" />
          <mat-error *ngIf="form.get('street')?.hasError('required')">Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>City</mat-label>
          <input matInput formControlName="city" />
          <mat-error *ngIf="form.get('city')?.hasError('required')">Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Postal Code</mat-label>
          <input matInput formControlName="postal" />
          <mat-error *ngIf="form.get('postal')?.hasError('required')">Required</mat-error>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" [disabled]="form.invalid" (click)="confirm()">Confirm</button>
    </div>
  `
})
export class ChangeAddressDialogComponent {
  form: FormGroup;
  constructor(public dialogRef: MatDialogRef<ChangeAddressDialogComponent>, private fb: FormBuilder) {
    this.form = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      postal: ['', Validators.required]
    });
  }

  confirm() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

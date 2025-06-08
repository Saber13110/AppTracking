import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { showNotification } from '../../../shared/services/notification.util';

@Component({
  selector: 'app-change-address-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <h1 mat-dialog-title>Change Delivery Address</h1>
    <form [formGroup]="form" (ngSubmit)="confirm()">
      <div mat-dialog-content>
        <label>
          Name
          <input formControlName="name" />
        </label>
        <div class="error" *ngIf="form.get('name')?.touched && form.get('name')?.invalid">
          Name required
        </div>
        <label>
          Street
          <input formControlName="street" />
        </label>
        <div class="error" *ngIf="form.get('street')?.touched && form.get('street')?.invalid">
          Street required
        </div>
        <label>
          City
          <input formControlName="city" />
        </label>
        <div class="error" *ngIf="form.get('city')?.touched && form.get('city')?.invalid">
          City required
        </div>
        <label>
          Postal Code
          <input formControlName="postal" />
        </label>
        <div class="error" *ngIf="form.get('postal')?.touched && form.get('postal')?.invalid">
          Postal code required
        </div>
      </div>
      <div mat-dialog-actions>
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-button color="primary" type="submit">Save</button>
      </div>
    </form>
  `
})
export class ChangeAddressDialogComponent {
  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<ChangeAddressDialogComponent>, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      postal: ['', Validators.required]
    });
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    showNotification('Address updated', 'success');
    this.dialogRef.close(this.form.value);
  }

  close(): void {
    this.dialogRef.close();
  }
}

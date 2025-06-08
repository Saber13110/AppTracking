import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ChangeAddressDialogComponent } from './change-address-dialog.component';
import * as notificationUtil from '../../../shared/services/notification.util';

describe('ChangeAddressDialogComponent', () => {
  let component: ChangeAddressDialogComponent;
  let fixture: ComponentFixture<ChangeAddressDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ChangeAddressDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [ChangeAddressDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeAddressDialogComponent);
    component = fixture.componentInstance;
    spyOn(notificationUtil, 'showNotification');
    fixture.detectChanges();
  });

  afterEach(() => {
    (notificationUtil.showNotification as jasmine.Spy).calls.reset();
    dialogRef.close.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('confirm() with invalid form should not close dialog', () => {
    component.form.patchValue({ name: '', street: '', city: '', postal: '' });

    component.confirm();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(notificationUtil.showNotification).not.toHaveBeenCalled();
  });

  it('confirm() with valid form should close dialog and show notification', () => {
    const data = { name: 'T', street: 'S', city: 'C', postal: 'P' };
    component.form.setValue(data);

    component.confirm();

    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Address updated', 'success');
    expect(dialogRef.close).toHaveBeenCalledWith(data);
  });

  it('close() should close dialog', () => {
    component.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ChangeAddressDialogComponent } from './change-address-dialog.component';
import * as notificationUtil from '../../../shared/services/notification.util';

describe('ChangeAddressDialogComponent', () => {
  let component: ChangeAddressDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ChangeAddressDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ChangeAddressDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    }).compileComponents();

    component = TestBed.createComponent(ChangeAddressDialogComponent).componentInstance;
    spyOn(notificationUtil, 'showNotification');
  });

  afterEach(() => {
    (notificationUtil.showNotification as jasmine.Spy).calls.reset();
    dialogRef.close.calls.reset();
  });

  it('should not close dialog when form invalid', () => {
    component.confirm();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(notificationUtil.showNotification).not.toHaveBeenCalled();
  });

  it('should close dialog and show notification on confirm', () => {
    component.form.setValue({ name: 'n', street: 's', city: 'c', postal: 'p' });
    component.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith({ name: 'n', street: 's', city: 'c', postal: 'p' });
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Address updated', 'success');
  });
});

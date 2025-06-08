import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { DeliveryInstructionsDialogComponent } from './delivery-instructions-dialog.component';
import * as notificationUtil from '../../../shared/services/notification.util';

describe('DeliveryInstructionsDialogComponent', () => {
  let component: DeliveryInstructionsDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DeliveryInstructionsDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DeliveryInstructionsDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    }).compileComponents();

    component = TestBed.createComponent(DeliveryInstructionsDialogComponent).componentInstance;
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
    component.form.setValue({ instructions: 'test' });
    component.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith({ instructions: 'test' });
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Instructions saved', 'success');
  });
});

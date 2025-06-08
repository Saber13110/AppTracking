import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { HoldLocationDialogComponent } from './hold-location-dialog.component';
import * as notificationUtil from '../../../shared/services/notification.util';

describe('HoldLocationDialogComponent', () => {
  let component: HoldLocationDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<HoldLocationDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [HoldLocationDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    }).compileComponents();

    component = TestBed.createComponent(HoldLocationDialogComponent).componentInstance;
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
    component.form.setValue({ location: 'loc', date: '2024-01-01' });
    component.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith({ location: 'loc', date: '2024-01-01' });
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Hold location saved', 'success');
  });
});

import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ScheduleDialogComponent } from './schedule-dialog.component';
import * as notificationUtil from '../../../shared/services/notification.util';

describe('ScheduleDialogComponent', () => {
  let component: ScheduleDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ScheduleDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ScheduleDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    }).compileComponents();

    component = TestBed.createComponent(ScheduleDialogComponent).componentInstance;
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
    component.form.setValue({ date: '2024-01-01', time: '12:00' });
    component.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith({ date: '2024-01-01', time: '12:00' });
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Schedule saved', 'success');
  });
});

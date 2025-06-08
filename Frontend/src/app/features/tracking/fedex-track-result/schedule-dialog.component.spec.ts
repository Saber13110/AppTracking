import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ScheduleDialogComponent } from './schedule-dialog.component';
import * as notificationUtil from '../../../shared/services/notification.util';

describe('ScheduleDialogComponent', () => {
  let component: ScheduleDialogComponent;
  let fixture: ComponentFixture<ScheduleDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ScheduleDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [ScheduleDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleDialogComponent);
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
    component.form.patchValue({ date: '', time: '' });

    component.confirm();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(notificationUtil.showNotification).not.toHaveBeenCalled();
  });

  it('confirm() with valid form should close dialog and show notification', () => {
    component.form.setValue({ date: '2024-01-01', time: '10:00' });

    component.confirm();

    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Schedule saved', 'success');
    expect(dialogRef.close).toHaveBeenCalledWith({ date: '2024-01-01', time: '10:00' });
  });

  it('close() should close dialog', () => {
    component.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});

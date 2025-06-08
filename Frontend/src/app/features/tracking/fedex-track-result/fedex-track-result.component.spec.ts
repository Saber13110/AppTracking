/// <reference types="google.maps" />
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { FedexTrackResultComponent } from './fedex-track-result.component';
import { TrackingService } from '../services/tracking.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ScheduleDialogComponent } from './schedule-dialog.component';
import { HoldLocationDialogComponent } from './hold-location-dialog.component';
import { DeliveryInstructionsDialogComponent } from './delivery-instructions-dialog.component';
import * as notificationUtil from '../../../shared/services/notification.util';

declare const google: any;

describe('FedexTrackResultComponent', () => {
  let component: FedexTrackResultComponent;
  let fixture: ComponentFixture<FedexTrackResultComponent>;
  let trackingService: jasmine.SpyObj<TrackingService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    trackingService = jasmine.createSpyObj('TrackingService', ['trackPackage', 'exportTracking']);
    analytics = jasmine.createSpyObj('AnalyticsService', ['logAction']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [FedexTrackResultComponent],
      providers: [
        { provide: TrackingService, useValue: trackingService },
        { provide: AnalyticsService, useValue: analytics },
        { provide: ActivatedRoute, useValue: { params: of({ identifier: 'FEDEXID' }) } },
        { provide: MatDialog, useValue: dialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FedexTrackResultComponent);
    component = fixture.componentInstance;
    spyOn(notificationUtil, 'showNotification');
  });

  afterEach(() => {
    (notificationUtil.showNotification as jasmine.Spy).calls.reset();
    analytics.logAction.calls.reset();
  });

  it('shareTracking() should log action and show notification', () => {
    component.trackingData = {
      tracking_number: 'FEDEXID',
      carrier: 'FedEx',
      status: { status: 'In transit', description: '', is_delivered: false },
      tracking_history: []
    } as any;

    const shareSpy = jasmine.createSpy('share');
    (navigator as any).share = shareSpy;

    component.shareTracking();

    expect(shareSpy).toHaveBeenCalled();
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Share dialog opened', 'info');
    expect(analytics.logAction).toHaveBeenCalledWith('share_tracking', 'FEDEXID');
  });

  it('printTracking() should log action and show notification', () => {
    const printSpy = spyOn(window, 'print').and.stub();

    component.printTracking();

    expect(printSpy).toHaveBeenCalled();
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Printing...', 'info');
    expect(analytics.logAction).toHaveBeenCalledWith('print_tracking');
  });

  it('saveTracking() should log action and show notification', () => {
    component.trackingData = {
      tracking_number: 'FEDEXID',
      carrier: 'FedEx',
      status: { status: 'In transit', description: '', is_delivered: false },
      tracking_history: []
    } as any;

    localStorage.removeItem('savedTrackingNumbers');

    component.saveTracking();

    const saved = JSON.parse(localStorage.getItem('savedTrackingNumbers') || '[]');
    expect(saved).toContain('FEDEXID');
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Tracking saved', 'success');
    expect(analytics.logAction).toHaveBeenCalledWith('save_tracking', 'FEDEXID');
  });

  it('exportData() should notify on error', () => {
    component.trackingData = {
      tracking_number: 'FEDEXID',
      carrier: 'FedEx',
      status: { status: 'In transit', description: '', is_delivered: false },
      tracking_history: []
    } as any;

    trackingService.exportTracking.and.returnValue(throwError(() => new Error('fail')));

    component.exportData('pdf');

    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Export failed', 'error');
    expect(analytics.logAction).toHaveBeenCalledWith('export_data', 'pdf');
  });

  it('should use fallback data when service fails', fakeAsync(() => {
    trackingService.trackPackage.and.returnValue(throwError(() => new Error('fail')));
    spyOn(component as any, 'waitForGoogleMaps').and.returnValue(Promise.resolve());
    spyOn(component as any, 'initializeMap');

    fixture.detectChanges();
    tick();

    expect(component.error).toBe('API unavailable - using mock data');
    expect(component.trackingData?.carrier).toBe('FedEx');
    expect(component.trackingData?.tracking_number).toBe('FEDEXID');
  }));

  it("openDialog('schedule') should open ScheduleDialogComponent and log action", () => {
    component.openDialog('schedule');

    expect(dialog.open).toHaveBeenCalledWith(ScheduleDialogComponent, { width: '400px' });
    expect(analytics.logAction).toHaveBeenCalledWith('open_dialog', 'schedule');
  });

  it("openDialog('hold-location') should open HoldLocationDialogComponent and log action", () => {
    component.openDialog('hold-location');

    expect(dialog.open).toHaveBeenCalledWith(HoldLocationDialogComponent, { width: '400px' });
    expect(analytics.logAction).toHaveBeenCalledWith('open_dialog', 'hold-location');
  });

  it("openDialog('instructions') should open DeliveryInstructionsDialogComponent and log action", () => {
    component.openDialog('instructions');

    expect(dialog.open).toHaveBeenCalledWith(DeliveryInstructionsDialogComponent, { width: '400px' });
    expect(analytics.logAction).toHaveBeenCalledWith('open_dialog', 'instructions');
  });

  it("exportData('pdf') should trigger a download and log action", () => {
    component.trackingData = {
      tracking_number: 'FEDEXID',
      carrier: 'FedEx',
      status: { status: 'In transit', description: '', is_delivered: false },
      tracking_history: []
    } as any;

    const blob = new Blob(['data'], { type: 'application/pdf' });
    trackingService.exportTracking.and.returnValue(of(blob));

    const clickSpy = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.returnValue({ click: clickSpy } as any);
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(window.URL, 'revokeObjectURL');

    component.exportData('pdf');

    expect(trackingService.exportTracking).toHaveBeenCalledWith('FEDEXID', 'pdf');
    expect(clickSpy).toHaveBeenCalled();
    expect(analytics.logAction).toHaveBeenCalledWith('export_data', 'pdf');
  });
});

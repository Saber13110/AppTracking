/// <reference types="google.maps" />
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { FedexTrackResultComponent } from './fedex-track-result.component';
import { TrackingService } from '../services/tracking.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import * as notificationUtil from '../../../shared/services/notification.util';

declare const google: any;

describe('FedexTrackResultComponent', () => {
  let component: FedexTrackResultComponent;
  let fixture: ComponentFixture<FedexTrackResultComponent>;
  let trackingService: jasmine.SpyObj<TrackingService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    trackingService = jasmine.createSpyObj('TrackingService', ['trackPackage', 'exportTracking']);
    analytics = jasmine.createSpyObj('AnalyticsService', ['logAction']);

    await TestBed.configureTestingModule({
      imports: [FedexTrackResultComponent],
      providers: [
        { provide: TrackingService, useValue: trackingService },
        { provide: AnalyticsService, useValue: analytics },
        { provide: ActivatedRoute, useValue: { params: of({ identifier: 'FEDEXID' }) } }
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
});

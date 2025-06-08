import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { TrackResultComponent } from './track-result.component';
import { TrackingService } from '../services/tracking.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { TrackingHistoryService } from '../../../core/services/tracking-history.service';
import * as notificationUtil from '../../../shared/services/notification.util';

describe('TrackResultComponent', () => {
  let component: TrackResultComponent;
  let fixture: ComponentFixture<TrackResultComponent>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    const trackingService = jasmine.createSpyObj('TrackingService', ['trackPackage']);
    analytics = jasmine.createSpyObj('AnalyticsService', ['logAction']);
    const history = jasmine.createSpyObj('TrackingHistoryService', ['addIdentifier']);

    await TestBed.configureTestingModule({
      imports: [TrackResultComponent],
      providers: [
        { provide: TrackingService, useValue: trackingService },
        { provide: AnalyticsService, useValue: analytics },
        { provide: TrackingHistoryService, useValue: history },
        { provide: ActivatedRoute, useValue: { params: of({ identifier: 'ID' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrackResultComponent);
    component = fixture.componentInstance;
    spyOn(notificationUtil, 'showNotification');
  });

  afterEach(() => {
    (notificationUtil.showNotification as jasmine.Spy).calls.reset();
    analytics.logAction.calls.reset();
    localStorage.removeItem('savedTrackingNumbers');
  });

  it('shareTracking() should log action and show notification', () => {
    component.trackingInfo = { tracking_number: 'ID' } as any;
    const shareSpy = jasmine.createSpy('share');
    (navigator as any).share = shareSpy;

    component.shareTracking();

    expect(shareSpy).toHaveBeenCalled();
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Share dialog opened', 'info');
    expect(analytics.logAction).toHaveBeenCalledWith('share_tracking', 'ID');
  });

  it('printTracking() should log action and show notification', () => {
    const printSpy = spyOn(window, 'print').and.stub();

    component.printTracking();

    expect(printSpy).toHaveBeenCalled();
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Printing...', 'info');
    expect(analytics.logAction).toHaveBeenCalledWith('print_tracking');
  });

  it('saveTracking() should store tracking and show notification', () => {
    component.trackingInfo = { tracking_number: 'ID' } as any;
    localStorage.removeItem('savedTrackingNumbers');

    component.saveTracking();

    const saved = JSON.parse(localStorage.getItem('savedTrackingNumbers') || '[]');
    expect(saved).toContain('ID');
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Tracking saved', 'success');
  });

  it('ngOnDestroy() should clean up subscriptions and interval', () => {
    const sub = { unsubscribe: jasmine.createSpy('unsubscribe') } as unknown as Subscription;
    (component as any).paramsSub = sub;
    (component as any).refreshIntervalId = 321;
    component.markers = [{ setMap: jasmine.createSpy('setMap') } as any];
    component.polyline = { setMap: jasmine.createSpy('setMap') } as any;
    component.map = {} as any;

    const clearSpy = spyOn(window, 'clearInterval');

    component.ngOnDestroy();

    expect(sub.unsubscribe).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalledWith(321 as any);
    expect(component.markers[0].setMap).toHaveBeenCalledWith(null);
    expect((component.polyline as any).setMap).toHaveBeenCalledWith(null);
    expect(component.map).toBeNull();
  });
});

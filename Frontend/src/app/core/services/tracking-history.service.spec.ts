import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TrackingHistoryService } from './tracking-history.service';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('TrackingHistoryService', () => {
  let service: TrackingHistoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TrackingHistoryService,
        { provide: AuthService, useValue: { isLoggedIn: () => of(true) } }
      ]
    });
    service = TestBed.inject(TrackingHistoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('trackingHistory');
  });

  it('removeIdentifier should delete entry locally and call backend', () => {
    const now = new Date().toISOString();
    localStorage.setItem('trackingHistory', JSON.stringify([
      { id: '1', tracking_number: '111', created_at: now },
      { id: '2', tracking_number: '222', created_at: now }
    ]));

    service.removeIdentifier('1');

    const req = http.expectOne(`${environment.apiUrl}/history/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    const remaining = JSON.parse(localStorage.getItem('trackingHistory') || '[]');
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('2');
  });
});

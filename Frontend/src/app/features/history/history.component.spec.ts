import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { HistoryComponent } from './history.component';
import { TrackingHistoryService, TrackedShipment } from '../../core/services/tracking-history.service';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let historyService: jasmine.SpyObj<TrackingHistoryService>;

  const mockHistory: TrackedShipment[] = [
    { id: '1', tracking_number: 'AAA111', status: 'Delivered', created_at: '2024-01-01T10:00:00Z', note: 'First', pinned: false },
    { id: '2', tracking_number: 'BBB222', status: 'Shipped', created_at: '2024-02-01T10:00:00Z', note: 'Second', pinned: false },
    { id: '3', tracking_number: 'CCC333', status: 'Delivered', created_at: '2024-03-01T10:00:00Z', note: '', pinned: true }
  ];

  beforeEach(async () => {
    historyService = jasmine.createSpyObj('TrackingHistoryService', ['syncWithServer', 'getHistory', 'updateEntry']);
    historyService.syncWithServer.and.returnValue(Promise.resolve());
    historyService.getHistory.and.returnValue(mockHistory);

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [{ provide: TrackingHistoryService, useValue: historyService }]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
  });

  it('should load history on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(historyService.syncWithServer).toHaveBeenCalled();
    expect(component.history.length).toBe(3);
  }));

  it('should filter history by search, status and date', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.searchTerm = 'BBB';
    expect(component.filteredHistory.length).toBe(1);

    component.filterStatus = 'Delivered';
    expect(component.filteredHistory.length).toBe(0);

    component.searchTerm = '';
    expect(component.filteredHistory.length).toBe(2);

    component.filterDate = '2024-03-01';
    expect(component.filteredHistory.length).toBe(1);
  }));

  it('should sort history ascending and descending', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.sortAsc = false;
    expect(component.sortedHistory[0].id).toBe('3');

    component.sortAsc = true;
    expect(component.sortedHistory[0].id).toBe('1');
  }));

  it('should update notes via service', () => {
    const item = { ...mockHistory[0], note: 'Updated' };
    component.updateNote(item);
    expect(historyService.updateEntry).toHaveBeenCalledWith('1', 'Updated', undefined);
  });

  it('should toggle pinned state and call service', () => {
    const item = { ...mockHistory[0] };
    component.togglePinned(item);
    expect(item.pinned).toBeTrue();
    expect(historyService.updateEntry).toHaveBeenCalledWith('1', undefined, true);
  });
});

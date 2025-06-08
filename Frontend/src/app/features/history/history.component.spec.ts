import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HistoryComponent } from './history.component';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async () => {
    const service = jasmine.createSpyObj('TrackingHistoryService', ['syncWithServer', 'getHistory', 'removeIdentifier', 'deleteAll', 'exportHistory']);
    service.syncWithServer.and.returnValue(Promise.resolve());
    service.getHistory.and.returnValue([
      { tracking_number: 'A1', status: 'Delivered', created_at: '2024-01-01T00:00:00Z' },
      { tracking_number: 'B2', status: 'In transit', created_at: '2024-01-02T00:00:00Z' }
    ]);

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [{ provide: TrackingHistoryService, useValue: service }]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('filteredHistory should filter by search term, status and date', () => {
    component.searchTerm = 'A1';
    expect(component.filteredHistory.length).toBe(1);

    component.searchTerm = '';
    component.filterStatus = 'in transit';
    expect(component.filteredHistory.length).toBe(1);

    component.filterStatus = '';
    component.filterDate = '2024-01-01';
    expect(component.filteredHistory.length).toBe(1);
  });

  it('sortedHistory should sort ascending and descending', () => {
    component.sortAsc = false;
    let sorted = component.sortedHistory;
    expect(sorted[0].tracking_number).toBe('B2');

    component.toggleSort();
    sorted = component.sortedHistory;
    expect(sorted[0].tracking_number).toBe('A1');
  });
});


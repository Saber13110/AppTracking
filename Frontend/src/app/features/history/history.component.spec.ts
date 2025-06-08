import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryComponent } from './history.component';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        {
          provide: TrackingHistoryService,
          useValue: {
            syncWithServer: () => Promise.resolve(),
            getHistory: () => ['B', 'A', 'C']
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should filter history', () => {
    component.filter = 'A';
    expect(component.filteredHistory).toEqual(['A']);
  });

  it('should sort ascending and descending', () => {
    component.sortDesc = false;
    expect(component.filteredHistory).toEqual(['A', 'B', 'C']);
    component.toggleSort();
    expect(component.filteredHistory).toEqual(['C', 'B', 'A']);
  });
});

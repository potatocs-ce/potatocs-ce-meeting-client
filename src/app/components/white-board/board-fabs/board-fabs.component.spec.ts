import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardFabsComponent } from './board-fabs.component';

describe('BoardFabsComponent', () => {
  let component: BoardFabsComponent;
  let fixture: ComponentFixture<BoardFabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoardFabsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardFabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

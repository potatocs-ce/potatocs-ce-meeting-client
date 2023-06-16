import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSlideViewComponent } from './board-slide-view.component';

describe('BoardSlideViewComponent', () => {
  let component: BoardSlideViewComponent;
  let fixture: ComponentFixture<BoardSlideViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoardSlideViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardSlideViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

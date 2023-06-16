import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardNavComponent } from './board-nav.component';

describe('BoardNavComponent', () => {
  let component: BoardNavComponent;
  let fixture: ComponentFixture<BoardNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoardNavComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

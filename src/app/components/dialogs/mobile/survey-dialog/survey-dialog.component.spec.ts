import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyDialogComponent } from './survey-dialog.component';

describe('SurveyDialogComponent', () => {
  let component: SurveyDialogComponent;
  let fixture: ComponentFixture<SurveyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SurveyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

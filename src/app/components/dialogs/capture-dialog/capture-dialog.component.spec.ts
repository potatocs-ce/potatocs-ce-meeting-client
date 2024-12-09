import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptureDialogComponent } from './capture-dialog.component';

describe('CaptureDialogComponent', () => {
  let component: CaptureDialogComponent;
  let fixture: ComponentFixture<CaptureDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptureDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaptureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

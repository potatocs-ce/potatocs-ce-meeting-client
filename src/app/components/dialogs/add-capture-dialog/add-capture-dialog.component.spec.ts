import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCaptureDialogComponent } from './add-capture-dialog.component';

describe('AddCaptureDialogComponent', () => {
  let component: AddCaptureDialogComponent;
  let fixture: ComponentFixture<AddCaptureDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCaptureDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCaptureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

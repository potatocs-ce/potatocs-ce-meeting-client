import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudienceVideoComponent } from './audience-video.component';

describe('AudienceVideoComponent', () => {
  let component: AudienceVideoComponent;
  let fixture: ComponentFixture<AudienceVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudienceVideoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AudienceVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

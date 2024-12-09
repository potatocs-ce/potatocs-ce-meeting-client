import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudienceComponent } from './audience.component';

describe('AudienceComponent', () => {
  let component: AudienceComponent;
  let fixture: ComponentFixture<AudienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudienceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AudienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

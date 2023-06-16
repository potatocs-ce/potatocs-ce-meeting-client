import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceCheckComponent } from './device-check.component';

describe('DeviceCheckComponent', () => {
  let component: DeviceCheckComponent;
  let fixture: ComponentFixture<DeviceCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeviceCheckComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

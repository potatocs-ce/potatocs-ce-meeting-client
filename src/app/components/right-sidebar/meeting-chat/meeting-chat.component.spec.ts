import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingChatComponent } from './meeting-chat.component';

describe('MeetingChatComponent', () => {
  let component: MeetingChatComponent;
  let fixture: ComponentFixture<MeetingChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeetingChatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeetingChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { MeetingService } from './meetingAPI.service';

describe('MeetingService', () => {
  let service: MeetingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeetingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

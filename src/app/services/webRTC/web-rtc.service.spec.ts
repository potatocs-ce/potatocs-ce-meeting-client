import { TestBed } from '@angular/core/testing';

import { WebRTCService } from './web-rtc.service';

describe('WebRTCService', () => {
  let service: WebRTCService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebRTCService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { MediasoupService } from './mediasoup.service';

describe('MediasoupService', () => {
  let service: MediasoupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediasoupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

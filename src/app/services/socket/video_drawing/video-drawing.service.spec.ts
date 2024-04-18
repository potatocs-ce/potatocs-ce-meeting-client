import { TestBed } from '@angular/core/testing';

import { VideoDrawingService } from './video-drawing.service';

describe('VideoDrawingService', () => {
  let service: VideoDrawingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoDrawingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

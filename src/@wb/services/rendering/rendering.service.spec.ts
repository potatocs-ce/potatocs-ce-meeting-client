import { TestBed } from '@angular/core/testing';

import { RenderingService } from './rendering.service';

describe('RenderingService', () => {
  let service: RenderingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenderingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

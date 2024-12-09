import { TestBed } from '@angular/core/testing';

import { StackImageService } from './stack-image.service';

describe('StackImageService', () => {
  let service: StackImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StackImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { DocApiService } from './doc-api.service';

describe('DocApiService', () => {
  let service: DocApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

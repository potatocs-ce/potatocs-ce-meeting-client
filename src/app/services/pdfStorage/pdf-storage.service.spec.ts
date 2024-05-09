import { TestBed } from '@angular/core/testing';

import { PdfStorageService } from './pdf-storage.service';

describe('PdfStorageService', () => {
  let service: PdfStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

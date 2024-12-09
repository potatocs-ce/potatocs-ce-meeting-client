import { TestBed } from '@angular/core/testing';

import { PdfDrawingService } from './pdf-drawing.service';

describe('PdfDrawingService', () => {
  let service: PdfDrawingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfDrawingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

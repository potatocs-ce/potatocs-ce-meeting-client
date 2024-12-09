import { TestBed } from '@angular/core/testing';

import { DocSocketService } from './doc-socket.service';

describe('DocSocketService', () => {
  let service: DocSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

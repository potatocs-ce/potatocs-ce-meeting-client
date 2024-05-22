import { TestBed } from '@angular/core/testing';

import { RoleSocketService } from './role-socket.service';

describe('RoleSocketService', () => {
  let service: RoleSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

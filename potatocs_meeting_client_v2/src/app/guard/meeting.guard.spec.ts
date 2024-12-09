import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { meetingGuard } from './meeting.guard';

describe('meetingGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => meetingGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { SurveySocketService } from './survey-socket.service';

describe('SurveySocketService', () => {
  let service: SurveySocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SurveySocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

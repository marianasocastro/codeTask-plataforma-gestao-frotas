import { TestBed } from '@angular/core/testing';

import { POIsService } from './pois.service';

describe('POIsService', () => {
  let service: POIsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(POIsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

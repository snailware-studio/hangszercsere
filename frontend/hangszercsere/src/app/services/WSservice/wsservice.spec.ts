import { TestBed } from '@angular/core/testing';

import { WSservice } from './wsservice';

describe('WSservice', () => {
  let service: WSservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WSservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

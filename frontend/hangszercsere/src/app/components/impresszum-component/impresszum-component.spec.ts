import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpresszumComponent } from './impresszum-component';

describe('ImpresszumComponent', () => {
  let component: ImpresszumComponent;
  let fixture: ComponentFixture<ImpresszumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImpresszumComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpresszumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

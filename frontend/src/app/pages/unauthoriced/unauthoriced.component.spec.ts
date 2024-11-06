import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnauthoricedComponent } from './unauthoriced.component';

describe('UnauthoricedComponent', () => {
  let component: UnauthoricedComponent;
  let fixture: ComponentFixture<UnauthoricedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthoricedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnauthoricedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

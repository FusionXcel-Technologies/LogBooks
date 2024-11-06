import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportingsComponent } from './reportings.component';

describe('ReportingsComponent', () => {
  let component: ReportingsComponent;
  let fixture: ComponentFixture<ReportingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

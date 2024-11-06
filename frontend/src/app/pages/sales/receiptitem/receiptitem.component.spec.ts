import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptitemComponent } from './receiptitem.component';

describe('ReceiptitemComponent', () => {
  let component: ReceiptitemComponent;
  let fixture: ComponentFixture<ReceiptitemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptitemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptitemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

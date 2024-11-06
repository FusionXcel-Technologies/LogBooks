import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryItemTableRowComponent } from './inventory-item-table-row.component';

describe('InventoryItemTableRowComponent', () => {
  let component: InventoryItemTableRowComponent;
  let fixture: ComponentFixture<InventoryItemTableRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryItemTableRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryItemTableRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

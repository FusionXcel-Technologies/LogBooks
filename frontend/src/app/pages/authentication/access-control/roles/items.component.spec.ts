import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolesItemsComponent } from './items.component';


describe('ItemsComponent', () => {
  let component: RolesItemsComponent;
  let fixture: ComponentFixture<RolesItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesItemsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RolesItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

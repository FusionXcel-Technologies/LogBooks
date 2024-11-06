import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarItemWithChildsComponent } from './sidebar-item-with-childs.component';

describe('SidebarItemWithChildsComponent', () => {
  let component: SidebarItemWithChildsComponent;
  let fixture: ComponentFixture<SidebarItemWithChildsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarItemWithChildsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarItemWithChildsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

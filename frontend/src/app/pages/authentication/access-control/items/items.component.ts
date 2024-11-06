import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemComponent } from './item/item.component';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [ItemComponent, CommonModule, HttpClientModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class ItemsComponent {
  @Input() items: any[] = []; // Accepts an array of items as input
  @Input() onClickEnabled: any;
  @Output() forwardCloneItem = new EventEmitter<any>();
  @Output() forwardOnClickItem = new EventEmitter<any>();
  roles: any;

  constructor(private http: HttpClient) { }

  handleCloneFromGrandchild(item: any) {
    this.forwardCloneItem.emit(item);  // Forward it to the grandparent
  }

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    // Fetch receipts from the server
    const receiptsUrl = '/read/roles/0/99999999999999999999';
    this.http.get(receiptsUrl).subscribe({
      next: (response: any) => {
        this.roles = this.roles = response
          .slice()
          .sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
          .slice(0, 30)
          .map((role: any) => ({
            id: role.id,    // Extracting the id
            name: role.name // Extracting the name
          }));
      },
      error: (error: any) => {
        console.error('Error fetching receipts:', error);
      }
    });
  }

  handleOnClickFromGrandchild(item: any) {
    this.forwardOnClickItem.emit(item);  // Forward it to the grandparent
  }
}

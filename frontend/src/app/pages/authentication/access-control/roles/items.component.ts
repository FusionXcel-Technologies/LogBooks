import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemComponent } from './item/item.component';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ModalPopupComponent } from '../../../../components/modal-popup/modal-popup.component';
import { FormsModule } from '@angular/forms';

export const permissions: any = [
  'home',
  'inventory_management',
  'sales',
  'access_control',
  'reportins_sales',
  'settings'
];

@Component({
  selector: 'app-roles-items',
  standalone: true,
  imports: [ItemComponent, CommonModule, HttpClientModule, ModalPopupComponent, FormsModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class RolesItemsComponent {
  @Input() onClickEnabled: any;
  @Output() forwardCloneItem = new EventEmitter<any>();
  @Output() forwardOnClickItem = new EventEmitter<any>();
  item: any = { permissions: [] };
  modalVisible = false;
  items: any = [];
  permissions: any = permissions;
  isDropdownVisible: boolean = false;


  constructor(private http: HttpClient, private router: Router) { }

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  convertToTitleCase(text: any) {
    return text
      .split('_') // Split by underscore
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
      .join(' '); // Join with space
  }

  getFormattedPermissions(): string {
    return this.item.permissions.length > 0
      ? this.item.permissions.map((permission: any) => this.convertToTitleCase(permission)).join(', ')
      : 'Select Permissions';
  }

  public addPermission = (pr: any) => {
    const index = this.item.permissions.indexOf(pr);

    if (index === -1) {
      // Permission doesn't exist, add it
      this.item.permissions.push(pr);
    } else {
      // Permission exists, remove it
      this.item.permissions.splice(index, 1);
    }
  }

  removePermission(pr: any) {
    this.item.permissions = this.item.permissions.filter((p: any) => p !== pr);
  }

  toggleModal() {
    this.modalVisible = !this.modalVisible;
  }
  ngOnInit() {
    this.loadRoles();
  }

  addItem() {
    // Check if item name and permissions are provided
    if (!this.item.name || !this.item.permissions.length) {
      console.warn('Item name and permissions are required.');
      return;
    }

    const headers = { 'Content-Type': 'application/json' };
    this.toggleModal();

    this.http.post('/add/roles', this.item, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Item added successfully', response);
          // Reset form after successful submission
          this.resetItem();
          this.loadRoles(); // Reload roles
        },
        error: (error: any) => {
          console.error('Error adding item', error);
          // Optional: Display a user-friendly error message
          this.showErrorMessage('Failed to add item. Please try again.');
        }
      });
  }

  // Reset item properties
  private resetItem() {
    this.item = { name: '', permissions: [] }; // Reset name along with permissions
  }

  // Optional: Method to show user-friendly error messages
  private showErrorMessage(message: string) {
    // Implementation for showing an error message (e.g., using a toast or alert)
    alert(message); // Example: simple alert
  }

  handleCloneFromGrandchild(item: any) {
    this.forwardCloneItem.emit(item);  // Forward it to the grandparent
  }

  handleOnClickFromGrandchild(item: any) {
    this.item = item;
    this.modalVisible = true; // Show the modal when clicking on a receipt item
  }

  loadRoles() {
    // Fetch receipts from the server
    const receiptsUrl = '/read/roles/0/99999999999999999999';
    this.http.get(receiptsUrl).subscribe({
      next: (response: any) => {
        this.items = response.slice().sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 30);
      },
      error: (error: any) => {
        console.error('Error fetching receipts:', error);
      }
    });
  }
}

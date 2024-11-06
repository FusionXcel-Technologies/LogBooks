import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ModalPopupComponent } from '../../../../../components/modal-popup/modal-popup.component';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [ModalPopupComponent, CommonModule, FormsModule],
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
  providers: [DatePipe]  // Provide DatePipe if needed
})
export class ItemComponent {
  @Input() item: any;
  @Input() roles: any = [];
  @Input() onClickEnabled: boolean = false;
  modalVisible = false;
  edit = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  itemDeleted: boolean = false;

  @Output() cloneItem = new EventEmitter<any>();
  @Output() onSelectItem = new EventEmitter<any>();


  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.addRole(this.roles[0])
    this.addRole(this.roles[0])
  }

  addRole = (pr: { id: string; name: string }) => {
    // Ensure item is defined and is an object
    if (!this.item || typeof this.item !== 'object') {
      console.error('this.item is not defined or not an object:', this.item);
      return;
    }

    if (!this.item.roles) {
      this.item.roles = []; // Initialize if undefined
    }

    // Check if the role is already included
    const index = this.item.roles.findIndex((role: any) => role.id === pr.id);

    if (index === -1) {
      // Role doesn't exist, add it
      this.item.roles.push(pr);
    } else {
      // Role exists, remove it
      this.item.roles.splice(index, 1);
    }
  };


  isRoleSelected(role: any): boolean {
    return this.item.roles.findIndex((r: any) => r.id === role.id) !== -1;
  }


  convertToTitleCase(text: any): string {
    if (typeof text !== 'string') {
      return ''; // Return an empty string or handle the error as needed
    }

    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getFormattedRoles(): string {
    // Check if item and roles are defined
    if (!this.item || !this.item.roles) {
      return 'Select roles'; // Default message if no roles are present
    }

    // Map over roles to convert them to title case
    return this.item.roles.length > 0
      ? this.item.roles.map((role: { name: string }) => this.convertToTitleCase(role.name)).join(', ')
      : 'Select roles';
  }

  onClone() {
    this.toggleModal();
    // Create a clone of the item and add the 'cacheBrust' property
    let clone = { ...this.item, cacheBrust: Date.now() };

    // Emit the cloned item
    this.cloneItem.emit(clone);
  }

  toggleModal() {
    this.modalVisible = !this.modalVisible;
    console.log(this.modalVisible);
  }

  isDropdownVisible: boolean = false;

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  toggleEdit() {
    this.toggleModal();
    this.edit = true;
    this.successMessage = null;
    this.errorMessage = null;
  }

  deleteItem() {
    const deleteUrl = `/delete/user/${this.item.id}`;
    this.http.delete(deleteUrl).subscribe({
      next: (response: any) => {
        console.log('Item deleted successfully', response);
        // Optionally provide feedback to the user, like closing the modal or showing a notification
        this.modalVisible = false;
        // You can also reset the form or the `item` object if necessary
      },
      error: (error: any) => {
        console.error('Error deleting item', error);
        // Optionally handle errors, e.g., show an error message to the user
      }
    });
    this.itemDeleted = true;
  }

  saveItem() {
    if (!this.item.firstName || !this.item.firstName) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const editUrl = `/update/user/${this.item.id}`;

    this.http.put(editUrl, this.item)
      .pipe(
        catchError((error) => {
          this.errorMessage = 'Failed to save item. Please try again later.';
          console.error('Error saving item:', error);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.successMessage = 'Item saved successfully!';
          this.edit = false; // Exit edit mode after saving
          this.errorMessage = null;
          this.modalVisible = false;
        }
      });
  }

  getAdditionalFields(item: any): string[] {
    const knownFields = ['createdAt', 'lastUpdated', 'password', 'id', 'firstName', 'lastName', 'phoneNumber', 'roles'];
    return Object.keys(item).filter(key => !knownFields.includes(key)); // Return any keys that aren't in the known fields
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ModalPopupComponent } from '../../../../../components/modal-popup/modal-popup.component';
import { permissions, RolesItemsComponent } from '../items.component';

@Component({
  selector: 'app-role-item',
  standalone: true,
  imports: [ModalPopupComponent, CommonModule, FormsModule],
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
  providers: [DatePipe]  // Provide DatePipe if needed
})
export class ItemComponent {
  @Input() item: any;
  @Input() onClickEnabled: boolean = false;

  modalVisible = false;
  edit = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  itemDeleted: boolean = false;
  isDropdownVisible: boolean = false;
  permissions: any = permissions
  @Output() cloneItem = new EventEmitter<any>();
  @Output() onSelectItem = new EventEmitter<any>();


  constructor(private http: HttpClient) { }

  convertToTitleCase(text: any) {
    return text
      .split('_') // Split by underscore
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
      .join(' '); // Join with space
  }

  getFormattedPermissions(): string {
    return this.item?.permissions?.length > 0
      ? this.item.permissions.map((permission: any) => this.convertToTitleCase(permission)).join(', ')
      : 'N/A';
  }

  onClone() {
    this.toggleModal();
    // Create a clone of the item and add the 'cacheBrust' property
    let clone = { ...this.item, cacheBrust: Date.now() };

    // Emit the cloned item
    this.cloneItem.emit(clone);
  }

  toggleModal() {
    // this.modalVisible = !this.modalVisible;
  }

  toggleEdit() {
    this.modalVisible = true;
    this.edit = !this.edit;
    this.successMessage = null;
    this.errorMessage = null;
    // let clone = { ...this.item, cacheBrust: Date.now() };

    // // Emit the cloned item
    // this.cloneItem.emit(clone);
  }

  deleteItem() {
    const deleteUrl = `/delete/roles/${this.item.id}`;
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

  addPermission = (pr: any) => {
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

  saveItem() {

    const editUrl = `/update/roles/${this.item.id}`;

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

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }
  deactivateRole() {
    this.item.deactivated = !this.item.deactivated;
    this.saveItem();
  }

  getAdditionalFields(item: any): string[] {
    const knownFields = ['createdAt', 'permissions', 'created', 'name', 'lastUpdated', 'deactivated', 'id', 'firstName', 'lastName', 'phoneNumber'];

    return Object.keys(item).filter(key => !knownFields.includes(key)); // Return any keys that aren't in the known fields
  }
}

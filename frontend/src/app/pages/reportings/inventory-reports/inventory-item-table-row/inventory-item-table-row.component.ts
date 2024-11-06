import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ModalPopupComponent } from '../../../../components/modal-popup/modal-popup.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-item-table-row',
  standalone: true,
  imports: [ModalPopupComponent, CommonModule, FormsModule],
  templateUrl: './inventory-item-table-row.component.html',
  styleUrl: './inventory-item-table-row.component.scss'
})
export class InventoryItemTableRowComponent {
  @Input() item: any;

  modalVisible = false;
  edit = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  itemDeleted: boolean = false;

  @Output() cloneItem = new EventEmitter<any>();
  @Output() onSelectItem = new EventEmitter<any>();


  constructor(private http: HttpClient) { }

  onClone() {
    this.toggleModal();
    // Create a clone of the item and add the 'cacheBrust' property
    let clone = { ...this.item, cacheBrust: Date.now() };

    // Emit the cloned item
    this.cloneItem.emit(clone);
  }

  toggleModal() {
    this.modalVisible = !this.modalVisible;
  }

  getTitle(): string {
    return this.edit ? `Edit ${this.item.name}` : this.item.name;
  }


  toggleEdit() {
    this.edit = !this.edit;
    this.successMessage = null;
    this.errorMessage = null;
  }

  deleteItem() {
    const deleteUrl = `/delete/inventory_items/${this.item.id}`;
    this.http.delete(deleteUrl).subscribe({
      next: (response: any) => {
        console.log('Item deleted successfully', response);
        // Optionally provide feedback to the user, like closing the modal or showing a notification
        this.modalVisible = false;
        // You can also reset the form or the `item` object if necessary
        this.item = {
          name: '',
          stock: '',
          minStock: '',
          buyPrice: '',
          salePrice: '',
          barcode: ''
        };
      },
      error: (error: any) => {
        console.error('Error deleting item', error);
        // Optionally handle errors, e.g., show an error message to the user
      }
    });
    this.itemDeleted = true;
  }

  saveItem() {
    if (!this.item.name || !this.item.stock || !this.item.buyPrice || !this.item.salePrice) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const editUrl = `/update/inventory_items/${this.item.id}`;

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
        }
      });
  }

  getAdditionalFields(item: any): string[] {
    const knownFields = ['name', 'stock', 'minStock', 'buyPrice', 'salePrice', 'barcode', 'created', 'lastUpdated'];

    return Object.keys(item).filter(key => !knownFields.includes(key)); // Return any keys that aren't in the known fields
  }
}

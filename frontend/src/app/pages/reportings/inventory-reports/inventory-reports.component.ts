import { Component, ElementRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx'; // Import xlsx for Excel export
import jsPDF from 'jspdf'; // Import jsPDF
import 'jspdf-autotable'; // Import jsPDF autoTable plugin
import { ModalPopupComponent } from '../../../components/modal-popup/modal-popup.component';
import { ItemsComponent } from '../../inventory/items/items.component';
import { InventoryItemTableRowComponent } from './inventory-item-table-row/inventory-item-table-row.component';
import { AuthenticationService } from '../../authentication/authentication.service';

@Component({
  selector: 'app-inventory-reports',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    ModalPopupComponent,
    FormsModule,
    HttpClientModule,
    CommonModule,
    ItemsComponent,
    InventoryItemTableRowComponent
  ],
  templateUrl: './inventory-reports.component.html',
  styleUrls: ['./inventory-reports.component.scss'] // Fixed typo: styleUrl -> styleUrls
})
export class InventoryReportsComponent {
  searchValue: string = '';
  selectedCategory: string = 'current inventory';
  tables: any = {};
  display_table: any = [];
  item = {
    name: '',
    stock: '',
    minStock: '',
    buyPrice: '',
    salePrice: '',
    barcode: '',
    sold: 0
  };
  isDropdownVisible: boolean = false; // Initial state
  modalVisible = false;
  loadingAmo: any = 0;

  @ViewChild('fileInput') fileInput!: ElementRef;
  ngOnInit() {
    this.setupKeyboardShortcuts();
    this.loadTables(0, 10);
    this.setTheme();
  }


  constructor(private http: HttpClient, private router: Router, private auth: AuthenticationService) { }

  setTheme() {
    let tm = this.auth.getStoredTheme();
    const a: any = document.querySelector('app-modal-popup .container');
    a.style.backgroundColor = tm.text_color;
  }


  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'N') {
        event.preventDefault(); // Prevent the default action (if any)
        this.toggleModal();
        this.focusAddItemNameInput();
      }

      if (event.key === 'Enter' && document.activeElement?.classList.contains('input')) {
        event.preventDefault(); // Prevent the default action (if any)
        this.searchItems();
      }
      if (event.shiftKey && event.key === 'S') {
        event.preventDefault(); // Prevent the default action (if any)
        this.focusSearchInput();
      }
      if (event.shiftKey && event.key === 'C') {
        event.preventDefault(); // Prevent the default action (if any)
        this.searchValue = '';
      }
    });
  }

  toggleModal() {
    this.modalVisible = !this.modalVisible;
  }

  addItem() {
    const headers = { 'Content-Type': 'application/json' }; // Optional, HttpClient sets JSON content type automatically.

    this.http.post('/add/inventory_items',
      {
        ...{
          name: 'N/A',
          stock: 0,
          minStock: 0,
          buyPrice: 0,
          salePrice: 0,
          barcode: 0,
          sold: 0
        },
        ...this.item
      },
      { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Item added successfully', response);
          // Reset form after successful submission
          this.item = {
            name: '',
            stock: '',
            minStock: '',
            buyPrice: '',
            salePrice: '',
            barcode: '',
            sold: this.item.sold + 1 * 10
          };
          //  this.toggleModal(); // Close the modal
        },
        error: (error: any) => {
          console.error('Error adding item', error);
        }
      });
  }

  focusSearchInput() {
    // Assuming there is a reference to the input field

    const inputField = document.querySelector('.input') as HTMLInputElement;
    if (inputField) {
      inputField.focus();
    }
  }

  focusAddItemNameInput() {
    // Ensure the modal is visible before trying to focus the input
    if (this.modalVisible) {
      const inputField = document.querySelector('.add-item-name') as HTMLInputElement;
      if (inputField) {
        inputField.focus();
      }
    }
  }

  onScroll(event: any): void {
    const element = event.target;

    // Calculate the percentage of the container scrolled
    const scrollPosition = element.scrollTop + element.clientHeight;
    const totalHeight = element.scrollHeight;

    const scrollPercentage = (scrollPosition / totalHeight) * 100;

    if (scrollPercentage >= 75) {
      if (this.loadingAmo != this.display_table.length + 10) {
        this.loadingAmo = this.display_table.length + 10;
        this.loadTables(0, this.display_table.length + 10);
      }
    }
  }


  cloneItem(item: any): any {
    console.log(111111);
    const clonedItem = item;
    this.item = clonedItem; // Update the current item with the cloned item
    this.toggleModal();
  }

  onFileChange(event: any) {
    const file = event.target.files[0]; // Get the first file
    if (file) {
      this.processExcelData(file); // Pass the file to the process function
    }
  }


  // Function to process Excel data
  // processExcelData(data: any[]) {
  //   const headers = data[0]; // First row is the header
  //   const rows = data.slice(1); // Remaining rows are the item data

  //   // Create a mapping of column names to their respective indexes
  //   const headerMap = headers.reduce((acc: any, header: string, index: number) => {
  //     acc[header.toLowerCase()] = index; // Convert header to lowercase for consistent access
  //     return acc;
  //   }, {});

  //   rows.forEach((row) => {
  //     // Create the basic item object with known fields
  //     const item: any = {
  //       name: row[headerMap['name']] || 'N/A',
  //       stock: row[headerMap['stock']] || 0,
  //       minStock: row[headerMap['minStock']] || 0,
  //       buyPrice: row[headerMap['buyprice']] || 0,
  //       salePrice: row[headerMap['saleprice']] || 0,
  //       barcode: row[headerMap['barcode']] || 'N/A',
  //       sold: row[headerMap['sold']] || 0
  //     };

  //     // Loop through the remaining headers and add any additional fields dynamically
  //     Object.keys(headerMap).forEach((key) => {
  //       if (!item.hasOwnProperty(key)) {
  //         item[key] = row[headerMap[key]] || null; // Add any extra fields that are not part of the known ones
  //       }
  //     });

  //     this.addItemFromExcel(item); // Call the function to add each item
  //   });
  // }

  // // Function to add an item to the inventory (from Excel file)
  // addItemFromExcel(item: any) {
  //   const headers = { 'Content-Type': 'application/json' };

  //   this.http.post('/add/inventory_items',
  //     { ...item },
  //     { headers })
  //     .subscribe({
  //       next: (response: any) => {
  //         console.log('Item added successfully from Excel', response);
  //       },
  //       error: (error: any) => {
  //         console.error('Error adding item from Excel', error);
  //       }
  //     });
  // }

  processExcelData(data: any) {
    const formData = new FormData();
    formData.append('file', data); // Append the file to the formData

    const headers = { 'enctype': 'multipart/form-data' }; // Required for file upload

    this.http.post(`/add/bulk/inventory_items`, formData, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Excel file uploaded and processed successfully', response);
        },
        error: (error: any) => {
          console.error('Error uploading and processing Excel file', error);
        }
      });
  }

  // Function to add multiple items to the inventory (from Excel file)
  addItemsFromExcel(items: any[]) {
    const headers = { 'Content-Type': 'application/json' };

    this.http.post('/add/bulk/inventory_items',
      { items },
      { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Items added successfully from Excel in bulk', response);
        },
        error: (error: any) => {
          console.error('Error adding items from Excel in bulk', error);
        }
      });
  }


  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible; // Toggle dropdown visibility
  }

  exportOption(format: string) {
    if (format === 'Excel') {
      this.exportToExcel();
    } else if (format === 'PDF') {
      this.exportToPDF();
    } else {
      console.log(`Exporting as ${format}`);
      // Handle other export options here
    }
  }


  searchItems() {
    this.searchInventory();
  }

  onSelectCategory(nm: string) {
    this.selectedCategory = nm;
  }

  loadTables(start: any, end: any) {
    const url = `/read/inventory_items/${start}/${end}`;

    this.http.get<any[]>(url).subscribe({
      next: (response) => {
        this.tables.out_of_stock = response.filter((item: any) => {
          // Calculate if the item is out of stock
          const isOutOfStock = (item.stock - item.sold) <= 0;
          return isOutOfStock; // Filter for items that are out of stock
        });
        this.tables.current_inventory = response;
        if (this.selectedCategory == 'current inventory') {
          this.display_table = response;
        } else if (this.selectedCategory == 'out of stock') {
          this.display_table = this.tables.out_of_stock;
        }
      },
      error: (error) => {
        console.log('Error fetching most sold items', error);
      }
    });
  }

  searchInventory() {
    const searchTerm = this.searchValue.toLowerCase();

    // Filter the current inventory
    this.display_table = this.tables.current_inventory.filter((item: any) => {
      return Object.keys(item).some((key) => {
        const value = item[key];
        return (
          (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) ||
          (typeof value === 'number' && value.toString().includes(searchTerm))
        );
      });
    });


    const searchUrl = `/search?keyword=${searchTerm}&schema=inventory_items`;

    this.http.get<any>(searchUrl).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.display_table = response;

          this.tables.current_inventory = [...this.tables.current_inventory, ...response]; // Merge new items
        }
      },
      error: (error) => {
        console.error('Error during search', error);
      }
    });

  }

  fetchOutOfStock() {

    const url = `/read/inventory_items/0/999999999999999`;

    this.http.get<any[]>(url).toPromise()
      .then((response: any) => {
        this.display_table = response.filter((item: any) => {
          // Calculate if the item is out of stock
          const isOutOfStock = (item.stock - item.sold) <= 0;
          return isOutOfStock; // Filter for items that are out of stock
        });
      })
      .catch(error => {
        console.error('Error fetching inventory items', error);
      });


  }


  // Function to export data to Excel
  exportToExcel() {
    const url = `/read/inventory_items/0/999999999999999`;

    this.http.get<any[]>(url).toPromise()
      .then(response => {
        const data_to_export: any = response;

        // Create a worksheet from the data
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data_to_export);

        // Create a workbook
        const workbook: XLSX.WorkBook = {
          Sheets: { 'Inventory Report': worksheet },
          SheetNames: ['Inventory Report']
        };

        // Export the workbook to a buffer and download as .xlsx
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Trigger download
        this.saveAsFile(excelBuffer, 'Inventory_Report', 'xlsx');
      })
      .catch(error => {
        console.error('Error fetching inventory items', error);
      });
  }

  // Function to export data to PDF
  exportToPDF() {
    const doc = new jsPDF();

    // Add title
    doc.text('Inventory Report', 14, 20);

    if (this.display_table.length > 0) {
      const tableColumnHeaders = Object.keys(this.display_table[0]); // Extract headers from object keys
      const tableRows = this.display_table.map((item: any) => {
        return tableColumnHeaders.map(header => item[header]); // Map values in the order of headers
      });

      // Configure column widths by setting the columnStyles option
      const columnStyles = tableColumnHeaders.reduce((acc: any, header, index) => {
        acc[index] = { cellWidth: 30 }; // Set each column width to 'auto', can also use fixed numbers like 50, 100, etc.
        return acc;
      }, {});

      // Add table to PDF using autoTable
      (doc as any).autoTable({
        head: [tableColumnHeaders], // Headers
        body: tableRows, // Data rows
        startY: 30, // Start position below the title
        theme: 'striped', // Table theme
        headStyles: { fillColor: [22, 160, 133] }, // Custom header color (optional)
        columnStyles: columnStyles, // Apply column widths
        styles: {
          cellPadding: 3, // Adjust cell padding if necessary
          fontSize: 10, // Font size for table content
        },
      });

      // Save the PDF
      doc.save('Inventory_Report.pdf');
    } else {
      console.log('No data available to export.');
    }
  }

  // Helper function to trigger download for Excel
  saveAsFile(buffer: any, fileName: string, fileType: string): void {
    const data: Blob = new Blob([buffer], { type: fileType });
    const link: HTMLAnchorElement = document.createElement('a');
    const url = URL.createObjectURL(data);

    link.href = url;
    link.download = `${fileName}.${fileType}`;
    link.click();
    URL.revokeObjectURL(url); // Release the object URL after download
  }
}

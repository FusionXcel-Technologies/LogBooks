import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ItemsComponent } from '../inventory/items/items.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { ReceiptitemComponent } from './receiptitem/receiptitem.component';
import { ModalPopupComponent } from '../../components/modal-popup/modal-popup.component';
import { ReceiptComponent } from './receipt/receipt.component';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';


@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    ItemsComponent,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReceiptitemComponent,
    ModalPopupComponent,
    ReceiptComponent
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent {

  constructor(private http: HttpClient, private router: Router) { }
  customItemAddModalVisible: any = false;
  receipt: any = {
    items: [], // Array to hold items in the receipt
    total: 0,  // Total price of the items
    paid: 0,
    balance: 0
  };
  searchKey = 'name'; // Field to search by (e.g., 'name')
  searchValue = ''; // Value to search for
  searchResults: any[] = []; // Type the searchResults array
  searchTimeout: any = 500;
  newItem: any = {};
  viewReceipts: boolean = false;
  receipts: any;
  printersList: any = [];
  typedAm = '';
  selectPrinterModalVisible = false;
  selectedPrinter = 0;
  inputFocused: boolean = false;
  cachedResults: any;
  helightedItem: number = 0;

  toggleSelectPrinterMOdalVisible() {
    this.selectPrinterModalVisible = !this.selectPrinterModalVisible;
  }

  isSelectedPrinter(prin: string) {
    const printerIndex = this.printersList.findIndex((i: any) => i === prin);
    return this.selectedPrinter == printerIndex;
  }

  selectPrinter(prin: string) {
    // Find the index of the selected printer
    const printerIndex = this.printersList.findIndex((i: any) => i === prin);

    // Set the selectedPrinter index
    this.selectedPrinter = printerIndex;

    // Store the selected printer index in localStorage
    localStorage.setItem('selectedPrinter', printerIndex.toString());
  }

  getPrinters() {
    const url = '/printers';

    this.http.get(url).subscribe(
      (response: any) => {
        // Get the stored printer index from localStorage (or default to 0 if not present)
        const storedPrinter: number = parseInt(localStorage.getItem('selectedPrinter') || '0', 10);

        // Assign response to the printers list
        this.printersList = response;

        // Set the selectedPrinter based on the stored index (make sure it’s within bounds)
        this.selectedPrinter = storedPrinter;

        console.log('Network interfaces:', response);
      },
      (error) => {
        console.error('Error fetching network interfaces:', error);
      }
    );
  }

  openCustomItemModal() {
    this.customItemAddModalVisible = !this.customItemAddModalVisible;
  }

  toggleViewReceipts() {
    this.viewReceipts = !this.viewReceipts;
    if (this.viewReceipts) {
      this.loadReceipts()
    }
  }

  loadReceipts() {
    // Fetch receipts from the server
    const receiptsUrl = '/read/sales/0/99999999999999999999';
    this.http.get(receiptsUrl).subscribe({
      next: (response: any) => {
        console.log(response);

        this.receipts = response.slice().sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 30);
      },
      error: (error: any) => {
        console.error('Error fetching receipts:', error);
      }
    });
  }

  ngOnInit() {
    this.getPrinters();
    this.setupKeyboardShortcuts();
    this.fetchMostSoldItems();
  }

  setupKeyboardShortcuts() {
    let lastKeyTime = Date.now();
    let ctrlPressed = false;

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (event.ctrlKey) {
        ctrlPressed = true; // Track Ctrl key state
      }

      this.handleKeydown(event, timeDiff);
    });

    document.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        this.typedAm = '';
        ctrlPressed = false; // Reset on Ctrl release
      }
    });

    // Reset quantity when Ctrl is pressed down again
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && !ctrlPressed) {
        ctrlPressed = true; // Mark Ctrl as pressed
      }
    });
  }

  private spaceKeyTimer: any = null;

  onFocus() {
    this.inputFocused = true;
  }

  onBlur() {
    this.inputFocused = false;
  }

  onPaidValueChange() {
    // Calculate balance
    this.receipt.balance = (this.receipt.total - this.receipt.paid) * -1;

    // Log the current balance
    console.log('onPaidValueChange called, balance:', this.receipt.balance);
  }

  private handleKeydown(event: KeyboardEvent, timeDiff: number) {
    const HELPER_KEYS = ['Shift', 'Backspace', 'Enter', 'Tab', 'Control', 'Alt', 'Escape', 'AltGraph', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowLeft', '*'];
    const activeElement = document.activeElement;

    switch (true) {
      case event.shiftKey && event.key === 'S':
        event.preventDefault();
        this.focusSearchInput();
        break;
      case event.key === 'ArrowRight':
        event.preventDefault();
        if (this.helightedItem >= 0) {
          this.helightedItem = (this.helightedItem) + 1
          this.helightItem();
        } else {
          this.helightedItem = 0;
        }
        break;
      case event.key === 'Enter':
        event.preventDefault();
        this.clickHelightedItem();
        break;
      case event.key === 'ArrowLeft':
        event.preventDefault();
        if (this.helightedItem >= 0) {
          this.helightedItem = (this.helightedItem) - 1
          this.helightItem();
        } else {
          this.helightedItem = 0;
        }
        break;
      case event.key === 'ArrowDown':
        event.preventDefault();
        if (this.helightedItem >= 0) {
          this.helightedItem = (this.helightedItem) + 3
          this.helightItem();
        } else {
          this.helightedItem = 0;
        }
        break;
      case event.key === 'ArrowUp':
        event.preventDefault();
        if (this.helightedItem >= 0) {
          this.helightedItem = (this.helightedItem) - 3
          this.helightItem();
        } else {
          this.helightedItem = 0;
        }
        break;
      case event.shiftKey && event.key === 'Backspace':
        event.preventDefault();
        this.clearSearch();
        break;
      case event.shiftKey && event.key === 'H':
        event.preventDefault();
        this.toggleViewReceipts();
        break;
      case event.ctrlKey && /[.0-9]/.test(event.key):
        if (this.inputFocused) {
          return;
        }
        event.preventDefault();
        this.incrementReceiptQuantity(event.key);
        break;
      case event.key.length >= 1 && !HELPER_KEYS.includes(event.key) && this.router.url.includes('/sales') && !this.inputFocused && !(activeElement && activeElement.className === 'recharge-input'):
        if (this.inputFocused) {
          return;
        }
        event.preventDefault();

        this.handleSearchInput(event.key, timeDiff);
        break;
      case event.key === '*':
        if (!this.spaceKeyTimer) {
          this.spaceKeyTimer = setTimeout(() => {
            this.sale();
            this.spaceKeyTimer = null; // Reset the timer
          }, 300);
        }
        break;
    }
  }

  private handleKeyup(event: KeyboardEvent) {
    if (event.key === ' ') {
      if (this.spaceKeyTimer) {
        clearTimeout(this.spaceKeyTimer);
        this.spaceKeyTimer = null; // Reset the timer
      }
    }
  }

  private handleSearchInput(key: string, timeDiff: number) {
    if (timeDiff < 500) {
      this.searchValue += key;
    } else {
      this.searchValue = key;
    }

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchItems();
    }, 500);
  }

  private incrementReceiptQuantity(key: string) {
    if (key == '.') {
      this.typedAm = this.typedAm.length > 0 ? this.typedAm + '.' : '0.'
      return;
    }
    const lastItemIndex = this.receipt.items.length - 1;
    const searchItemIndex = this.searchResults.findIndex((i: any) => i.id === this.receipt.items[lastItemIndex].id);

    this.searchResults[searchItemIndex].sold = (this.searchResults[searchItemIndex].sold || 0) - this.receipt.items[lastItemIndex].quantity;

    this.typedAm += key;

    if (lastItemIndex >= 0) {

      this.receipt.items[lastItemIndex].quantity = Math.min(parseFloat(this.typedAm), this.getLastItemAvailableStock());

      this.searchResults[searchItemIndex].sold = (this.searchResults[searchItemIndex].sold || 0) + this.receipt.items[lastItemIndex].quantity;

      this.updateTotal();
    }
  }

  private getLastItemAvailableStock() {
    const lastItemIndex = this.receipt.items.length - 1;
    return lastItemIndex >= 0 ? (this.receipt.items[lastItemIndex].stock + 1 - this.receipt.items[lastItemIndex].sold) : 0;
  }

  private resetLastItemQuantity() {
    const lastItemIndex = this.receipt.items.length - 1;
    if (lastItemIndex >= 0) {
      this.receipt.items[lastItemIndex].quantity = 45654; // Reset quantity
    }
  }

  private clearSearch() {
    this.searchValue = '';
    this.searchItems(); // Trigger search to reflect cleared value
  }

  focusSearchInput() {
    const inputField = document.querySelector('.search-input') as HTMLInputElement;
    if (inputField) {
      inputField.focus();
    }
  }

  searchItems() {
    this.helightedItem = 0;
    this.helightItem();
    const searchUrl = `/search?keyword=${this.searchValue}&schema=${this.viewReceipts ? 'sales' : 'inventory_items'}`;
    this.http.get<any[]>(searchUrl).subscribe({
      next: (response) => {
        if (this.viewReceipts) {
          this.receipts = response.slice().sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 30);
        } else {
          this.searchResults = response;
          this.helightedItem = 0;
          this.helightItem();
          if (response?.length > 0) {
            this.cachedResults = [...this.cachedResults, ...response]
          }

          if (response?.length === 1) {
            this.onClickItem(response[0]);
          }
        }
      },
      error: (error) => {
        console.log('Error during search', error);
      }
    });
    // Filter the current inventory
    this.searchResults = this.cachedResults.filter((item: any) => {
      return Object.keys(item).some((key) => {
        const value = item[key];
        return (
          (typeof value === 'string' && value.toLowerCase().includes(this.searchValue)) ||
          (typeof value === 'number' && value.toString().includes(this.searchValue))
        );
      });
    });
    this.helightedItem = 0;
    this.helightItem();
  }

  fetchMostSoldItems() {
    const url = '/sort_by?entity=inventory_items&sort_by=sold&limit=20';

    this.http.get<any[]>(url).subscribe({
      next: (response) => {
        this.searchResults = response;
        this.cachedResults = response;
      },
      error: (error) => {
        console.log('Error fetching most sold items', error);
      }
    });
  }

  addToCounter(receipt: any) {
    this.receipt = receipt;
  }

  helightItem() {
    var ilt: any = this.searchResults;
    for (let i = 0; i < ilt.length; i++) {
      ilt[i].selected = i == this.helightedItem;
    }
    this.searchResults = ilt;
  }

  clickHelightedItem() {
    var ilt: any = this.searchResults;
    for (let i = 0; i < ilt.length; i++) {
      if (i == this.helightedItem) {
        this.onClickItem(ilt[i]);
      };
    }
  }

  onClickItem(item: any) {
    const searchItemIndex = this.searchResults.findIndex((i: any) => i.id === item.id);
    if (searchItemIndex !== -1) {
      // Increment the 'sold' count in searchResults
      this.searchResults[searchItemIndex].sold = (this.searchResults[searchItemIndex].sold || 0) + 1;

      // Remove the item from searchResults if the 'sold' count is <= 0
      if (this.searchResults[searchItemIndex].stock - this.searchResults[searchItemIndex].sold <= 0) {
        this.searchResults.splice(searchItemIndex, 1);
      }
    }

    // Find if the item already exists in the receipt
    const existingItemIndex = this.receipt.items.findIndex((i: any) => i.id === item.id);

    if (existingItemIndex !== -1) {
      // If the item already exists in the receipt, increment its quantity
      this.receipt.items[existingItemIndex]['quantity']++;
    } else {
      // If the item doesn't exist in the receipt, add it with a quantity of 1
      this.receipt.items.push({ ...item, quantity: 1 });
    }

    // Update the total price of the receipt
    this.updateTotal();
  }

  updateTotal() {
    this.receipt.total = this.receipt.items.reduce((acc: number, item: any) => {
      return acc + (parseFloat(item.salePrice) * parseFloat(item['quantity'].toString()));
    }, 0);
    this.onPaidValueChange();

  }

  removeItem(item: any) {
    // Find the index of the item in the receipt
    const existingItemIndex = this.receipt.items.findIndex((i: any) => i.id === item.id);

    // If the item exists in the receipt, remove it
    if (existingItemIndex !== -1) {
      // Remove the item from the receipt
      this.receipt.items.splice(existingItemIndex, 1);

      // Update the total price after removing the item
      this.updateTotal();
    } else {
      console.warn(`Item with ID ${item.id} not found in receipt.`);
    }

    // Find the index of the item in searchResults (if it exists)
    const searchItemIndex = this.searchResults.findIndex((i: any) => i.id === item.id);

    // If the item exists in searchResults, decrease the sold count
    if (searchItemIndex !== -1) {
      // Decrease the sold count, ensuring it doesn't go below zero
      const currentSold = this.searchResults[searchItemIndex].sold || 0;
      this.searchResults[searchItemIndex].sold = Math.max(0, currentSold - item.quantity);

      // Optionally handle stock availability if necessary
      const remainingStock = this.searchResults[searchItemIndex].stock - this.searchResults[searchItemIndex].sold;
      if (remainingStock > 0) {
        // Re-enable or update item availability if necessary
        // Example: Update a flag or perform any additional logic
        // this.searchResults[searchItemIndex].available = true;
      } else {
        // Optionally handle the case where stock is depleted
        // Example: Update a flag or perform any additional logic
        // this.searchResults[searchItemIndex].available = false;
      }
    } else {
      // If the item is not found in searchResults, add it back with updated sold count
      // Consider whether you want to re-add the item or handle it differently
      this.searchResults.push({
        ...item,
        sold: item.quantity // Add item with the sold count based on the quantity removed
      });
    }
  }

  sale() {
    // Validate that the receipt has items
    if (!this.receipt.items.length) {
      return;
    }

    // Prepare the payload for the API request
    const salePayload = {
      items: this.receipt.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        salePrice: item.salePrice,
        total: item.quantity * item.salePrice
      })),
      total: this.receipt.total,
      paid: this.receipt.paid,
      balance: this.receipt.paid - this.receipt.total,
      timestamp: new Date().toISOString()
    };

    // Set headers (optional, HttpClient usually auto-sets them for JSON)
    const headers = { 'Content-Type': 'application/json' };

    // Show loading spinner or feedback
    this.showLoading = true;

    // Make the API request to process the sale
    this.http.post('/add/sales', salePayload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Sale processed successfully', response);
          this.printReceipt(response.id);

          // Update item quantities
          this.updateItemQuantities(this.receipt.items);

          // Print the receipt after the sale is processed

          // Optionally close the modal or reset the receipt

        },
        error: (error: any) => {
          console.error('Error processing sale', error);

          // Notify user of the error
          alert('An error occurred while processing the sale. Please try again.');

          // Optionally, retry the request or take another action
        },
        complete: () => {
          // Hide the loading spinner after the request completes

        }
      });
  }

  async updateItemQuantities(items: any[]) {

    for (const item of items) {
      try {
        if (item.id) {
          // Fetch the current item details

          const fetchedItem: any = await this.http.get(`/read/inventory_items/${item.id}`).toPromise();

          // Calculate the new sold quantity
          const soldQuantity = (fetchedItem.sold || 0) + item.quantity;


          // Prepare the payload for updating the item quantity
          const updatePayload = {
            ...fetchedItem,
            ...{ sold: soldQuantity }
          };


          // Call the API to update the item quantity

          await this.http.put(`/update/inventory_items/${item.id}`, updatePayload, { headers: { 'Content-Type': 'application/json' } }).toPromise();

        }
      } catch (error) {
        console.error(`Error updating quantity for item ${item.id}`, error);
      }
    }
    this.resetReceipt();
  }

  async printReceipt(refCode: string) {
    const htmlContent: any = await this.generateHTMLContent(refCode);

    try {
      var browserPrint = true; // Set this based on your application logic
      var response: any;

      if (browserPrint) {
        // Generate a PDF file as a Blob
        const pdfBlob: any = await this.generatePDF(htmlContent);
        const formData = new FormData();
        formData.append('pdfFile', pdfBlob, `receipt_${refCode}.pdf`);
        formData.append('printerName', this.printersList[this.selectedPrinter]);
        formData.append('pdfFileName', `receipt_${refCode}.pdf`);

        // Send the PDF to the backend for printing
        response = await fetch('/print', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Send HTML content to the backend for printing
        response = await fetch('/print-html', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // Set the content type to JSON
          },
          body: JSON.stringify({
            printerName: this.printersList[this.selectedPrinter],
            htmlContent: htmlContent, // Send the generated HTML content
            refCode: refCode
          }),
        });
      }

      if (response.ok) {
        console.log('Receipt successfully sent for printing');
      } else {
        console.error('Failed to send receipt for printing:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending receipt for printing:', error);
    }
  }

  async generateHTMLContent(refCode: string): Promise<string> {
    const theme = JSON.parse(localStorage.getItem('theme') || '{}');
    const businessLogo = theme.receipt_header || theme.business_logo || '';
    const bottom_image = theme.receipt_bottom || '';
    const businessName = theme.business_name || '';

    const generateQRCode = async (text: string): Promise<string> => {
      try {
        return await QRCode.toDataURL(text);
      } catch (error) {
        return '';
      }
    };

    const formatDate = (date: Date): string => {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    function formatPrice(amount: any) {
      // Format the number as currency
      return `${new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount).replace('LKR', '').trim()}`;
    }

    const receiptItemsHTML = this.receipt.items
      .map((item: any) => `
      <tr class="receipt-${refCode}-item">
        <td class="receipt-${refCode}-item-name">${item.name}</td>
        <td class="receipt-${refCode}-item-quantity">x${item.quantity}</td>
        <td class="receipt-${refCode}-item-price">Rs ${formatPrice(parseFloat((item.salePrice * item.quantity).toString()).toFixed(2))}</td>
      </tr>
    `)
      .join('');

    const htmlContent = `
        <style>
          .receipt-${refCode}-container {
            width: 75mm;
            margin: 0 1vw;
            background: #ffffff;
            font-size: 12px;
           font-family: "Rubik", sans-serif;
          }
          .receipt-${refCode}-title {
            text-align: center;
            margin: 0;
            padding-bottom: 10px;
            font-size: 20px;
            color: #333;
          }
          .receipt-${refCode}-business-logo {
            text-align: center;
            margin-bottom: 10px;
            padding-top: 1rem;
          }
          .receipt-${refCode}-business-logo img {
            max-width: 100%;
            height: auto;
            ${!theme.receipt_header ? 'max-height: 100px;' : ''}
          }
          .receipt-${refCode}-details {
            text-align: center;
            margin-bottom: 15px;
            font-size: 14px;
            color: #666;
          }
          .receipt-${refCode}-details div {
            margin: 4px 0;
          }
          .receipt-${refCode}-table {
            width: 100%;
            margin-bottom: 15px;
          }
          .receipt-${refCode}-table th,
          .receipt-${refCode}-table td {
            text-align: left;
            padding: 5px 0;
          }
          .receipt-${refCode}-table th {
            border-bottom: 1px solid #ddd;
            font-weight: bold;
          }
          .receipt-${refCode}-table td {
            border-bottom: 1px dashed #ddd;
          }
          .receipt-${refCode}-total-section,
          .receipt-${refCode}-paid-section,
          .receipt-${refCode}-balance-section {
            font-size: 14px;
            margin: 10px 0;
            padding: 5px 0;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #ddd;
          }
          .receipt-${refCode}-total-section {
            color: #d9534f;
          }
          .receipt-${refCode}-paid-section {
            color: #5cb85c;
          }
          .receipt-${refCode}-balance-section {
            color: #f0ad4e;
          }
          .receipt-${refCode}-qr-code {
            text-align: center;
            margin-top: 15px;
          }
          .receipt-${refCode}-qr-code img {
            width: 80px;
            height: 80px;
          }
          .receipt-${refCode}-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #999;
          }
          .receipt-${refCode}-footer img {
            max-width: 100%;
            height: auto;
          }
          .receipt-${refCode}-social-links {
            margin-top: 10px;
          }
          .receipt-${refCode}-social-links a {
            color: #333;
            margin: 0 5px;
            text-decoration: none;
            font-size: 12px;
          }
          .receipt-${refCode}-social-links a:hover {
            color: #d9534f;
          }
          .receipt-${refCode}-item-name {
            text-align: left !important;
          }
          .receipt-${refCode}-item-quantity {
            text-align: center !important;
          }
          .receipt-${refCode}-item-price {
            text-align: right !important;
          }
          .receipt-${refCode}-header-name {
            text-align: left !important;
          }
          .receipt-${refCode}-header-quantity {
            text-align: center !important;
          }
          .receipt-${refCode}-header-price {
            text-align: right !important;
          }
          .receipt-${refCode}-item {
            width: 100%;
            justify-content: space-between;
          }
        </style>
      </head>
    
        <div class="receipt-${refCode}-container">
          <div class="receipt-${refCode}-business-logo">
            ${businessLogo ? `<img src="${businessLogo}" alt="Business Logo" />` : `<h2 class="receipt-${refCode}-title">${businessName}</h2>`}
          </div>
          <div class="receipt-${refCode}-details">
            <div>Date: ${formatDate(new Date())}</div>
          </div>
          <table class="receipt-${refCode}-table">
            <thead>
              <tr class="receipt-${refCode}-header">
                <th class="receipt-${refCode}-header-item">Item</th>
                <th class="receipt-${refCode}-header-quantity">Qty</th>
                <th class="receipt-${refCode}-header-price">Price</th>
              </tr>
            </thead>
            <tbody>
              ${receiptItemsHTML}
            </tbody>
          </table>
          <div class="receipt-${refCode}-total-section">
            <span>Total:</span>
            <span>Rs ${formatPrice(this.receipt.total)}</span>
          </div>
          <div class="receipt-${refCode}-paid-section">
            <span>Paid:</span>
            <span>Rs ${formatPrice(this.receipt.paid)}</span>
          </div>
          <div class="receipt-${refCode}-balance-section">
            <span>Balance:</span>
            <span>Rs ${formatPrice(this.receipt.paid - this.receipt.total)}</span>
          </div>
          <div class="receipt-${refCode}-qr-code">
            <img src="${await generateQRCode(refCode)}" alt="QR Code" />
            <div class="receipt-${refCode}-qr-code-text">${refCode}</div>
          </div>
          <div class="receipt-${refCode}-footer">
              ${bottom_image
        ? `<img src="${bottom_image}" alt="Business Logo" />`
        : `<p>Thank you for your purchase!</p>
            ${theme?.business_contact_number ? `<p>Contact us: ${theme.business_contact_number}</p>` : ''}`
      }
        </div>
        </div>
          `;

    return htmlContent;
  }

  async generatePDF(htmlContent: string): Promise<void> {
    try {
      // Create an off-screen container for the HTML content
      const container = document.createElement('div');
      container.style.width = '80mm'; // Set container width to 80mm
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.position = 'absolute';
      container.style.top = '-9999px'; // Hide the container off-screen
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      console.log('Container for HTML content created.');

      // Use html2canvas to render the content
      const canvas = await html2canvas(container, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Enable cross-origin images
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      });

      console.log('Canvas rendering completed.');

      const imgData = canvas.toDataURL('image/png');

      // Calculate the height proportionally
      const pdfWidth = 80; // PDF width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      console.log(`Calculated PDF dimensions: ${pdfWidth}mm x ${pdfHeight}mm`);

      // Create a jsPDF instance
      const pdf = new jsPDF({
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      console.log('Image added to PDF.');

      // Remove the container from the DOM
      document.body.removeChild(container);

      // Get the PDF as a Blob
      const pdfBlob = pdf.output('blob');
      console.log('PDF blob generated successfully.');

      // Print the generated PDF
      await this.printPDF(pdfBlob);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Function to print the generated PDF
  async printPDF(pdfBlob: Blob): Promise<void> {
    try {
      // Create a URL for the Blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Create an invisible iframe to load the PDF
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none'; // Hide the iframe
      iframe.src = pdfUrl;

      // Append the iframe to the DOM
      document.body.appendChild(iframe);

      console.log('PDF loaded in iframe.');

      // Wait for the iframe to load the PDF
      iframe.onload = () => {
        console.log('PDF loaded, starting print...');
        iframe.contentWindow?.print(); // Trigger print
      };
    } catch (error: any) {
      console.error('Error printing PDF:', error);
      throw new Error(`PDF printing failed: ${error.message}`);
    }
  }


  downloadPDF(pdfBlob: Blob, fileName: string): void {
    // Create a blob URL for the PDF
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Create a link element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;

    // Append the link to the body
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up and remove the link
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    console.log('PDF file downloaded successfully.');
  }

  addCustomItem() {
    if (this.validateNewItem(this.newItem)) {
      this.receipt.items.push({ ...this.newItem });

      this.resetNewItem();
      this.customItemAddModalVisible = false; // Close modal after adding item
    } else {
      alert('Please fill out all required fields.');
    }
  }

  resetNewItem() {
    this.newItem = {
    };
  }

  // Validate new item
  validateNewItem(item: any) {
    return item.name && item.quantity >= 0 && item.salePrice >= 0;
  }

  // Helper method to reset the receipt after a successful sale
  resetReceipt() {
    this.receipt = {
      items: [],
      total: 0,
      paid: 0,
      balance: 0
    };
    this.showLoading = false;
  }

  // Loading indicator
  showLoading: boolean = false;

  displayShortcuts() {
    const shortcuts = [
      { keys: 'Shift + S', action: 'Focus on the search input' },
      { keys: 'Shift + Backspace', action: 'Clear the search' },
      { keys: 'Shift + H', action: 'Toggle view of receipts' },
      { keys: 'Ctrl + (0-9 or .)', action: 'Increment quantity of the last item' },
      { keys: 'Arrow Right', action: 'Trigger sale if held for 600ms' },
    ];

    const shortcutsList: any = document.getElementById('shortcuts-list');
    shortcutsList.innerHTML = ''; // Clear existing shortcuts

    shortcuts.forEach(shortcut => {
      const row = document.createElement('tr');

      const keyCell = document.createElement('td');
      keyCell.textContent = shortcut.keys;

      const actionCell = document.createElement('td');
      actionCell.textContent = shortcut.action;

      row.appendChild(keyCell);
      row.appendChild(actionCell);
      shortcutsList.appendChild(row);
    });
  }
}

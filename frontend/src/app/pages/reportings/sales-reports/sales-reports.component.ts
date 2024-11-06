import { Component } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx'; // Import xlsx for Excel export
import jsPDF from 'jspdf'; // Import jsPDF
import 'jspdf-autotable'; // Import jsPDF autoTable plugin


@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, CommonModule, FormsModule],
  templateUrl: './sales-reports.component.html',
  styleUrl: './sales-reports.component.scss'
})
export class SalesReportsComponent {
  searchValue: string = '';
  selectedCategory: string = 'current inventory';
  tables: any = {};
  display_table: any = [];

  isDropdownVisible: boolean = false; // Initial state

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

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.loadTables();
  }

  searchItems() {
    this.searchInventory();
  }

  onSelectCategory(nm: string) {
    this.selectedCategory = nm;
  }

  loadTables() {
    const url = '/read/inventory_items';

    this.http.get<any[]>(url).subscribe({
      next: (response) => {
        this.tables.current_inventory = response;
        this.display_table = response;
        console.log(response.slice(0, 10));
      },
      error: (error) => {
        console.log('Error fetching most sold items', error);
      }
    });
  }

  searchInventory() {
    console.log('Searching....');

    const searchTerm = this.searchValue.toLowerCase(); // Convert the query to lowercase for case-insensitive search

    // Filter the inventory based on the search term
    this.display_table = this.tables.current_inventory.filter((item: any) => {
      return Object.keys(item).some((key) => {
        const value = item[key];
        // Check if value is a string or number and includes the search term
        return (
          (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) ||
          (typeof value === 'number' && value.toString().includes(searchTerm))
        );
      });
    });
  }

  // Function to export data to Excel
  exportToExcel() {
    // Create a worksheet from your display_table array
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.display_table);

    // Create a workbook
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Inventory Report': worksheet },
      SheetNames: ['Inventory Report']
    };

    // Export the workbook to a buffer and download as .xlsx
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Trigger download
    this.saveAsFile(excelBuffer, 'Inventory_Report', 'xlsx');
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

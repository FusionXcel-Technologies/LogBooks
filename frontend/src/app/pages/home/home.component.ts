// src/app/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../authentication/authentication.service';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { FirestoreService } from '../../services/firestore.service';

/**
 * **HomeComponent**
 * 
 * This component displays dashboard information fetched from the backend.
 * It utilizes async/await for handling HTTP requests and can upload home_data to Firestore.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

  /**
   * **Data Model**
   */
  home_data: any = {
    stamp: {
      from: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
      to: new Date(new Date().setDate(new Date().getDate() + 1)),   // Tomorrow
    },
    sales: { quantity: 0, totalValue: 0, average: 0 },
    products: {
      inStock: { variations_count: 0, stock_count: 0, value: 0 },
      lowStock: { quantity: 0, value: 0 },
      outOfStock: { quantity: 0, value: 0 },
    }
  };

  /**
   * **UI State Properties**
   */
  showStartDatePicker = false;
  showEndDatePicker = false;
  startDateTime = '';
  endDateTime = '';

  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService,
    private firestoreService: FirestoreService // Inject FirestoreService
  ) {}

  ngOnInit() {
    this.initializeDateTime();
    this.loadData();
    // Removed redundant this.reloadData();
  }

  /**
   * **Initializes the string representations of the date-time for binding with datetime-local inputs.**
   */
  initializeDateTime() {
    this.startDateTime = this.formatDateTime(this.home_data.stamp.from);
    this.endDateTime = this.formatDateTime(this.home_data.stamp.to);
  }

  /**
   * **Formats a Date object to 'yyyy-MM-ddTHH:mm' string format required by datetime-local input.**
   * @param date Date object to format
   * @returns Formatted date-time string
   */
  formatDateTime(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * **Parses a 'yyyy-MM-ddTHH:mm' string to a Date object.**
   * @param dateTimeStr String to parse
   * @returns Date object
   */
  parseDateTime(dateTimeStr: string): Date {
    return new Date(dateTimeStr);
  }

  /**
   * **Toggles the visibility of the Start Date-Time Picker.**
   */
  toggleStartDatePicker() {
    this.showStartDatePicker = !this.showStartDatePicker;
  }

  /**
   * **Toggles the visibility of the End Date-Time Picker.**
   */
  toggleEndDatePicker() {
    this.showEndDatePicker = !this.showEndDatePicker;
  }

  /**
   * **Updates the Start Date-Time based on user selection.**
   */
  updateStartDateTime() {
    if (this.startDateTime) {
      this.home_data.stamp.from = this.parseDateTime(this.startDateTime);
      this.loadData();
    }
  }

  /**
   * **Updates the End Date-Time based on user selection.**
   */
  updateEndDateTime() {
    if (this.endDateTime) {
      this.home_data.stamp.to = this.parseDateTime(this.endDateTime);
      this.loadData();
    }
  }

  /**
   * **Reloads the dashboard data.**
   */
  reloadData() {
    this.loadData();
  }

  /**
   * **Fetches dashboard data from the backend using async/await.**
   */
  async loadData() {
    const fromISO = this.home_data.stamp.from.toISOString();
    const toISO = this.home_data.stamp.to.toISOString();
    const apiUrl = `/dashboard_info/${fromISO}/${toISO}`;

    //this.isLoading = true; // Show loading spinner
    this.errorMessage = '';

    try {
      const response: any = await lastValueFrom(this.http.get(apiUrl));
      this.home_data = this.mapResponse(response);
      console.log('Mapped Home Data:', this.home_data); // Debugging

      // Update string representations to reflect any backend changes
      this.startDateTime = this.formatDateTime(this.home_data.stamp.from);
      this.endDateTime = this.formatDateTime(this.home_data.stamp.to);
    } catch (error) {
      console.error('Failed to load data', error);
      this.showErrorNotification('Unable to load dashboard data. Please try again later.');
    } finally {
      this.isLoading = false; // Hide loading spinner
    }
  }

  /**
   * **Maps the API response to the home_data structure, converting date strings to Date objects.**
   * @param response API response
   * @returns Mapped home_data object
   */
  mapResponse(response: any): any {
    return {
      stamp: {
        from: new Date(response.stamp.from),
        to: new Date(response.stamp.to),
      },
      sales: response.sales,
      products: response.products,
    };
  }

  /**
   * **Formats a number to a string with specified decimal places.**
   * @param number Number to format
   * @returns Formatted number string
   */
  formatNumber(number: number): string {
    return number?.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  /**
   * **Displays an error notification to the user.**
   * @param message Error message to display
   */
  showErrorNotification(message: string) {
    this.errorMessage = message;
    // Optionally, reset the message after some time
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * **Uploads home_data to Firestore**
   */
  async uploadHomeData() {
    this.isLoading = true; // Show loading spinner
    this.errorMessage = '';

    try {
      
      // Define the collection name
      const collectionName = 'reports';
      let hash = JSON.stringify(this.home_data);
      // Using addDocument to let Firestore auto-generate the ID
      const docRef = await this.firestoreService.addDocument(collectionName, this.home_data);
      console.log('Home data uploaded with ID:', docRef.id);

      // Notify the user of successful upload
      alert('Home data successfully uploaded to Firestore. ' );
    } catch (error) {
      console.error('Error uploading home data:', error);
      this.showErrorNotification('Failed to upload home data. Please try again.');
    } finally {
      this.isLoading = false; // Hide loading spinner
    }
  }
}

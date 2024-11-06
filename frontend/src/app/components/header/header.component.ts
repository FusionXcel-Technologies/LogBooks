import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ModalPopupComponent } from '../modal-popup/modal-popup.component';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../pages/authentication/authentication.service';
import { Router } from '@angular/router'; // Import the Router service
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ModalPopupComponent, CommonModule, HttpClientModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'] // Change styleUrl to styleUrls
})
export class HeaderComponent implements OnInit, OnDestroy {
  port: any = '';
  modalVisible: boolean = false;
  networkInterfaces: any = null;
  creditBalence: any = 0;
  theme: any;
  creditRechargeCode: any = '';
  creditRechargeMode: any = false;
  private intervalId: any; // Store interval ID

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService,
    private router: Router // Inject Router service here
  ) {
    this.port = window.location.port;
    this.getNetworkInterfaces();
    this.getCreditBalence();
  }
  onCreditRechargeReq(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedData = clipboardData.getData('text');  // Get the pasted text

    // Make an HTTP request to the backend with the pasted recharge code
    this.http.get(`/recharge/${pastedData}`).subscribe(
      (response: any) => {
        if (response.updatedCredits) {
          this.creditRechargeMode = false;
          this.creditBalence = response.updatedCredits;  // Update balance on success
          this.creditRechargeMode = false;
        }
        this.creditRechargeCode = '';
      },
      (error) => {
        console.error('Error processing recharge:', error);
        this.creditRechargeCode = '';
      }
    );

    // Clear the recharge code field after the request
    this.creditRechargeCode = '';
  }

  toggleCreditRechargeMode() {
    this.creditRechargeMode = !this.creditRechargeMode;
  }

  ngOnInit() {
    this.setTheme();
    this.startCreditBalanceInterval(); // Start the interval when component initializes
  }

  ngOnDestroy() {
    this.stopCreditBalanceInterval(); // Clean up the interval when the component is destroyed
  }

  setTheme() {
    this.theme = this.auth.getStoredTheme();
  }

  toggleModal() {
    this.modalVisible = !this.modalVisible;
  }

  ipWithPortToCustomText(ip: string, port: string | number): string {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Helper function to convert number to custom text
    const convertToCustomText = (num: number): string => {
      let result = '';

      do {
        result = charSet[num % charSet.length] + result;
        num = Math.floor(num / charSet.length);
      } while (num > 0);

      return result;
    };

    // Convert IP address
    const ipText = ip
      .split('.')  // Split the IP address into parts
      .map((part) => convertToCustomText(parseInt(part)))
      .join(' ');  // Join the encoded parts with a separator (e.g., ' ')

    // Convert Port
    const portText = convertToCustomText(Number(port));

    // Combine IP and port text, separated by a colon
    return `${ipText}|${portText}`;
  }

  public getNetworkInterfaces() {
    const url = '/network-interfaces';

    this.http.get(url).subscribe(
      (response: any) => {
        this.networkInterfaces = response;
        console.log('Network interfaces:', response);
      },
      (error) => {
        console.error('Error fetching network interfaces:', error);
      }
    );
  }

  public getCreditBalence() {
    this.creditRechargeMode = false;
    const url = '/creditBalence';

    this.http.get(url).subscribe(
      (response: any) => {
        this.creditBalence = response.balence;
      },
      (error) => {
        console.error('Error fetching credit balance:', error);
      }
    );
  }

  // Start calling getCreditBalence every 20 seconds
  private startCreditBalanceInterval() {
    this.intervalId = setInterval(() => {
      this.getCreditBalence();
    }, 10000); // 20 seconds in milliseconds
  }

  // Stop the interval
  private stopCreditBalanceInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Sign-out and navigate to the home page
  signOut() {
    this.auth.signOut();
    this.router.navigate(['/signin']);  // Navigate to home (root route)
  }
}

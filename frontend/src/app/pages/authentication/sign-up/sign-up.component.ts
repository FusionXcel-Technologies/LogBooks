import { Component } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClient

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  firstName: string = '';
  lastName: string = '';
  phoneNumber: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private router: Router, private http: HttpClient) { } // Inject HttpClient

  onSubmit() {
    this.http.post<{ token: string }>('/signup', {
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumber,
      password: this.password
    }).subscribe(
      response => {
        // Store the token in localStorage
        localStorage.setItem('authToken', response.token);

        // Success message
        this.successMessage = 'User registered successfully!';
        console.log('|||| ', response);

        // Optionally redirect the user after sign-up
        this.router.navigate(['/home']); // or any route you prefer
      },
      error => {
        this.errorMessage = error?.error?.message || 'Error signing up. Please try again.';
      }
    );
  }

  navigateToSignin() {
    this.router.navigate(['/signin']);
  }
}

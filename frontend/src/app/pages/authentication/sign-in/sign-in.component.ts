import { Component } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {
  phoneNumber: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private router: Router, private http: HttpClient) { } // Inject HttpClient

  onSubmit() {
    this.http.post<{ token: string }>('/signin', {
      phoneNumber: this.phoneNumber,
      password: this.password
    }).subscribe(
      response => {
        // Store the token in localStorage
        localStorage.setItem('authToken', response.token);

        // Success message
        this.successMessage = 'User registered successfully!';

        // Optionally redirect the user after sign-up
        this.router.navigate(['/home']); // or any route you prefer
      },
      error => {
        this.errorMessage = error?.error?.message || 'Error signing up. Please try again.';
      }
    );
  }


  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

}

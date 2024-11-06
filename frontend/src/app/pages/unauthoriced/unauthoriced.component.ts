import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Import Router for navigation

@Component({
  selector: 'app-unauthoriced',
  standalone: true,
  imports: [],
  templateUrl: './unauthoriced.component.html',
  styleUrls: ['./unauthoriced.component.scss'] // Corrected styleUrls
})
export class UnauthoricedComponent {
  constructor(private router: Router) { } // Inject Router

  navigate() {
    this.router.navigate(['/']); // Corrected navigation method using Router
  }
}

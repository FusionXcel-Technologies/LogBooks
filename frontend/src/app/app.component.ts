import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from './pages/authentication/authentication.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'LogBook';

  isRestrictedRoute: boolean = false;
  restrictedRoutes = ['/signin', '/signup', '/unauthorized'];

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check if the current route is in the restricted routes list
        this.isRestrictedRoute = this.restrictedRoutes.includes(event.urlAfterRedirects);
      }
    });
    this.loadThemeFromAPI();
  }

  loadThemeFromAPI() {
    this.http.get('/read/theme/1').subscribe((theme: any) => {
      this.applyTheme(theme);
    });
  }
  applyTheme(theme: any) {

    localStorage.setItem('theme', JSON.stringify(theme));

    if (!theme || typeof theme !== 'object') return;

    // Store the theme in local storage

    // Ensure theme.styles and theme.styles.variables exist
    if (theme.styles?.variables && typeof theme.styles.variables === 'object') {
      // Replace CSS variables with values from the theme object
      Object.entries(theme.styles.variables).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Replace underscores in key names with hyphens
          document.documentElement.style.setProperty(`--${key.replace(/_/g, '-')}`, value);
        }
      });
    }
  }
}

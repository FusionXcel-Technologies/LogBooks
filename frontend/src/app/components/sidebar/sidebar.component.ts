import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { SidebarItemComponent } from './sidebar-item/sidebar-item.component';
import { SidebarItemWithChildsComponent } from './sidebar-item-with-childs/sidebar-item-with-childs.component';
import { AuthenticationService } from '../../pages/authentication/authentication.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarItemComponent, SidebarItemWithChildsComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  currentRoute: string = 'Home';
  permissions: string[] = []; // Property to hold user permissions

  constructor(private router: Router, private authService: AuthenticationService) { }

  navigateTo(route: any) {
    // Navigate to the specified route
    this.router.navigate([route]).then(() => {
      // Update currentRoute after navigation
      this.currentRoute = this.formatRoute(route);
    });
  }

  private formatRoute(route: string): string {
    // Remove leading slashes and replace underscores with spaces
    return route.replace(/^\/+/, '').replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize the first letter
  }

  ngOnInit(): void {
    this.currentRoute = this.formatRoute(this.router.url);
    console.log('Initial route:', this.currentRoute);

    // Fetch user permissions and assign to the permissions property
    this.authService.getUserPermissions().subscribe((permissions: string[]) => {
      this.permissions = permissions; // Assign permissions to the variable
    });

    // Update currentRoute when navigation ends
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = this.formatRoute(event.urlAfterRedirects);
        console.log('Current route:', this.currentRoute);
      }
    });
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}

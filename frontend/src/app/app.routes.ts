import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { SalesComponent } from './pages/sales/sales.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SalesReportsComponent } from './pages/reportings/sales-reports/sales-reports.component';
import { InventoryReportsComponent } from './pages/reportings/inventory-reports/inventory-reports.component';
import { SignInComponent } from './pages/authentication/sign-in/sign-in.component';
import { AuthenticationGuard } from './pages/authentication/authentication.guard';
import { SignUpComponent } from './pages/authentication/sign-up/sign-up.component';
import { AccessControlComponent } from './pages/authentication/access-control/access-control.component';
import { UnauthoricedComponent } from './pages/unauthoriced/unauthoriced.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthenticationGuard] // Protect home route
  },
  {
    path: 'inventory_management',
    component: InventoryReportsComponent,
    canActivate: [AuthenticationGuard] // Protect inventory route
  },
  {
    path: 'sales',
    component: SalesComponent,
    canActivate: [AuthenticationGuard] // Protect sales route
  },
  {
    path: 'reportings',
    children: [
      {
        path: 'inventory',
        component: InventoryReportsComponent,
        canActivate: [AuthenticationGuard] // Protect inventory report route
      },
      {
        path: 'sales',
        component: SalesReportsComponent,
        canActivate: [AuthenticationGuard] // Protect sales report route
      }
    ]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthenticationGuard] // Protect settings route
  },
  {
    path: 'signin', // Sign-in route, no need for guard
    component: SignInComponent,
    canActivate: [AuthenticationGuard] // Protect settings route
  },
  {
    path: 'signup', // Sign-in route, no need for guard
    component: SignUpComponent,
    canActivate: [AuthenticationGuard] // Protect settings route
  },
  {
    path: 'access_control', // Sign-in route, no need for guard
    component: AccessControlComponent,
    canActivate: [AuthenticationGuard] // Protect settings route
  },
  {
    path: 'unauthorized', // Sign-in route, no need for guard
    component: UnauthoricedComponent
  }
];

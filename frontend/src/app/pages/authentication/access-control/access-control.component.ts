import { Component } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { ItemsComponent } from './items/items.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RolesItemsComponent } from './roles/items.component';

@Component({
  selector: 'app-access-control',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, ItemsComponent, HttpClientModule, CommonModule, RolesItemsComponent],
  templateUrl: './access-control.component.html',
  styleUrl: './access-control.component.scss'
})
export class AccessControlComponent {
  usersList: any = [];

  constructor(private http: HttpClient, private router: Router) { }

  selectedCategory: string = 'users';

  onSelectCategory(nm: string) {
    this.selectedCategory = nm;
  }

  ngOnInit() {
    this.loadUsers();
  }

  onClickItem(event: any) {

  }

  loadUsers() {
    // Fetch receipts from the server
    const receiptsUrl = '/read/user/0/99999999999999999999';
    this.http.get(receiptsUrl).subscribe({
      next: (response: any) => {
        this.usersList = response.slice().sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 30);
      },
      error: (error: any) => {
        console.error('Error fetching receipts:', error);
      }
    });
  }



}

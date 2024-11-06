import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reportings',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, CommonModule, FormsModule],
  templateUrl: './reportings.component.html',
  styleUrl: './reportings.component.scss'
})
export class ReportingsComponent {

}

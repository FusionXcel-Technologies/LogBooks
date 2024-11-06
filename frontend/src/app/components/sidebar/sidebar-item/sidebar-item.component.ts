import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { AuthenticationService } from '../../../pages/authentication/authentication.service';

@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [CommonModule], // Add CommonModule to imports
  templateUrl: './sidebar-item.component.html',
  styleUrls: ['./sidebar-item.component.scss']
})
export class SidebarItemComponent {
  @Input() iconName!: string;
  @Input() placeholderText!: string;
  @Input() currentRoute!: string;
  @Output() action = new EventEmitter<void>();

  onItemClick() {
    this.action.emit();
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar-item-with-childs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-item-with-childs.component.html',
  styleUrl: './sidebar-item-with-childs.component.scss'
})
export class SidebarItemWithChildsComponent {
  @Input() iconName!: string;
  @Input() placeholderText!: string;
  @Input() currentRoute!: string;
  @Input() childs: any[] = [];
  @Output() action = new EventEmitter<void>();

  collapsed: boolean = true;

  onItemClick() {
    this.collapsed = !this.collapsed;
  }

  onChildItemClick(i: any) {
    this.action.emit(i.toString());
  }

}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemComponent } from './item/item.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [ItemComponent, CommonModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class ItemsComponent {
  @Input() items: any[] = []; // Accepts an array of items as input
  @Input() onClickEnabled: any;
  @Output() forwardCloneItem = new EventEmitter<any>();
  @Output() forwardOnClickItem = new EventEmitter<any>();

  handleCloneFromGrandchild(item: any) {
    this.forwardCloneItem.emit(item);  // Forward it to the grandparent
  }

  handleOnClickFromGrandchild(item: any) {
    this.forwardOnClickItem.emit(item);  // Forward it to the grandparent
  }
}

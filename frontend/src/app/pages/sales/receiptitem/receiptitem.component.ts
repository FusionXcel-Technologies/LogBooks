import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-receiptitem',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receiptitem.component.html',
  styleUrl: './receiptitem.component.scss'
})
export class ReceiptitemComponent {
  @Input() item: any;
  @Output() removeItem = new EventEmitter<any>();
  
  onRemove() {
    this.removeItem.emit(this.item);
  }
}

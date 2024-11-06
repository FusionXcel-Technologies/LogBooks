import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.scss'
})
export class ReceiptComponent {
  @Input() receipt: any = {};

  @Output() addToCounter = new EventEmitter<any>();

  onAddToCounter() {
    this.addToCounter.emit(this.receipt);
  }

  toggleModal() {

  }
}

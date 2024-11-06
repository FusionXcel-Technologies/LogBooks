import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../pages/authentication/authentication.service';

@Component({
  selector: 'app-modal-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-popup.component.html',
  styleUrls: ['./modal-popup.component.scss']
})
export class ModalPopupComponent {
  @Input() modal_visible: boolean = false;
  @Input() modal_content!: TemplateRef<any>; // Use TemplateRef for dynamic content

  constructor(private auth: AuthenticationService) { }

  ngOnInit() {
    // this.setTheme();
  }

  setTheme() {
    let tm = this.auth.getStoredTheme();
    const a: any = document.querySelector('app-modal-popup .container');
    a.style.backgroundColor = tm.text_color;
  }
}

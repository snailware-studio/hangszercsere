import { Injectable } from '@angular/core';
import { PopupComponent } from '../../components/popup-component/popup-component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  private popup: PopupComponent | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  register(component: PopupComponent) {
    this.popup = component;
  }

  Show(html: string, button_dict: any): void
  {
    if (!this.popup) return;

    this.popup.html = this.sanitizer.bypassSecurityTrustHtml(html);
    this.popup.button_dict = button_dict;
    this.popup.show = true;
  }

  close(): void
  {
    if (!this.popup) return;
    this.popup.show = false;
  }

}

import { Injectable } from '@angular/core';
import { PopupComponent } from '../../components/popup-component/popup-component';

@Injectable({
  providedIn: 'root'
})
export class PopupService {

   private popup: PopupComponent | null = null;

  register(component: PopupComponent) {
    this.popup = component;
  }
  

  Show(text: string, buttons: string[], functions: any[]): void
  {
    this.popup.text = text;
    this.popup.buttons = buttons;
    this.popup.functions = functions;
    this.popup.show = true;
  }

  close(): void
  {
    this.popup.show = false;
  }
  
}

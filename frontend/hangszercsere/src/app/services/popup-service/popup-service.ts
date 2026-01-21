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
  

  Show(text: string, button_dict: any): void
  {
    this.popup.text = text;
    this.popup.button_dict = button_dict;
    this.popup.show = true;
  }

  close(): void
  {
    this.popup.show = false;
  }
  
}

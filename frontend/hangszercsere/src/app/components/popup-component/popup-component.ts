import { Component } from '@angular/core';
import { PopupService } from '../../services/popup-service/popup-service';

@Component({
  selector: 'app-popup-component',
  standalone: false,
  templateUrl: './popup-component.html',
  styleUrl: './popup-component.css'
})
export class PopupComponent {

  constructor(private popupService: PopupService) {
    this.popupService.register(this);
  }

    text: string = 'test';
    button_dict: any = {};
    show: boolean = false;

}

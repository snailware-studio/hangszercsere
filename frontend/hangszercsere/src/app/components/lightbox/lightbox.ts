import { Component,Input } from '@angular/core';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-lightbox',
  standalone: false,
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.css'
})
export class Lightbox {
  constructor(private global: GlobalService) {
    this.rootUrl = this.global.rootUrl;
  }

  rootUrl: string;

  @Input() images: string[] = [];  //url array
  isOpen: boolean = false;
  currentIndex: number = 0;

  // Open at i index
  show(index: number = 0) {
    if (!this.images || this.images.length === 0) return;
    this.currentIndex = index;
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  prev() {
    if (this.images.length > 1) {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  }

  next() {
    if (this.images.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  }
}

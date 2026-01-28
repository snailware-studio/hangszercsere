import { Component,OnInit } from '@angular/core';
import { CartService } from '../../services/cart-service/cart-service';
import { Listing } from '../../services/listing-service/listing-service';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  constructor(
    private cart: CartService,
    private global: GlobalService
  ){};
  
  totalPrice: number = 0;
  listings: Listing[] = [];
  rootUrl: string = 'https://hangszercsere.hu';

  ngOnInit(): void
  {
    this.LoadListings();
    if (this.global.rootUrl) this.rootUrl = this.global.rootUrl;
  }

  Purchase(): void
  {
    this.cart.Purchase().subscribe(
      {
        next: () => this.LoadListings()
      });
  }

  LoadListings(): void
  {
    this.cart.LoadListings().subscribe(listings => {
      this.listings = listings;
      this.calculateTotal();
    });    
  }
  
  removeFromCart(listing_id: number): void
  {
    this.cart.RemoveFromCart(listing_id).subscribe({
      next: () => {
        this.LoadListings();
      }
    });
  }

  calculateTotal() {

    for (let i = 0; i < this.listings.length; i++) {
      this.totalPrice += this.listings[i].price;
    }

  }

}

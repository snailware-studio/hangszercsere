import { Component,OnInit } from '@angular/core';
import { CartService } from '../../services/cart-service/cart-service';
import { Listing } from '../../services/listing-service/listing-service';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  constructor(
    private cart: CartService,

  ){};
  
  totalPrice: number = 0;
  listings: Listing[] = [];

  ngOnInit(): void
  {
    this.LoadListings();

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
    this.cart.RemoveFromCart(listing_id);
    this.LoadListings();
  }

  calculateTotal() {

    for (let i = 0; i < this.listings.length; i++) {
      this.totalPrice += this.listings[i].price;
    }

  }

}

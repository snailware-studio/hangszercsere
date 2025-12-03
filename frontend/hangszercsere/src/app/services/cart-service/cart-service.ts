import { Injectable,Injector } from '@angular/core';
import { ListingService,Listing } from '../listing-service/listing-service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../user-service/user-service';
import { Router } from '@angular/router';
import { GlobalService } from '../GlobalService/global-service';
import { NotifService } from '../notif-service/notif-service';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private user: UserService;

  constructor(
    private http: HttpClient,
    private router: Router,
    private injector: Injector,
    private global: GlobalService,
    private notif: NotifService
  ) {

    this.apiUrl = this.global.apiUrl+'cart-items';

    const stored = localStorage.getItem('cart');
    if (stored) this.cart = JSON.parse(stored);

    setTimeout(() => {
      this.user = this.injector.get(UserService);
    });
  };

  private apiUrl= "https://hangszercsere.hu/api/cart-items";

  cart: number[] = [];

  AddToCart(listing_id: number): void { 

    if (!this.user.isLoggedIn()) {
      this.notif.show("error", "You must be logged in!");
      this.router.navigate(['/login'])
    return;
    }

    if (!this.cart.includes(listing_id)) {
      this.cart.push(listing_id);
      this.saveCart();
      this.notif.show("success", "Added to cart!");
    }
    else
    {
      alert("item already in cart!")
    }
  }

  RemoveFromCart(listing_id: number): void
  {
    this.cart = this.cart.filter(item => item !== listing_id);
    this.saveCart();
  }

  LoadListings(): Observable<any>
  { 
    return this.http.post(this.apiUrl,{ids: this.cart});
  }

  ClearCart(): void
  {
    this.cart = [];
    localStorage.removeItem('cart');
  }

   private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
}

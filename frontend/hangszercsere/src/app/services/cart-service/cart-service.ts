import { Injectable, Injector } from '@angular/core';
import { ListingService, Listing } from '../listing-service/listing-service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../user-service/user-service';
import { Router } from '@angular/router';
import { GlobalService } from '../GlobalService/global-service';
import { NotifService } from '../notif-service/notif-service';
import { joinAllInternals } from 'rxjs/internal/operators/joinAllInternals';
import { tap, pipe } from 'rxjs';

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

    this.apiUrl = this.global.apiUrl;

    const stored = localStorage.getItem('cart');
    if (stored) this.cart = JSON.parse(stored);

    setTimeout(() => {
      this.user = this.injector.get(UserService);
    });
  };

  private apiUrl = "https://hangszercsere.hu/api/cart-items";

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
    else {
      alert("item already in cart!")
    }
  }

  RemoveFromCart(listing_id: number): void {
    this.cart = this.cart.filter(item => item !== listing_id);
    this.saveCart();
  }

  Purchase(): Observable<any> {
    if (!this.user.isLoggedIn()) {
      this.notif.show("error", "You must be logged in!");
      this.router.navigate(['/login']);
      return;
    }

    if (this.cart.length === 0) {
      this.notif.show("error", "Cart is empty!");
      return;
    }

    const payload = {
      listingIDs: this.cart.map(item => item),
      userID: this.user.getUserId()
    };

    return this.http.post<any>(`${this.apiUrl}buy`, payload).pipe(
      tap(response => {

        this.notif.show("success", `Payment completed!`);

        // update cart
        this.cart = [];

        if (response.results && response.results.length > 0) {
          response.results.forEach(result => {
            if (result.status === "error") {
              this.notif.show("error", `Listing ${result.listingID}: ${result.message}`);
            } else {
              this.RemoveFromCart(result.listingID);
            }
          });
        }

      })
    );
  }


  LoadListings(): Observable<any> {
    return this.http.post(`${this.apiUrl}cart-items/`, { ids: this.cart });
  }

  ClearCart(): void {
    this.cart = [];
    localStorage.removeItem('cart');
  }

  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
}

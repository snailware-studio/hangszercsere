import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../user-service/user-service';
import { Router } from '@angular/router';
import { GlobalService } from '../GlobalService/global-service';
import { NotifService } from '../notif-service/notif-service';
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

    setTimeout(() => {
      this.user = this.injector.get(UserService);
    });
  };

  private apiUrl = "https://hangszercsere.hu/api/cart-items";

  AddToCart(listing_id: number): void {

    if (!this.user.isLoggedIn()) {
      this.notif.show("error", "You must be logged in!");
      this.router.navigate(['/login'])
      return;
    }

    this.http.post(`${this.apiUrl}cart-items`, { id: listing_id }, {
      withCredentials: true
    }).subscribe({
      next: (res) => {
        this.notif.show("success", "Added to cart!");
      },
      error: (err) => {
        if (err.status === 409) {
          this.notif.show("error", "Item already in cart!");
          return;
        }
        this.notif.show("error", "Failed to add to cart!");
        console.error('failed to add to cart', err);
      }
    });
  }

RemoveFromCart(listing_id: number): Observable<any> {
  if (!this.user.isLoggedIn()) {
    this.notif.show("error", "You must be logged in!");
    this.router.navigate(['/login']);
    return;
  }

  return this.http.delete(`${this.apiUrl}cart-items/${listing_id}`, {
    withCredentials: true
  }).pipe(
    tap({
      next: () => this.notif.show("success", "Removed from cart!"),
      error: (err) => {
        this.notif.show("error", "Failed to remove from cart!");
        console.error("failed to remove from cart", err);
      }
    })
  );
}



  Purchase(): Observable<any> {
    if (!this.user.isLoggedIn()) {
      this.notif.show("error", "You must be logged in!");
      this.router.navigate(['/login']);
      return;
    }

    return this.http.post<any>(`${this.apiUrl}buy`, {}, {
      withCredentials: true
    }).pipe(

      tap(response => {

        if (response.results && response.results.length > 0) {
          response.results.forEach(result => {
            if (result.status === 204) {
              this.notif.show("warning", `Your cart is empty!`);
              return;
            }
            if (result.status === "error") {
              this.notif.show("error", `Listing ${result.listingID}: ${result.message}`);
            } else {
              this.notif.show("success", `Payment completed!`);
              this.RemoveFromCart(result.listingID);
            }
          });
        }

      })
    );
  }


  LoadListings(): Observable<any> {
    return this.http.get(`${this.apiUrl}cart-items`, {
      withCredentials: true
    });
  }


  ClearCart(): void {
    this.http.delete(`${this.apiUrl}cart-items`, {
      withCredentials: true
    }).subscribe({
      next: (res) => {
        this.notif.show("success", "Cart cleared!");
      },
      error: (err) => {
        this.notif.show("error", "Failed to clear cart!");
        console.error('failed to clear cart', err);
      }
    });
  }
}
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
      this.notif.show("error", "Be kell jelentkezned!");
      this.router.navigate(['/login'])
      return;
    }

    this.http.post(`${this.apiUrl}cart-items`, { id: listing_id }, {
      withCredentials: true
    }).subscribe({
      next: (res) => {
        this.notif.show("success", "Hozzáadva a kosarához!");
      },
      error: (err) => {
        if (err.status === 409) {
          this.notif.show("warning", "Ez a hangszer már a kosárban van!");
          return;
        }
        this.notif.show("error", "Nem sikerült hozzáadni a kosarához!");
        console.error('failed to add to cart', err);
      }
    });
  }

RemoveFromCart(listing_id: number): Observable<any> {
  if (!this.user.isLoggedIn()) {
    this.notif.show("error", "Be kell jelentkezned!");
    this.router.navigate(['/login']);
    return;
  }

  return this.http.delete(`${this.apiUrl}cart-items/${listing_id}`, {
    withCredentials: true
  }).pipe(
    tap({
      next: () => console.log("Removed from cart!"),
      error: (err) => {
        this.notif.show("error", "Hiba");
        console.error("failed to remove from cart", err);
      }
    })
  );
}



  Purchase(): Observable<any> {
    if (!this.user.isLoggedIn()) {
      this.notif.show("error", "Be kell jelentkezned!");
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
              this.notif.show("warning", `A kosarad üres!`);
              return;
            }
            if (result.status === "error") {
              this.notif.show("error", `Listing ${result.listingID}: ${result.message}`);
            } else {
              this.notif.show("success", `Sikeres fizetés!`);
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
        console.log("Cart cleared!");
      },
      error: (err) => {
        this.notif.show("error", "Nem sikerült törölni a kosarát!");
        console.error('failed to clear cart', err);
      }
    });
  }
}
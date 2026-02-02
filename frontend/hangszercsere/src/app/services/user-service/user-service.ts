import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { CartService } from '../cart-service/cart-service';
import { GlobalService } from '../GlobalService/global-service';
import { clampWithOptions } from 'date-fns/fp';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'https://hangszercsere.hu/api/users';

  public currentUserId: number;
  public currentUser: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cart: CartService,
    private global: GlobalService
  ) {
    this.apiUrl = this.global.apiUrl + 'users';
    this.loadCurrentUser();
  }

  getUserId() {
    return this.currentUserId;
  }

  private loadCurrentUser() {
    this.GetCurrentUser().subscribe({
      next: user => {
        this.currentUser = user;
        this.currentUserId = user?.id ?? null;
        this.cart.LoadListings().subscribe();
      },
      error: err => {
        console.error('Failed to load user info', err);
        this.LogOut();
      }
    });
  }

  

  RegisterUser(user: user): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  getUserName() {
    return this.currentUser?.name;
  }

  DeleteAccount(userId:number): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete`, {userId}, { withCredentials: true });
  };

  LoginUser(name: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { name, password }, { withCredentials: true }).pipe(
      tap((res: any) => {
        if (res?.name) {
          console.log("logged in", res);
          this.currentUser = { name: res.name };
          this.currentUserId = res?.id ?? null; 
          this.cart.LoadListings().subscribe();
          this.GetCurrentUser().subscribe(data => this.currentUser = data);
        }
      })
    );
  }

  uploadAvatar(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/avatar`, formData, { withCredentials: true });
  }

  isLoggedIn(): boolean {
    if (!this.currentUserId) return false;
    return true;
  }

  LogOut(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.currentUserId = null;
        this.currentUser = null;
        this.cart.ClearCart();
      },
      error: err => console.error("Logout failed", err)
    });
  }

  GetCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, { withCredentials: true });
  }

  GetUser(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`, { withCredentials: true });
  }

  UpdateUser(id: number, name: string, email: string, bio: string, location: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/update`, { id, name, email, bio, location, password }, { withCredentials: true });
  }

  isAdmin(): boolean {
    if (this.currentUserId === 1) {
      return true;
    }
    return false;
  }
}

export interface user {
  id: number;
  name: string;
  email: string;
  location: string;
  password: string;
}

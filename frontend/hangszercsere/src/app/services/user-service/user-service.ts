import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,tap } from 'rxjs';
import { Router } from '@angular/router';
import { CartService } from '../cart-service/cart-service';
import { GlobalService } from '../GlobalService/global-service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

   private apiUrl = 'https://hangszercsere.hu/api/users';

   constructor(
    private http: HttpClient,
    private router: Router,
    private cart: CartService,
    private global: GlobalService
  ) {
    //load user id
    const stored = localStorage.getItem('currentUserId');
    if (stored) this.currentUserId = Number(stored);
    if (stored) {
      this.currentUserId = Number(stored);
      this.loadUser(this.currentUserId);
    }

    this.apiUrl = this.global.apiUrl+'users';
  }

  public currentUserId: number | null = null;
  public currentUser: any = null;

  setUser(id: number,name:string) {
    this.currentUserId = id;

    localStorage.setItem('currentUserId', id.toString());
  }

  getUserId() {
    return this.currentUserId;
  }

  getUserName() {
    return this.currentUser?.name;
  }

  RegisterUser(user:user): Observable<any>
  {
  return this.http.post(this.apiUrl, user);
  }

LoginUser(name: string, password: string): Observable<any> {
  return this.http.post('https://hangszercsere.hu/api/users/login', { name, password }).pipe(
    tap((res: any) => {
      if (res?.id) {
        this.currentUserId = res.id;
        localStorage.setItem('currentUserId', res.id.toString());
        this.GetUser(res.id).subscribe(data => this.currentUser = data);
        console.log("logged in",this.currentUser);
      }
    })
  );
}

  uploadAvatar(formData: FormData): Observable<any>
  {
    return this.http.post('https://hangszercsere.hu/api/users/avatar', formData);
  }

  isLoggedIn(): boolean
  {
    return this.currentUserId !== null;
  }

  LogOut(): void
  {

    if (!this.isLoggedIn()) {
    return;
    }

    this.currentUserId = null;
    localStorage.removeItem('currentUserId');
    this.currentUser = null;

    this.cart.ClearCart();
  }

  GetUser(userId: number): Observable<any>
  {
    return this.http.get(`https://hangszercsere.hu/api/users/${userId}`);
  }

  UpdateUser(id: number,name: string,email: string,bio: string,location: string,password: string): Observable<any>
  {
    return this.http.post(`https://hangszercsere.hu/api/users/update`, {id,name,email,bio,location,password});
  }

  isAdmin(): boolean
  {
    if(this.getUserId() == 1)
    {
      return true
    }
    return false
  }

  // load user info by ID
  private loadUser(id: number) {
    this.GetUser(id).subscribe({
      next: user => this.currentUser = user,
      error: err => {
        console.error('Failed to load user info', err);
        this.LogOut();
      }
    });
  }
}

export interface user {
  id: number;
  name: string;
  email: string;
  location: string;
  password: string;
}
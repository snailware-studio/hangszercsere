import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  //SERVICE FOR GLOBAL VARIABLES / FUNCTIONS !!

  rootUrl = "https://hangszercsere.hu";
  apiUrl = "https://hangszercsere.hu/api/";

  //set to on if you want to use localhost as the api
  public dev = true;
  public show_cookie = true; // default true, and when users clicks ok then false

  constructor() {
    if (this.dev)
    {
      this.rootUrl = "http://localhost:3000";
      this.apiUrl = "http://localhost:3000/api/";
    }
    else
    {
      this.apiUrl = "https://hangszercsere.hu/api/";
      this.rootUrl = "https://hangszercsere.hu";
    }
  }
}

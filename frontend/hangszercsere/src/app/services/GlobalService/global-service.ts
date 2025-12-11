import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  //SERVICE FOR GLOBAL VARIABLES / FUNCTIONS !!

  apiUrl = "https://hangszercsere.hu/api/";

  //set to on if you want to use localhost as the api
  public dev = true;

  constructor() {
    if (this.dev)
      this.apiUrl = "http://localhost:3000/api/";
    else
      this.apiUrl = "https://hangszercsere.hu/api/";
  }
}

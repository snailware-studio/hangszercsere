import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './components/home-page/home-page';
import { Upload } from './components/upload/upload';
import { ListingPage } from './components/listing-page/listing-page';
import { Register } from './components/register/register';
import { Login } from './components/login/login';
import { Cart } from './components/cart/cart';
import { AdminPanel } from './components/admin-panel/admin-panel';
import { ChatComponent } from './components/chat-component/chat-component';
import { ProfilePage } from './components/profile-page/profile-page';
import { EditProfilePage } from './components/edit-profile-page/edit-profile-page'; 
import { EditListingPage } from './components/edit-listing-page/edit-listing-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'upload', component: Upload },
  {path: 'listing/:id',component: ListingPage},
  {path: 'register',component: Register},
  {path: 'login',component: Login},
  {path: 'cart', component: Cart},
  {path: 'admin', component: AdminPanel},
  {path: 'chat', component: ChatComponent},
  {path: 'profile/:id', component: ProfilePage},
  {path: 'profile/edit/:id', component: EditProfilePage},
  {path: 'listing/edit/:id', component: EditListingPage}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

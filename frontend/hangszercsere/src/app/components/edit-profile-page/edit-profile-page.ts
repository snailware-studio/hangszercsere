import { Component } from '@angular/core';
import { UserService } from '../../services/user-service/user-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { NotifService } from '../../services/notif-service/notif-service';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-edit-profile-page',
  standalone: false,
  templateUrl: './edit-profile-page.html',
  styleUrl: './edit-profile-page.css'
})
export class EditProfilePage {

    constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private notif: NotifService,
    private global: GlobalService
  ) {
    this.rootUrl = this.global.rootUrl;
  }

  rootUrl: string;

  user: any | null = null;
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  selectedAvatar: File | null = null;

  onSelectAvatar(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) this.selectedAvatar = files[0];
  }

  uploadAvatar() {
    if (!this.selectedAvatar) return this.notif.show("error", "Nincs fájl kiválasztva!");

    const formData = new FormData();
    formData.append('avatar', this.selectedAvatar);
    formData.append('userId', this.userService.getUserId().toString());

    this.userService.uploadAvatar(formData).subscribe({
      next: (res) => {
        console.log('Avatar updated', res);
        this.user.profile_url = res.filename;
      },
      error: (err) => {
        console.error('Feltöltés sikertelen!', err);
        this.notif.show("error", err.error.error);
      }
    });
  }

  ngOnInit(): void {

    const userId = Number(this.route.snapshot.paramMap.get('id'));
    if (!userId) return;

    if(!this.userService.isLoggedIn())
    {
          this.notif.show("error", "Nem módosíthatod ezt a profilt!");
          this.router.navigate(['/']);
      return;
    }

    this.userService.GetUser(userId).subscribe({
      next: (data) => {
        if (data.id !== this.userService.getUserId()) {
          this.notif.show("error", "Nem módosíthatod ezt a profilt!");
          this.router.navigate(['/']);
          return;
        }
        this.user = data;
      },
      error: (err) => {
        console.error('Nem sikerült betölteni a felhasználó adatait!', err);
        this.notif.show("error", "Nem sikerült betölteni a felhasználó adatait!");
      }
    });
  }

  ChangePassword() {
    if ((this.newPassword != this.confirmPassword) && this.confirmPassword != '') {
      this.notif.show("error", "Az új jelszó nem egyezik!");
      return;
    }
  }

  DeleteAccount() {
    this.userService.DeleteAccount(this.userService.getUserId()).subscribe({ 
      next: (res) => {
        this.notif.show("success", "Megerősítő email elküldve!");
      },
      error: (err) => {
        console.error('Törlés sikertelen!', err);
        this.notif.show("error", err.error.error);
      }
    });
  }

  UpdateProfile() {

    //login user to verify
    if (this.newPassword != '') {
      this.userService.LoginUser(this.user.name, this.currentPassword).subscribe({

        next: (res: any) => {
        },
        error: (err) => {
          let msg = "Ismeretlen hiba";
          if (err && err.error && err.error.error) {
            msg = err.error.error;
          }
          this.notif.show("error", msg);
          return;
        }
      });
    }

    this.uploadAvatar();

    this.userService.UpdateUser(this.user.id, this.user.name, this.user.email, this.user.bio, this.user.location, this.newPassword).subscribe({
      next: (res) => {
        console.log('Profile updated', res);
        this.notif.show("success", "Profil frissítve! 🎉");
        this.router.navigate(['/profile', this.user.id]);
      },
      error: (err) => {
        console.error('Módosítás sikertelen!', err);
        this.notif.show("error", err.error.error);
      }
    });
  }

}

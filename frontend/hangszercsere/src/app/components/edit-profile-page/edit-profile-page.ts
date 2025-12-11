import { Component } from '@angular/core';
import { UserService } from '../../services/user-service/user-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { NotifService } from '../../services/notif-service/notif-service';

@Component({
  selector: 'app-edit-profile-page',
  standalone: false,
  templateUrl: './edit-profile-page.html',
  styleUrl: './edit-profile-page.css'
})
export class EditProfilePage {

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
    if (!this.selectedAvatar) return alert('Select a file!');

    const formData = new FormData();
    formData.append('avatar', this.selectedAvatar);
    formData.append('userId', this.userService.getUserId().toString());

    this.userService.uploadAvatar(formData).subscribe({
      next: (res) => {
        console.log('Avatar updated', res);
        this.user.profile_url = res.filename;
      },
      error: (err) => {
        console.error('Upload failed', err);
        alert('Upload failed: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private notif: NotifService
  ) { }

  ngOnInit(): void {

    const userId = Number(this.route.snapshot.paramMap.get('id'));
    if (!userId) return;

    if(!this.userService.isLoggedIn())
    {
          this.notif.show("error", "You can't edit someone else's profile!");
          this.router.navigate(['/']);
      return;
    }

    this.userService.GetUser(userId).subscribe({
      next: (data) => {
        if (data.id !== this.userService.getUserId()) {
          this.notif.show("error", "You can't edit someone else's profile!");
          this.router.navigate(['/']);
          return;
        }
        this.user = data;
      },
      error: (err) => {
        console.error('Failed to load user', err);
      }
    });
  }

  ChangePassword() {
    if ((this.newPassword != this.confirmPassword) && this.confirmPassword != '') {
      this.notif.show("error", "New passwords don't match!");
      return;
    }
  }

  DeleteAccount() {
    this.userService.DeleteAccount(this.userService.getUserId()).subscribe({ 
      next: (res) => {
        this.notif.show("success", "Confirmation email sent!");
      },
      error: (err) => {
        console.error('Account delete failed', err);
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
          let msg = "Unkown error";
          if (err && err.error && err.error.error) {
            msg = err.error.error;
          }
          alert("Login failed: " + msg);
          return;
        }
      });
    }


    this.userService.UpdateUser(this.user.id, this.user.name, this.user.email, this.user.bio, this.user.location, this.newPassword).subscribe({
      next: (res) => {
        console.log('Profile updated', res);
        alert('🎉Profile updated!');
        window.location.reload();
      },
      error: (err) => {
        console.error('Profile update failed', err);
        alert('failed: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }

}

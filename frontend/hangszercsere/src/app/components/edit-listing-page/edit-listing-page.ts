import { Component,OnInit,Pipe,PipeTransform } from '@angular/core';
import { ListingService } from '../../services/listing-service/listing-service';
import { UserService } from '../../services/user-service/user-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { GlobalService } from '../../services/GlobalService/global-service';
import { NotifService } from '../../services/notif-service/notif-service';

@Component({
  selector: 'app-edit-listing-page',
  standalone: false,
  templateUrl: './edit-listing-page.html',
  styleUrl: './edit-listing-page.css'
})
export class EditListingPage {

  constructor(
    private listingService: ListingService,
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private global: GlobalService,
    private notif: NotifService,
  ){
    this.rootUrl = this.global.rootUrl;
  }

  rootUrl: string;
  listing: any = null;

  selectedImages: File[]| null = [];
  selectedVideos: File[] | null = []; 
  uploadProgress: number = 0;

  PreviewImages: string[] = [];
  PreviewVideos: string[] = [];

  onSelectImages(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    const newFiles = Array.from(files);

    if (!this.selectedImages) {
      this.selectedImages = newFiles;
    } else {
      this.selectedImages.push(...newFiles);
    }

    this.PreviewImages = this.selectedImages.map(f => URL.createObjectURL(f));
    (event.target as HTMLInputElement).value = '';
  }

  onSelectVideos(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    const newFiles = Array.from(files);
    this.selectedVideos.push(...newFiles);

    console.log('Selected videos:', this.selectedVideos);

    this.PreviewVideos = this.selectedVideos.map(f => URL.createObjectURL(f));

    console.log('Preview videos:', this.PreviewVideos);
    (event.target as HTMLInputElement).value = '';
  }

  UploadMedia(): void {
    const formData = new FormData();

    formData.append('listingId', this.listing.id.toString());
    formData.append('userId', this.userService.getUserId().toString());

    formData.append('existingImages', JSON.stringify(this.listing.images));
    formData.append('existingVideos', JSON.stringify(this.listing.videos));

    // New files to upload
    this.selectedImages.forEach(file => formData.append('newImages', file));
    this.selectedVideos.forEach(file => formData.append('newVideos', file));

    this.listingService.updateMedia(formData).subscribe({
    next: (event: any) => {
      switch (event.type) {
        case HttpEventType.Sent:
          console.log('Upload started');
          break;

        case HttpEventType.UploadProgress:
          if (event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
            console.log('Upload progress:', this.uploadProgress + '%');
          }
          break;

        case HttpEventType.Response:
          console.log('Media upload successful', event.body);

          if (event.body.newImages) this.listing.images.push(...event.body.newImages);
          if (event.body.newVideos) this.listing.videos.push(...event.body.newVideos);

          this.selectedImages = [];
          this.selectedVideos = [];
          this.uploadProgress = 0;

          this.notif.show('success','Listing Edited!');
          this.router.navigate(['/listing', this.listing.id]);
          break;
      }
    },
    error: (err) => {
      console.error('Upload failed', err);
      this.notif.show('error','Upload failed: ' + (err.error?.error || 'Unknown error'));
    }
  });
}

    ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('getting listing with id:', id);

    this.listingService.getListingById(id).subscribe(data =>
    {
      this.listing = data;
      console.log('listing loaded:', this.listing);

      
    if(this.listing.user_id != this.userService.currentUserId)
    {
      this.notif.show('error','You are not the seller of this listing!');
      this.listing = null;
      this.router.navigate(['/listing', id]);
    }
    });

  }  

  SaveChanges(): void {
    console.log('Saving changes...');
    this.listingService.UpdateListing(this.listing).subscribe({
      next: (res) => {
        console.log('Listing updated', res);
          this.UploadMedia();
      },
      error: (err) => {
        console.error('Listing update failed', err);
        this.notif.show('error','Listing update failed: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }

}

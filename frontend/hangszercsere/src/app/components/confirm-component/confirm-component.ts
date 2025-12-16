import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-confirm-component',
  standalone: false,
  templateUrl: './confirm-component.html',
  styleUrl: './confirm-component.css'
})
export class ConfirmComponent {

  status: 'success' | 'fail' = 'success';
  type: string = '';
  title: string = '';
  message: string = '';
  showReturnButton: boolean = true;

  private typeMessages: { [key: string]: { success: string; fail: string } } = {
    email: {
      success: 'Your email has been successfully verified!',
      fail: 'Email verification failed. The link may be expired or invalid.'
    },
    delete: {
      success: 'Your account has been deleted successfully!',
      fail: 'Could not delete your account. Please try again later.'
    },
    unknown: {
      success: 'Operation completed successfully.',
      fail: 'Something went wrong. Please try again later.'
    }
  };



  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.status = params['status'] === 'success' ? 'success' : 'fail';
      this.type = params['type'] || 'unknown';

      this.setMessages();
    });
  }


  private setMessages(): void {
    const typeConfig = this.typeMessages[this.type] ?? this.typeMessages['unknown'];

    if (this.status === 'success') {
      this.title = 'Success!';
      this.message = typeConfig.success;
    } else {
      this.title = 'Failed';
      this.message = typeConfig.fail;
    }
  }

  navigateHome(): void {
    window.location.href = '/';
  }
}

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
      success: 'Email sikeresen megerősítve!',
      fail: 'Sikertelen megerősítes. A link lehet lejárt/már használt.'
    },
    delete: {
      success: 'A fiók sikeresen törölve.',
      fail: 'Nem sikerült törölni a fiókod. Kérjük, próbáld meg később!'
    },
    unknown: {
      success: 'Sikeres!',
      fail: 'Valami elromlott. Kérjük, próbáld meg később!'
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
      this.title = 'Siker!';
      this.message = typeConfig.success;
    } else {
      this.title = 'Hiba!';
      this.message = typeConfig.fail;
    }
  }

  navigateHome(): void {
    window.location.href = '/';
  }
}

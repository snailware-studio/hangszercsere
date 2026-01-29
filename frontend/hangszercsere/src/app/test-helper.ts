import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

export const TEST_IMPORTS = [
  HttpClientTestingModule,
  RouterTestingModule,
  FormsModule
];

export const TEST_PROVIDERS = [
  provideRouter([])
];
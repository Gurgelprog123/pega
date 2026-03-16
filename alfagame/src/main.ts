import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent as App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

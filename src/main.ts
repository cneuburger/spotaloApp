import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locate, star, shareSocial, ellipsisVertical, thumbsUp, heart } from 'ionicons/icons';

addIcons({
  locate,                // <ion-icon name="locate">
  star,                  // <ion-icon name="star">
  'share-social': shareSocial,      // <ion-icon name="share-social">
  'ellipsis-vertical': ellipsisVertical, // <ion-icon name="ellipsis-vertical">
  'thumbs-up': thumbsUp,
  heart
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    ModalController,
  ],
});

import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform
  ) {

    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    // 🟢 WICHTIG: StatusBar darf NICHT den WebView überlappen
    // await StatusBar.setOverlaysWebView({ overlay: false });

    // 🟢 WICHTIG: Edge-to-Edge aktivieren, damit safe-area berechnet wird
    // await EdgeToEdge.enable();

    // 🟢 Optional: helle Icons auf schwarzem Hintergrund
    // await StatusBar.setStyle({ style: Style.Light }); // Light = helle Icons, Dark = dunkle Icons
  }
}

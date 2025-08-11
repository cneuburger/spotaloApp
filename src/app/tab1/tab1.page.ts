import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { GoogleMap } from '@capacitor/google-maps';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Tab1Page {

  @ViewChild('mapEl', { read: ElementRef }) mapEl!: ElementRef<HTMLElement>;
  map: GoogleMap | undefined;

  constructor(private locationService: LocationService) {}

  async ngAfterViewInit() {
    await this.initMap(); // wie oben
  }

  ionViewDidEnter() { 

    requestAnimationFrame(() => this.initMap());
    // this.initMap(); 
  }

  ionViewWillEnter() {
    document.body.classList.add('map-active');
  }

  ionViewWillLeave() {
    document.body.classList.remove('map-active');
  }

  async initMap() {
    // const el = document.getElementById('map') as HTMLElement;
    const el = this.mapEl.nativeElement;
    await this.locationService.initGeoLocation();
    const loc = this.locationService.locationData;

    if (loc) { 

      let lat: number = loc.lat; // 48.24817;
      let lng: number = loc.lng; // 13.19592;

      this.map = await GoogleMap.create({
        id: 'main-map',
        element: el,
        apiKey: 'AIzaSyChuMIoGrgYGRrU8RE9-z-HYTWgqjJ2_kU', 
        config: {
          center: { lat: lat, lng: lng }, // Wien 😉
          zoom: 12,
          disableDefaultUI: false,
          minZoom: 2,
          maxZoom: 20,
          heading: 0,
          tilt: 0
        },
      });

      await this.map.addMarker(
        { coordinate: { lat: lat, lng: lng }, title: 'mein Standort' },
      );

      await this.map.setCamera({
        coordinate: { lat: lat, lng: lng },
        zoom: 16,
        animate: false,
      });

      console.log('position in tab2', JSON.stringify(loc));
    } else {
      console.error('Location nicht verfügbar');
    }    
  }

}

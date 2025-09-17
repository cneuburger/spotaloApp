import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, NgModule, ViewChild } from '@angular/core';
import { IonContent, IonButton, IonTextarea, IonCardContent, IonItem, IonCard, IonLabel, IonList, IonIcon } from '@ionic/angular/standalone';
import { GoogleMap } from '@capacitor/google-maps';
import { LocationService } from '../services/location.service';
import { ApiService } from '../services/api.service';
import { environment } from 'src/environments/environment';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

type Spot = {
  idSpot: number;
  latitude: string;   // kommt als String
  longitude: string;  // kommt als String
  text: string;
  category: number;
  createdAt: string;
  createdFrom: number;
  published: number;  // 1 = sichtbar
};


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonIcon, IonList, IonLabel, IonCard, IonItem, IonContent, IonButton, FormsModule, IonTextarea, IonCardContent, IonCardContent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Tab1Page {

  @ViewChild('mapEl', { read: ElementRef }) mapEl!: ElementRef<HTMLElement>;
  map: GoogleMap | undefined;

  appUserLatitude: number = 0;
  appUserLongitude: number = 0;
  sheetOpen: boolean = false;
  messageBoxOpen: boolean = false;
  textMessage: string = '';
  locAvailable: boolean = false;
  spots: any;

  constructor(
    private locationService: LocationService,
    private apiService: ApiService,
    private modalCtrl: ModalController
  ) {}

  async ngAfterViewInit() {
  //  await this.initMap(); // wie oben
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
    const el = this.mapEl.nativeElement;
    await this.locationService.initGeoLocation();
    const loc = this.locationService.locationData;
    this.locAvailable = true;
    //const loc = true;

    if (loc) { 

      let lat: number = loc.lat; 
      let lng: number = loc.lng; 

      //let lat: number = 48.24817;
      //let lng: number = 13.19592;      

      this.appUserLatitude = lat;
      this.appUserLongitude = lng;

      this.map = await GoogleMap.create({
        id: 'main-map',
        element: el,
        apiKey: environment.googleMapsApiKey, 
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

      this.getSpotlist();

      console.log('position in tab1: ', JSON.stringify(loc));
    } else {
      console.error('Location nicht verfügbar');
    }    
  }


  async getSpotlist() {
    let apiResponse = null;
    console.log('textmessage: ', this.textMessage);

    const params = {
      createdFrom: 1,
      category: 1,
      latitude: this.appUserLatitude,
      longitude: this.appUserLongitude
    };

    apiResponse = await this.apiService.getSpots(params);
    this.spots = apiResponse.data;
    console.log('spots: ' , JSON.stringify(this.spots));
    this.addSpotsToMap(this.spots);
  }


  async addSpotsToMap(spotsResponse: { data: Spot[] }) {
    const markers = spotsResponse.data
      // nur veröffentlichte Spots
      .filter(s => s.published === 1)
      // in Marker-Struktur transformieren
      .map(s => {
        const lat = this.toNum(s.latitude);
        const lng = this.toNum(s.longitude);
        return {
          id: s.idSpot,
          lat, lng,
          title: (s.text ?? "").trim() || `Spot #${s.idSpot}`,
        };
      })
      // ungültige Koordinaten raus
      .filter(m => m.lat !== null && m.lng !== null && !(m.lat === 0 && m.lng === 0));

    if (markers.length === 0) return;

    // -> Capacitor Google Maps erwartet: { coordinate: { lat, lng }, title? }
    const markerOpts = markers.map(m => ({
      coordinate: { lat: m.lat as number, lng: m.lng as number },
      title: m.title,
      // optional: snippet, iconUrl, opacity, draggable, ...
    }));

    // Performant in einem Rutsch hinzufügen
    await this.map?.addMarkers(markerOpts);

    // optional: Karte grob auf die Marker zentrieren (einfacher Mittelwert)
    /*
    const avgLat = markers.reduce((a, b) => a + (b.lat as number), 0) / markers.length;
    const avgLng = markers.reduce((a, b) => a + (b.lng as number), 0) / markers.length;
    await this.map?.setCamera({
      coordinate: { lat: avgLat, lng: avgLng },
      zoom: 12, // nach Bedarf anpassen
    });
*/
    // optional: Click-Listener pro Marker
    // (je nach Plugin-Version entweder globaler Listener oder per Marker-ID)
    // this.map.setOnMarkerClickListener(({ markerId }) => { ... });
  }


  async onSubmitMessage() {

    let apiResponse = null;
    console.log('textmessage: ', this.textMessage);

    const params = {
      createdFrom: 1,
      text: this.textMessage,
      category: 1,
      latitude: this.appUserLatitude,
      longitude: this.appUserLongitude
    };

    apiResponse = await this.apiService.postSpot(params);
    this.textMessage = '';
    this.messageBoxOpen = false;
    this.getSpotlist();
  }


  onSheetDismiss() {
    this.sheetOpen = false;
    document.body.classList.add('map-active');    // Map-Transparenz wieder an
  }

    
  leaveMessage() {
    console.log('leave message here ...'); 
    this.messageBoxOpen = true;
    /* ... */ 
  }

  recommend() {

  }


  favorite() { 
    console.log('favorite ...');
    /* ... */ 
  }

  share() { 
    console.log('share ... ');
    /* ... */ 
  }


  
  toNum(v: string | number | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
}

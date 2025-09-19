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

  private markerGroups: Record<number, string[]> = {};      // category -> [markerId, ...]
  private markerIdBySpotId = new Map<number, string>();   

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

      await this.map.addMarker({ 
        coordinate: { lat: lat, lng: lng }, 
        title: 'mein Standort',
        iconUrl: 'assets/icons/marker-user.png' 
      });

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


  async addNewSpot() {

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
    const valid = spotsResponse.data
      .filter(s => s.published === 1)
      .map(s => ({
        spot: s,
        lat: this.toNum(s.latitude),
        lng: this.toNum(s.longitude),
        title: (s.text ?? "").trim() || `Spot #${s.idSpot}`,
      }))
      .filter(m => m.lat !== null && m.lng !== null && !(m.lat === 0 && m.lng === 0));

    if (valid.length === 0) return;

    const markerOpts = valid.map(m => ({
      coordinate: { lat: m.lat as number, lng: m.lng as number },
      title: m.title,
      // iconUrl: getIconForCategory(m.spot.category) // optional
    }));

    // Wichtig: addMarkers liefert ein Array mit Marker-Infos inkl. id zurück
    if (!this.map) return;
    const ids: string[] = await this.map.addMarkers(markerOpts); // [{ id: string }, ...]
 //   if (!added) return;


    // Zuordnungen speichern
    valid.forEach((v, idx) => {
      const markerId = ids[idx];   // ist ein string
      this.markerIdBySpotId.set(v.spot.idSpot, markerId);

      const cat = v.spot.category ?? 0;
      if (!this.markerGroups[cat]) this.markerGroups[cat] = [];
      this.markerGroups[cat].push(markerId);
    });
  }


  async setCategoryVisible(category: number, visible: boolean) {
    const ids = this.markerGroups[category] ?? [];
    /*
    await Promise.all(
      ids.map(id => this.map.setMarkerVisibility({ markerId: id, visible }))
    );
    */
  }


  async addSpotsToMapOld(spotsResponse: { data: Spot[] }) {
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
      title: m.title
      // optional: snippet, iconUrl, opacity, draggable, ...
    }));

    // Performant in einem Rutsch hinzufügen
    await this.map?.addMarkers(markerOpts);
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

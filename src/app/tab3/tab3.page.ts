import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, NgModule, ViewChild } from '@angular/core';
import { IonContent, IonButton, IonTextarea, IonCardContent, IonItem, IonCard, IonLabel, IonList, IonIcon } from '@ionic/angular/standalone';
import { GoogleMap } from '@capacitor/google-maps';
import { LocationService } from '../services/location.service';
import { ApiService } from '../services/api.service';
import { environment } from 'src/environments/environment';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';

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

const MAX_LAT = 85.05112878; // Web-Mercator Clamp
const clampLat = (lat: number) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
const latToMercY = (lat: number) => {
  const φ = clampLat(lat) * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + φ / 2));
};
const mercYToLat = (y: number) => {
  const φ = 2 * Math.atan(Math.exp(y)) - Math.PI / 2;
  return φ * 180 / Math.PI;
};

// 33% von oben => relative Position zum Center = 0.33 - 0.50 = -0.17
const V_OFFSET = 0.17;
const isNative = Capacitor.getPlatform() !== 'web';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonList, IonLabel, IonCard, IonItem, IonContent, IonButton, FormsModule, IonTextarea, IonCardContent, IonCardContent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Tab3Page {

  @ViewChild('mapEl2', { read: ElementRef }) mapEl2!: ElementRef<HTMLElement>;
  map: GoogleMap | undefined;

  appUserLatitude: number = 0;
  appUserLongitude: number = 0;
  sheetOpen: boolean = false;
  messageBoxOpen: boolean = false;
  textMessage: string = '';
  locAvailable: boolean = false;
  spots: any;
  mapCenter: { lat: number; lng: number } | null = null;

  private markerGroups: Record<number, string[]> = {};      // category -> [markerId, ...]
  private markerIdBySpotId = new Map<number, string>();   

  constructor(
    private locationService: LocationService,
    private apiService: ApiService,
    private modalCtrl: ModalController
  ) {
    
  }

  async ngAfterViewInit() {
    this.setCrosshairVisible(false);
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
    const el = this.mapEl2.nativeElement;
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
          center: { lat: lat, lng: lng },
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
        zoom: 12,
        animate: false,
      });

      await this.map.setOnCameraIdleListener(async () => {
        this.mapCenter = await this.getCrosshairAt33Percent();
        console.log('Aktuelles Center:', this.mapCenter);
      });

      this.getSpotlist();

      console.log('position in tab1: ', JSON.stringify(loc));
    } else {
      console.error('Location nicht verfügbar');
    }    
  }


  async getCrosshairAt33Percent() {
    const bounds = await this.map?.getMapBounds();
    if (!bounds) return null;

    // Bounds
    const { southwest: sw, northeast: ne } = bounds;

    // Längengrad (x) ist in Mercator linear ⇒ Center bleibt gleich (kein horizontaler Offset)
    const lngCenter = (sw.lng + ne.lng) / 2;

    // In Mercator-Y umrechnen
    const yS = latToMercY(sw.lat);
    const yN = latToMercY(ne.lat);
    const yC = (yS + yN) / 2;
    const yRange = yN - yS;

    // Nach oben verschieben (negativ = Richtung Norden/oben)
    const yCross = yC + V_OFFSET * yRange;

    // Zurück nach Lat
    const latCrosshair = mercYToLat(yCross);

    return { lat: latCrosshair, lng: lngCenter };
  }


  setCrosshairVisible(show: boolean) {
    const el = document.getElementById('crosshair2');
    if (show) {
      el?.classList.remove('is-hidden');
    } else {
      el?.classList.add('is-hidden');
    }
  }


  async getCenter() {
    const bounds = await this.map?.getMapBounds();

    if (bounds) {
      const latCenter  = (bounds.southwest.lat + bounds.northeast.lat) / 2;
      const lngCenter  = (bounds.southwest.lng + bounds.northeast.lng) / 2;

      const latDiff = bounds.northeast.lat - bounds.southwest.lat;
      const latCrosshair = latCenter  + latDiff * 0.17; 
    
      return { latCrosshair, lngCenter };
    } else {
      return null;
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
      latitude: this.mapCenter?.lat ?? this.appUserLatitude,
      longitude: this.mapCenter?.lng ?? this.appUserLongitude
    };

    apiResponse = await this.apiService.postSpot(params);
    this.textMessage = '';
    this.messageBoxOpen = false;
    this.setCrosshairVisible(false);
    this.getSpotlist();
  }


  async cancelMessage() {
    this.textMessage = '';
    this.messageBoxOpen = false;
    this.setCrosshairVisible(false);
  }


  onSheetDismiss() {
    this.sheetOpen = false;
    document.body.classList.add('map-active');    // Map-Transparenz wieder an
  }

    
  leaveMessage() {
    console.log('leave message here ...'); 
    this.setCrosshairVisible(true);
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


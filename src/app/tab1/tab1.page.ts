import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

import * as L from 'leaflet';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class Tab1Page {

  error: string | null = null;
  map!: L.Map;
  marker!: L.Marker;

  constructor(private locationService: LocationService) {}


  async ionViewDidEnter() {
    await this.locationService.initGeoLocation();

    const loc = this.locationService.locationData;
    if (loc) {
      console.log('position in tab1', JSON.stringify(loc));
      this.showMap(loc.lat, loc.lng);
      this.showMarker(loc.lat, loc.lng);
      setTimeout(() => {
        
        
        this.map.invalidateSize();
      }, 1200); // kleiner Delay nötig bei Ionic
    } else {
      console.error('Location nicht verfügbar');
    }
  }


  showMap(lat: number, lng: number) {
    console.log('starting to show map ...');
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });

    if (this.map) {
      this.map.remove(); // alte Instanz entfernen
    }

    this.map = L.map('map').setView([lat, lng], 13); // z. B. München

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);



/*
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      this.showMarker(lat, lng);
    });
    */
  }


  showMarker(lat: number, lng: number) {
    console.log('starting to show marker ...');
    // Marker platzieren oder verschieben
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

      this.marker.on('dragend', (event) => {
        const newLatLng = this.marker.getLatLng();
        console.log('Marker verschoben:', newLatLng.lat, newLatLng.lng);

        // Optional: Weiterverarbeiten
     //   this.onMarkerMoved(newLatLng.lat, newLatLng.lng);
      });
    }
  }


  async onMarkerMoved(lat: number, lng: number) {
    console.log('Ausgewählter Standort:', lat, lng);
    this.map.setView(new L.LatLng(lat, lng), this.map.getZoom());
  }


  async refreshMap() {

  }

}

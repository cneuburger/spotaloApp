import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  locationData: any = {
    lat: 0,
    lng: 0,
    ready: false
  };

  constructor() { }


  async initGeoLocation(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Anfrage der Berechtigung zur Laufzeit auf mobilen Geräten
        const permStatus = await Geolocation.checkPermissions();

        if (permStatus.location !== 'granted') {
          const newPerm = await Geolocation.requestPermissions();
          if (newPerm.location !== 'granted') {
            throw new Error('Location permission not granted');
          }
        }
      }

      const position = await Geolocation.getCurrentPosition();

      this.locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log('position: ', JSON.stringify(this.locationData));
    } catch (error) {
      console.error('Fehler beim Abrufen der Geoposition:', error);
      // Optional: Fallback-Location setzen
      /*
      this.locationData = {
        lat: 51.5074, // London
        lng: -0.1278
      };
      */
    }
  }


  initGeoLocationBrowser(): Promise<void> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => {
          console.log('Browser position:', position);
          this.locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            ready: true
          };
          resolve();
        },
        error => {
          console.error('Error getting location from browser:', error);
          reject(error);
        }
      );
    });
  }


  async initGeoLocationDevice() {

    this.locationData.lat = 0;
    this.locationData.lng = 0;
    this.locationData.ready = false;


    // Use Capacitor's plugin on native platforms
    try {
      const perm = await Geolocation.requestPermissions();
      if (perm.location === 'granted') {
        console.log('granted!');

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });

        console.log('Position:', position);
        
        this.locationData.lat = position.coords.latitude;
        this.locationData.lng = position.coords.longitude;
        this.locationData.ready = true;

      } else {
        console.error('Keine Berechtigung für Standort');
      }
    } catch (error) {
      console.error('Error getting location from Capacitor:', error);
    }
  }
}

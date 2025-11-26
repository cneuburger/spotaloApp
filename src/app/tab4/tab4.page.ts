import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import mapboxgl from 'mapbox-gl';
import area from '@turf/area';
import type { FeatureCollection, Polygon } from 'geojson';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  imports: [IonFabButton, IonFab, IonContent]
})
export class Tab4Page {

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map?: mapboxgl.Map;
  private draw?: MapboxDraw;

  sqm = 0; // Fläche in m²

  constructor(
  ) {}

  ngAfterViewInit(): void {

    (mapboxgl as any).accessToken = environment.mapboxToken;
/*
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [11.5761, 48.1374], // beliebiges Startzentrum
      // center: [48.2479, 13.1951], // beliebiges Startzentrum
      zoom: 12,
      attributionControl: false,
    });
    */

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      center: [13.313, 47.695],
      zoom: 17,
      style: "https://kataster.bev.gv.at/styles/kataster/style_basic.json", // style URL or style object
      // replace with your own
      accessToken:
        "pk.eyJ1IjoibWF0dXJhOTAiLCJhIjoiY2l0azJuZXAwMDA0MDN4bGkweWhwdGtwMCJ9.2VXOscIO4usCvn0A8MNVQw"
    });    

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'draw_polygon',
    });
    this.map.addControl(this.draw, 'top-left');

    // ⬇️ WICHTIG: Nach dem Laden einmal resizen
    this.map.on('load', () => {
      this.map?.resize();
     // this.map?.setCenter([48.2479, 13.1951]);
    });

    const updateArea = () => {
      if (!this.draw) return;
      const data = this.draw.getAll() as FeatureCollection;
      if (!data.features.length) {
        this.sqm = 0;
        return;
      }
      const last = data.features[data.features.length - 1];
      if (last.geometry.type !== 'Polygon') {
        this.sqm = 0;
        return;
      }
      const poly = last as unknown as GeoJSON.Feature<Polygon>;
      this.sqm = area(poly); // m²
    };

    // Event-Handler registrieren
    this.map.on('draw.create', updateArea);
    this.map.on('draw.update', updateArea);
    this.map.on('draw.delete', () => (this.sqm = 0));
  }

  get readableArea(): string {
    return this.sqm >= 10_000 ? `${(this.sqm / 10_000).toFixed(2)} ha` : `${this.sqm.toFixed(0)} m²`;
  }

  clearAll(): void {
    this.draw?.deleteAll();
    this.sqm = 0;
  }

  ngOnDestroy(): void {
    if (!this.map || !this.draw) return;
    try {
      this.map.off('draw.create', () => {});
      this.map.off('draw.update', () => {});
      this.map.off('draw.delete', () => {});
      this.map.removeControl(this.draw);
      this.map.remove();
    } catch {}
  }

}

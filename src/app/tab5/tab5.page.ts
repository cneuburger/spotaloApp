import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import {applyStyle, apply} from "ol-mapbox-style";
import GeoJSON from 'ol/format/GeoJSON';
import TileWMS from 'ol/source/TileWMS';

@Component({
  selector: 'app-tab5',
  templateUrl: 'tab5.page.html',
  styleUrls: ['tab5.page.scss'],
  imports: [IonContent]
})
export class Tab5Page {
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  map!: Map;
  private vectorSource?: VectorSource;

  ngAfterViewInit() {

    const baseLayer = new TileLayer({
      source: new OSM()
    });


    const parzellarkarteLayer = new TileLayer({
      source: new TileWMS({
        url: 'https://geoservices.bayern.de/od/wms/alkis/v1/parzellarkarte?',
        params: {
          SERVICE: 'WMS',
          VERSION: '1.3.0',
          REQUEST: 'GetMap',
          LAYERS: 'by_alkis_parzellarkarte_farbe', // aus deinem XML
          STYLES: '',
          FORMAT: 'image/png',
          TRANSPARENT: true
        },
        serverType: 'geoserver' // oder 'mapserver' / 'qgis' – hier optional
      })
    });


    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [baseLayer, parzellarkarteLayer],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2
      })
    });

    
    // Mapbox-Style vollautomatisch laden
    apply(
      this.map,
      "../assets/ol/style_basic.json"
    ).then(() => {
      console.log("Kataster-Style geladen!");
    });
    
  }
}

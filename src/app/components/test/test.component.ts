import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonList, IonItem, IonIcon, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-test',
  styleUrls: ['./test.component.scss'],
  imports: [CommonModule, IonContent, IonList, IonItem, IonIcon, IonLabel],
  template: `
    <ion-content class="ion-padding">
      <h3>Aktionen</h3>
      <ion-list inset="true">
        <ion-item button>
          <ion-icon slot="start" name="locate"></ion-icon>
          <ion-label>Hierhin zentrieren 123</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `
})
export class TestComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}

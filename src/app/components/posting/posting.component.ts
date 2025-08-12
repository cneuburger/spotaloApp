import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonContent, IonList, IonItem, IonIcon, IonLabel } from "@ionic/angular/standalone";

@Component({
  selector: 'app-posting',
  templateUrl: './posting.component.html',
  styleUrls: ['./posting.component.scss'],
  imports: [IonLabel, IonIcon, IonItem, IonList, IonContent]
})
export class PostingComponent  implements OnInit {

  @Input() center?: { lat: number; lng: number }; // Beispielprop
  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {}

  close(role: 'recenter'|'favorite'|'share'|'cancel' = 'cancel') {
    this.modalCtrl.dismiss(null, role);
  }
}

import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  apiEndpoint = 'https://spotalo.cn-service.net/api/v1/';
  apiKey = 'abc';

  constructor() { }

  async postSpot(params?: any) {
    const options={
      method: 'POST',
      url: this.apiEndpoint + 'spots',
      data: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        apikey: this.apiKey
      },
    }

    const response:HttpResponse=await CapacitorHttp.post(options);
    return response;
  }

  async getSpots(params?: any) {
    const options={
      method: 'GET',
      url: this.apiEndpoint + 'spots',
      headers: {
        apikey: this.apiKey
      },
    }

    const response:HttpResponse=await CapacitorHttp.get(options);
    return response;
  }  

}

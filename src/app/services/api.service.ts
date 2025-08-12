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
      params: params,
      headers: {apikey: this.apiKey},
    }

    const response:HttpResponse=await CapacitorHttp.post(options);
    return response;
  }

}

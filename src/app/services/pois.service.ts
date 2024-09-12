import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient} from '@angular/common/http';
import { POI } from '../models/POI.model';

@Injectable({
  providedIn: 'root'
})
export class POIsService {

  constructor(private http: HttpClient) { }

  getAllPOIs(): Observable<POI[]> {
    return this.http.get<POI[]>('https://challenge-backend.mobi7.io/pois');
  }

  // // Função para retornar todos os POIs disponíveis
  // getAllPOIs(): Observable<POIs[]> {
  //   return this.http.get<{ pois: POIs[] }>('../../assets/pois.json').pipe(
  //     map(response => response.pois)
  //   );
  // }

  // Função para retornar um POI com base no nome passado como parâmetro
  // getPOIByName(nome: string): Observable<POIs | undefined> {
  //   return this.http.get<{ pois: POIs[] }>('../../assets/pois.json').pipe(
  //     map(response => response.pois.find(poi => poi.nome === nome))
  //   );
  // }







}

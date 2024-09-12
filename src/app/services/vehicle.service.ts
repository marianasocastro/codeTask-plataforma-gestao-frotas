import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of} from 'rxjs';
import { HttpClient} from '@angular/common/http';
import { Position } from '../models/Position.model';
import { POI } from '../models/POI.model';
import { VehicleWithPOIs } from '../models/vehicleWithPOIs.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  constructor(private http: HttpClient) { }

  getPlacas(): Observable<string[]> {
    return this.http.get<string[]>('https://challenge-backend.mobi7.io/posicao/placas');
  }

  getAllPositions(): Observable<Position[]> {
    return this.http.get<any[]>(`https://challenge-backend.mobi7.io/posicao`).pipe(
      map((apiResponse: any[]) => {
        // Mapeia os dados retornados pela API para a interface Position
        return apiResponse.map((item: any) => ({
          id: item.id,
          placa: item.placa,
          data: item.data,
          velocidade: item.velocidade,
          latitude: item.latitude,
          longitude: item.longitude,
          ignicao: item.ignicao
        }) as Position);
      })
    );
  }

  getAllPOIs(): Observable<POI[]> {
    return this.http.get<POI[]>('https://challenge-backend.mobi7.io/pois');
  }

  getAllVehiclesWithPOIs(): Observable<VehicleWithPOIs[]> {
    return forkJoin({
      placas: this.getPlacas(),
      positions: this.getAllPositions(),
      pois: this.getAllPOIs()
    }).pipe(
      map(({ placas, positions, pois }) => {
        // Agrupar as posições por placa
        const vehiclesGroupedByPlaca = positions.reduce((acc: { [key: string]: Position[] }, pos: Position) => {
          if (!acc[pos.placa]) {
            acc[pos.placa] = [];
          }
          acc[pos.placa].push(pos);
          return acc;
        }, {});

        // Agrupar POIs por nome
        const poisByName = pois.reduce((acc: { [key: string]: POI }, poi: POI) => {
          acc[poi.nome] = poi;
          return acc;
        }, {});

        // Criar o array VehicleWithPOIs[]
        return placas.map(placa => {
          const vehiclePositions = vehiclesGroupedByPlaca[placa] || [];

          const positionsByPOI = Object.values(poisByName).map((poi: POI) => {
            const positionsForPOI = vehiclePositions.filter(pos => {
              const distance = this.calculateDistance(pos.latitude, pos.longitude, poi.latitude, poi.longitude);
              return distance <= poi.raio && !pos.ignicao;
            });

            const { totalDuration, durationsByDate } = this.calculatePOIDurations(positionsForPOI, poi.latitude, poi.longitude, poi.raio);

            return {
              poi_name: poi.nome,
              latitude: poi.latitude,
              longitude: poi.longitude,
              positions: durationsByDate,
              duration: totalDuration
            };
          }).filter(poi => poi.positions.length > 0); // Filtrar POIs sem posições

          return {
            placa: placa,
            positionsByPOI: positionsByPOI
          } as VehicleWithPOIs;
        });
      }),
      catchError(error => {
        console.error('Erro ao obter veículos com POIs:', error);
        return of([]); // Retorna um array vazio em caso de erro
      })
    );
  }

  // Função para calcular a distância entre dois pontos geográficos
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  }


  // Função para calcular a duração total e por data
  private calculatePOIDurations(positions: Position[], latitude: number, longitude: number, radius: number): { durationsByDate: { date: string, duration: string }[], totalDuration: string } {
    const durationsByDate: { [key: string]: number } = {}; // Armazena duração total por data
    let entryTime: Date | null = null; // Armazena o momento de entrada no local
    let totalDuration = 0; // Duração total por POI

    for (const position of positions) {
      const positionDate = new Date(position.data);
      const distance = this.calculateDistance(position.latitude, position.longitude, latitude, longitude);

      if (distance <= radius && !position.ignicao) {
        if (!entryTime) {
          entryTime = positionDate; // Marca a hora de entrada
        }
      } else {
        if (entryTime) {
          totalDuration += this.splitDurationByDates(entryTime, positionDate, durationsByDate);
          entryTime = null; // Reseta o tempo de entrada
        }
      }
    }

    // Se ainda houver uma entrada ativa (não teve saída), processar a última posição
    if (entryTime) {
      const lastPositionDate = new Date(positions[positions.length - 1].data);
      totalDuration += this.splitDurationByDates(entryTime, lastPositionDate, durationsByDate);
    }

    return {
      totalDuration: this.formatDuration(totalDuration),
      durationsByDate: Object.keys(durationsByDate).map(date => ({
        date,
        duration: this.formatDuration(durationsByDate[date])
      }))
    };
  }


  private splitDurationByDates(entryTime: Date, exitTime: Date, durationsByDate: { [key: string]: number }): number {
    let totalDuration = 0;
    let isFirstDay = true; // Variável para identificar o primeiro dia

    // Processar cada dia de permanência
    while (entryTime < exitTime) {
      const entryDateStr = entryTime.toISOString().split('T')[0]; // Data no formato YYYY-MM-DD

      // Determinar o final do dia atual (23:59:59) garantindo que o fuso horário seja mantido
      const endOfDay = new Date(entryTime);
      endOfDay.setUTCHours(23, 59, 59, 999); // Definir o final do dia (23:59:59 UTC)

      if (isFirstDay) {
        // No primeiro dia, usamos o horário de entrada real
        isFirstDay = false; // Após o primeiro dia, tratamos os dias subsequentes
      } else {
        // Para os dias subsequentes, começamos sempre às 00:00:00
        console.log("Dia subsequente, começando às 00:00:00.");
        entryTime.setUTCHours(0, 0, 0, 0); // Início do dia às 00:00:00 UTC
      }

      // Comparar o exitTime com o final do dia e usar o menor deles para calcular a duração
      const durationForThisDay = Math.min(exitTime.getTime(), endOfDay.getTime()) - entryTime.getTime();
      totalDuration += durationForThisDay;

      // Adicionar a duração deste dia ao objeto durationsByDate
      if (!durationsByDate[entryDateStr]) {
        durationsByDate[entryDateStr] = 0;
      }
      durationsByDate[entryDateStr] += durationForThisDay;
      // Atualizar entryTime para o próximo dia, sempre começando à meia-noite
      entryTime = new Date(endOfDay.getTime() + 1); // Próximo dia
      entryTime.setUTCHours(0, 0, 0, 0); // Garantir que o próximo dia comece às 00:00:00 UTC
    }

    return totalDuration;
  }

  private formatDuration(durationMs: number): string {
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    let result = '';
    if (days > 0) result += `${days} dias `;
    if (hours > 0) result += `${hours} horas `;
    if (minutes > 0) result += `${minutes} minutos`;

    return result.trim();
  }
}


























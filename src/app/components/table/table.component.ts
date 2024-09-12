import { POIsService } from './../../services/pois.service';
import { VehicleService } from './../../services/vehicle.service';
import { Component, OnInit } from '@angular/core';
import { VehicleWithPOIs } from 'src/app/models/vehicleWithPOIs.model';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {

  allVehicles!: VehicleWithPOIs[];
  filteredVehicles!: VehicleWithPOIs[];
  placas!: string[];


  constructor( private vehicleService: VehicleService, private POIsService: POIsService) { }

  ngOnInit(): void {

    this.vehicleService.getPlacas().subscribe( data => {
      this.placas = data
      console.log(this.placas)
      }
    )

    this.vehicleService.getAllVehiclesWithPOIs().subscribe( data => {
      this.allVehicles = data;
      this.filteredVehicles = data;
      console.log(this.allVehicles)
    })
  }

  getGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  getTotalPositions(vehicle: any): number {
    return vehicle.positionsByPOI.reduce((sum: any, poi: { positions: string | any[]; }) => sum + poi.positions.length, 0);
  }





  // onFilterApplied(filter: { placa: string, data: string | undefined }) {
  //   console.log('Filtro aplicado:', filter);

  //   // Verifica se há filtro de placa ou de data
  //   const hasPlacaFilter = filter.placa && filter.placa !== 'Todas';
  //   const hasDateFilter = !!filter.data;

  //   // Formata a data do filtro para o formato yyyy-mm-dd, se fornecida
  //   const formattedFilterDate = hasDateFilter ? new Date(filter.data!).toISOString().split('T')[0] : '';

  //   // Filtra os veículos
  //   this.filteredVehicles = this.allVehicles.filter(vehicle => {
  //     // Se o filtro de placa for fornecido, verifica se corresponde
  //     const matchesPlaca = hasPlacaFilter ? vehicle.placa === filter.placa : true;

  //     // Se o filtro de data for fornecido, verifica se ao menos um POI corresponde à data
  //     const matchesData = hasDateFilter
  //       ? vehicle.POIs.some(poi => {
  //           const poiDate = new Date(poi.data_posicao);
  //           const formattedPOIDate = `${poiDate.getFullYear()}-${(poiDate.getMonth() + 1).toString().padStart(2, '0')}-${poiDate.getDate().toString().padStart(2, '0')}`;
  //           return formattedPOIDate === formattedFilterDate;
  //         })
  //       : true;

  //     // Retorna verdadeiro apenas se o veículo corresponder ao filtro de placa e/ou ao filtro de data
  //     return matchesPlaca && matchesData;
  //   });

  //   console.log(this.filteredVehicles); // Exibe os veículos filtrados
  // }


  onFilterApplied(filter: { placa: string, data: string | undefined }) {
    console.log('Filtro aplicado:', filter);

    // Verifica se há filtro de placa ou de data
    const hasPlacaFilter = filter.placa && filter.placa !== 'Todas';
    const hasDateFilter = !!filter.data;

    // Formata a data do filtro para o formato yyyy-mm-dd, se fornecida
    const formattedFilterDate = hasDateFilter ? new Date(filter.data!).toLocaleDateString('en-CA') : '';

    // Filtra os veículos
    const filteredVehicles = this.allVehicles
      .map(vehicle => {
        // Filtra os POIs com base na data fornecida, se existir
        const filteredPOIs = vehicle.positionsByPOI.map(poi => {
          const filteredPositions = hasDateFilter
            ? poi.positions.filter(pos => {
                const posDate = new Date(pos.date);
                // Formata a data da posição no mesmo padrão do filtro
                const formattedPosDate = posDate.toLocaleDateString('en-CA'); // 'en-CA' retorna yyyy-mm-dd

                return formattedPosDate === formattedFilterDate;
              })
            : poi.positions;

          return { ...poi, positions: filteredPositions };
        }).filter(poi => poi.positions.length > 0); // Filtra POIs que têm posições

        // Verifica se o veículo corresponde ao filtro de placa e tem POIs filtrados
        const matchesPlaca = hasPlacaFilter ? vehicle.placa === filter.placa : true;
        const hasFilteredPOIs = filteredPOIs.length > 0;

        // Retorna o veículo somente se corresponder ao filtro de placa e/ou tiver POIs filtrados
        if (matchesPlaca && hasFilteredPOIs) {
          return { ...vehicle, positionsByPOI: filteredPOIs };
        } else {
          return null;
        }
      })
      .filter(vehicle => vehicle !== null) as VehicleWithPOIs[];

    this.filteredVehicles = filteredVehicles;

    console.log(this.filteredVehicles); // Exibe os veículos filtrados
  }







}

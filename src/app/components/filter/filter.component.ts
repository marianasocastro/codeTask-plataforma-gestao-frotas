import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {

  @Input() placas: string[] = []; // Recebe as placas do componente pai
  @Output() filterApplied = new EventEmitter<{ placa: string, data: string | undefined }>(); // Emite o filtro para o pai

  placa: string = ''; // Placa selecionada no dropdown
  data: string | undefined; // Data selecionada

  constructor() { }

  ngOnInit(): void {
  }

  applyFilter() {
    // Emite os filtros (placa e data) para o componente pai
    console.log(this.placa, this.data)
    this.filterApplied.emit({
      placa: this.placa,
      data: this.data
    });
  }

}

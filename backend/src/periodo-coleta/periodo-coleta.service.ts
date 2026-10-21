import { Injectable } from '@nestjs/common';
import { CreatePeriodoColetaDto } from './dto/create-periodo-coleta.dto';
import { UpdatePeriodoColetaDto } from './dto/update-periodo-coleta.dto';

@Injectable()
export class PeriodoColetaService {
  create(_createPeriodoColetaDto: CreatePeriodoColetaDto) {
    return 'This action adds a new periodoColeta';
  }

  findAll() {
    return `This action returns all periodoColeta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} periodoColeta`;
  }

  update(id: number, _updatePeriodoColetaDto: UpdatePeriodoColetaDto) {
    return `This action updates a #${id} periodoColeta`;
  }

  remove(id: number) {
    return `This action removes a #${id} periodoColeta`;
  }
}

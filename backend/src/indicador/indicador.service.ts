import { Injectable } from '@nestjs/common';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';

@Injectable()
export class IndicadorService {
  create(_createIndicadorDto: CreateIndicadorDto) {
    return 'This action adds a new indicador';
  }

  findAll() {
    return `This action returns all indicador`;
  }

  findOne(id: number) {
    return `This action returns a #${id} indicador`;
  }

  update(id: number, _updateIndicadorDto: UpdateIndicadorDto) {
    return `This action updates a #${id} indicador`;
  }

  remove(id: number) {
    return `This action removes a #${id} indicador`;
  }
}

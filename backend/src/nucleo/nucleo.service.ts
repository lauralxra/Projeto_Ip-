import { Injectable } from '@nestjs/common';
import { CreateNucleoDto } from './dto/create-nucleo.dto';
import { UpdateNucleoDto } from './dto/update-nucleo.dto';

@Injectable()
export class NucleoService {
  create(_createNucleoDto: CreateNucleoDto) {
    return 'This action adds a new nucleo';
  }

  findAll() {
    return `This action returns all nucleo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nucleo`;
  }

  update(id: number, _updateNucleoDto: UpdateNucleoDto) {
    return `This action updates a #${id} nucleo`;
  }

  remove(id: number) {
    return `This action removes a #${id} nucleo`;
  }
}

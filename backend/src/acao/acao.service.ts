import { Injectable } from '@nestjs/common';
import { CreateAcaoDto } from './dto/create-acao.dto';
import { UpdateAcaoDto } from './dto/update-acao.dto';

@Injectable()
export class AcaoService {
  create(_createAcaoDto: CreateAcaoDto) {
    return 'This action adds a new acao';
  }

  findAll() {
    return `This action returns all acao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} acao`;
  }

  update(id: number, _updateAcaoDto: UpdateAcaoDto) {
    return `This action updates a #${id} acao`;
  }

  remove(id: number) {
    return `This action removes a #${id} acao`;
  }
}

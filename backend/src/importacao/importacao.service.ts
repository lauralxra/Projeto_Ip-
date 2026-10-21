import { Injectable } from '@nestjs/common';
import { CreateImportacaoDto } from './dto/create-importacao.dto';
import { UpdateImportacaoDto } from './dto/update-importacao.dto';

@Injectable()
export class ImportacaoService {
  create(_createImportacaoDto: CreateImportacaoDto) {
    return 'This action adds a new importacao';
  }

  findAll() {
    return `This action returns all importacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} importacao`;
  }

  update(id: number, _updateImportacaoDto: UpdateImportacaoDto) {
    return `This action updates a #${id} importacao`;
  }

  remove(id: number) {
    return `This action removes a #${id} importacao`;
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AcaoService } from './acao.service';
import { CreateAcaoDto } from './dto/create-acao.dto';
import { UpdateAcaoDto } from './dto/update-acao.dto';

@Controller('acao')
export class AcaoController {
  constructor(private readonly acaoService: AcaoService) {}

  @Post()
  create(@Body() createAcaoDto: CreateAcaoDto) {
    return this.acaoService.create(createAcaoDto);
  }

  @Get()
  findAll() {
    return this.acaoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.acaoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAcaoDto: UpdateAcaoDto) {
    return this.acaoService.update(+id, updateAcaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.acaoService.remove(+id);
  }
}

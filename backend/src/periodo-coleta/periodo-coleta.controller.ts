import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PeriodoColetaService } from './periodo-coleta.service';
import { CreatePeriodoColetaDto } from './dto/create-periodo-coleta.dto';
import { UpdatePeriodoColetaDto } from './dto/update-periodo-coleta.dto';

@Controller('periodo-coleta')
export class PeriodoColetaController {
  constructor(private readonly periodoColetaService: PeriodoColetaService) {}

  @Post()
  create(@Body() createPeriodoColetaDto: CreatePeriodoColetaDto) {
    return this.periodoColetaService.create(createPeriodoColetaDto);
  }

  @Get()
  findAll() {
    return this.periodoColetaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodoColetaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePeriodoColetaDto: UpdatePeriodoColetaDto,
  ) {
    return this.periodoColetaService.update(+id, updatePeriodoColetaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.periodoColetaService.remove(+id);
  }
}

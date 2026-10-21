import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IndicadorService } from './indicador.service';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';

@Controller('indicador')
export class IndicadorController {
  constructor(private readonly indicadorService: IndicadorService) {}

  @Post()
  create(@Body() createIndicadorDto: CreateIndicadorDto) {
    return this.indicadorService.create(createIndicadorDto);
  }

  @Get()
  findAll() {
    return this.indicadorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.indicadorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIndicadorDto: UpdateIndicadorDto,
  ) {
    return this.indicadorService.update(+id, updateIndicadorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.indicadorService.remove(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ImportacaoService } from './importacao.service';
import { CreateImportacaoDto } from './dto/create-importacao.dto';
import { UpdateImportacaoDto } from './dto/update-importacao.dto';

@Controller('importacao')
export class ImportacaoController {
  constructor(private readonly importacaoService: ImportacaoService) {}

  @Post()
  create(@Body() createImportacaoDto: CreateImportacaoDto) {
    return this.importacaoService.create(createImportacaoDto);
  }

  @Get()
  findAll() {
    return this.importacaoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importacaoService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateImportacaoDto: UpdateImportacaoDto,
  ) {
    return this.importacaoService.update(+id, updateImportacaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.importacaoService.remove(+id);
  }
}

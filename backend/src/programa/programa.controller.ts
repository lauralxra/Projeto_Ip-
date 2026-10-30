import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProgramaService } from './programa.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('programas')
export class ProgramaController {
  constructor(private readonly programaService: ProgramaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listarAtivos() {
    return this.programaService.listarAtivos();
  }

  @Get('contagem')
  @UseGuards(JwtAuthGuard)
  contarAtivos() {
    return this.programaService.contarAtivos();
  }
  @Get('por-nucleo')
    @UseGuards(JwtAuthGuard)
    contarPorNucleo() {
        return this.programaService.contarPorNucleo();
    }
}
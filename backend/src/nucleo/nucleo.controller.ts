import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NucleoService } from './nucleo.service';

@Controller('nucleos')
export class NucleoController {
  constructor(private readonly nucleoService: NucleoService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listarAtivos() {
    return this.nucleoService.listarAtivos();
  }
}
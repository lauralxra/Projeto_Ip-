import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  create(createUserDto: CreateUserDto) {
    return createUserDto;
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    const { senhaHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return updateUserDto;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  async countAtivos() {
    return this.prisma.user.count({
      where: {
        ativo: true,
        deletedAt: null,
      },
    });
  }

}

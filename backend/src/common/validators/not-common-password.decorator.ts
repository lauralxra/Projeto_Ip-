import { registerDecorator, ValidationOptions } from 'class-validator';
import { isSenhaComum } from './senhas-comuns';

// RN01: recusa senhas presentes na lista de senhas comuns
export function IsNotCommonPassword(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isNotCommonPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && !isSenhaComum(value);
        },
      },
    });
  };
}

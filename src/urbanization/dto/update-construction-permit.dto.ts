import { PartialType } from '@nestjs/swagger';
import { CreateConstructionPermitDto } from './create-construction-permit.dto';

export class UpdateConstructionPermitDto extends PartialType(
  CreateConstructionPermitDto,
) {}

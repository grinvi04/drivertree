import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { IsIn, IsNumber, IsNotEmpty } from 'class-validator';

class MaintenanceDto {
  @IsNotEmpty()
  @IsIn(['compact', 'sedan', 'suv', 'large'])
  carType: 'compact' | 'sedan' | 'suv' | 'large';

  @IsNotEmpty()
  @IsIn(['gasoline', 'diesel', 'electric'])
  fuelType: 'gasoline' | 'diesel' | 'electric';

  @IsNumber()
  @IsNotEmpty()
  annualMileage: number;

  @IsNumber()
  @IsNotEmpty()
  insuranceCost: number;
}

@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Get('penalties')
  getPenalties() {
    return this.calculatorService.getPenaltyRules();
  }

  @Post('maintenance')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  calculateMaintenance(@Body() dto: MaintenanceDto) {
    return this.calculatorService.calculateMaintenance(dto);
  }
}

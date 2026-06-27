import { Module } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CustomerDomainService } from './customer.domain';
import { CustomerApplicationService } from './customer.app';
import { CustomerController } from './customer.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CustomerController],
  providers: [CustomerRepository, CustomerDomainService, CustomerApplicationService],
  exports: [CustomerRepository, CustomerApplicationService],
})
export class CustomerModule {}

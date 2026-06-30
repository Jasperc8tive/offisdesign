import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}

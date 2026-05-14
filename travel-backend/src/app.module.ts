import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { ConfigModule } from '@nestjs/config';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { AmenitiesModule } from './modules/amenities/amenities.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { RoomTypesModule } from './modules/room-types/room-types.module';
import { DestinationImagesModule } from './modules/destination-images/destination-images.module';
import { HotelImagesModule } from './modules/hotel-images/hotel-images.module';
import { HotelAmenitiesModule } from './modules/hotel-amenities/hotel-amenities.module';
import { ToursModule } from './modules/tours/tours.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({

  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'docker' ? '.env.docker' : '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule, AuthModule, UsersModule,
    RolesModule, PermissionsModule, AccessControlModule, DestinationsModule, HotelsModule,
    RoomTypesModule, DestinationImagesModule, HotelImagesModule, HotelAmenitiesModule, AmenitiesModule,
    ToursModule, BookingsModule, PaymentsModule, RealtimeModule, DashboardModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

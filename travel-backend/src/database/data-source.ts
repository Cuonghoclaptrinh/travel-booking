import 'dotenv/config';
import { DataSource } from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { UserRole } from 'src/modules/roles/entities/user-role.entity';
import { RolePermission } from 'src/modules/roles/entities/role-permission.entity';
import { Destination } from 'src/modules/destinations/entities/destination.entity';
import { Amenity } from 'src/modules/amenities/entities/amenity.entity';
import { DestinationImage } from 'src/modules/destination-images/entities/destination-image.entity';
import { Hotel } from 'src/modules/hotels/entities/hotel.entity';
import { HotelImage } from 'src/modules/hotel-images/entities/hotel-image.entity';
import { HotelAmenity } from 'src/modules/hotel-amenities/entities/hotel-amenity.entity';
import { RoomType } from 'src/modules/room-types/entities/room-type.entity';
import { Tour } from 'src/modules/tours/entities/tour.entity';
import { TourPackage } from 'src/modules/tours/entities/tour-package.entity';
import { TourDeparture } from 'src/modules/tours/entities/tour-departure.entity';
import { DepartureOption } from 'src/modules/tours/entities/departure-option.entity';
import { PaymentTransaction } from 'src/modules/payments/entities/payment-transaction.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Role, Permission, UserRole, RolePermission, Destination, 
        Amenity, DestinationImage, Hotel, HotelImage, HotelAmenity, RoomType , Tour , TourPackage,
              TourDeparture,
              DepartureOption, PaymentTransaction , Booking],
    synchronize: false,
    logging: true,

});
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { TourDeparture } from './entities/tour-departure.entity';
import { CreateTourDepartureDto } from './dto/create-tour-departure.dto';
import { UpdateTourDepartureDto } from './dto/update-tour-departure.dto';
import { TourDepartureStatus } from './tour.enums';

@Injectable()
export class TourDeparturesService {
    constructor(
        @InjectRepository(Tour)
        private readonly tourRepository: Repository<Tour>,

        @InjectRepository(TourDeparture)
        private readonly tourDepartureRepository: Repository<TourDeparture>,
    ) { }

    async getByTourId(tourId: number) {
        await this.ensureTourExists(tourId);

        const items = await this.tourDepartureRepository.find({
            where: { tourId },
            relations: {
                options: true,
            },
            order: {
                departureDate: 'ASC',
                id: 'ASC',
            },
        });

        return items.map((item) => this.mapDepartureOutput(item));
    }

    async getById(tourId: number, departureId: number) {
        await this.ensureTourExists(tourId);

        const entity = await this.tourDepartureRepository.findOne({
            where: {
                id: departureId,
                tourId,
            },
            relations: {
                options: true,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour departure not found');
        }

        return this.mapDepartureOutput(entity);
    }

    async create(tourId: number, dto: CreateTourDepartureDto) {
        await this.ensureTourExists(tourId);
        await this.validateCodeUnique(tourId, dto.code);
        this.validateDateLogic(dto);

        const entity = this.tourDepartureRepository.create({
            ...dto,
            tourId,
            departureDate: new Date(dto.departureDate),
            returnDate: new Date(dto.returnDate),
            registrationDeadline: dto.registrationDeadline
                ? new Date(dto.registrationDeadline)
                : undefined,
            bookedSlots: 0,
            basePriceAdjustment: String(dto.basePriceAdjustment ?? 0),
            status: dto.status ?? TourDepartureStatus.DRAFT,
        });

        const created = await this.tourDepartureRepository.save(entity);
        return this.getById(tourId, created.id);
    }

    async update(
        tourId: number,
        departureId: number,
        dto: UpdateTourDepartureDto,
    ) {
        await this.ensureTourExists(tourId);

        const entity = await this.tourDepartureRepository.findOne({
            where: {
                id: departureId,
                tourId,
            },
            relations: {
                options: true,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour departure not found');
        }

        if (dto.code && dto.code !== entity.code) {
            await this.validateCodeUnique(tourId, dto.code, departureId);
        }

        const nextDepartureDate = dto.departureDate
            ? new Date(dto.departureDate)
            : entity.departureDate;

        const nextReturnDate = dto.returnDate
            ? new Date(dto.returnDate)
            : entity.returnDate;

        const nextRegistrationDeadline =
            dto.registrationDeadline !== undefined
                ? dto.registrationDeadline
                    ? new Date(dto.registrationDeadline)
                    : undefined
                : entity.registrationDeadline;

        this.validateDateLogic({
            departureDate: nextDepartureDate.toISOString(),
            returnDate: nextReturnDate.toISOString(),
            registrationDeadline: nextRegistrationDeadline
                ? nextRegistrationDeadline.toISOString()
                : undefined,
        });

        if (
            dto.capacity !== undefined &&
            Number(dto.capacity) < Number(entity.bookedSlots)
        ) {
            throw new BadRequestException(
                'Capacity cannot be less than booked slots',
            );
        }

        Object.assign(entity, {
            ...dto,
            departureDate: nextDepartureDate,
            returnDate: nextReturnDate,
            registrationDeadline: nextRegistrationDeadline,
            basePriceAdjustment:
                dto.basePriceAdjustment !== undefined
                    ? String(dto.basePriceAdjustment)
                    : entity.basePriceAdjustment,
        });

        const updated = await this.tourDepartureRepository.save(entity);
        return this.getById(tourId, updated.id);
    }

    async remove(tourId: number, departureId: number) {
        await this.ensureTourExists(tourId);

        const entity = await this.tourDepartureRepository.findOne({
            where: {
                id: departureId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour departure not found');
        }

        if (entity.bookedSlots > 0) {
            throw new BadRequestException(
                'Cannot delete departure that already has bookings',
            );
        }

        await this.tourDepartureRepository.remove(entity);

        return {
            message: 'Tour departure deleted successfully',
        };
    }

    async open(tourId: number, departureId: number) {
        const entity = await this.tourDepartureRepository.findOne({
            where: {
                id: departureId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour departure not found');
        }

        if (entity.capacity <= 0) {
            throw new BadRequestException('Capacity must be greater than 0');
        }

        if (entity.returnDate <= entity.departureDate) {
            throw new BadRequestException(
                'Return date must be greater than departure date',
            );
        }

        if (
            entity.registrationDeadline &&
            entity.registrationDeadline > entity.departureDate
        ) {
            throw new BadRequestException(
                'Registration deadline must be less than or equal to departure date',
            );
        }

        if (entity.bookedSlots >= entity.capacity) {
            entity.status = TourDepartureStatus.FULL;
        } else {
            entity.status = TourDepartureStatus.OPEN;
        }

        await this.tourDepartureRepository.save(entity);
        return this.getById(tourId, departureId);
    }

    async close(tourId: number, departureId: number) {
        const entity = await this.tourDepartureRepository.findOne({
            where: {
                id: departureId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour departure not found');
        }

        entity.status = TourDepartureStatus.CLOSED;
        await this.tourDepartureRepository.save(entity);

        return this.getById(tourId, departureId);
    }

    async cancel(tourId: number, departureId: number) {
        const entity = await this.tourDepartureRepository.findOne({
            where: {
                id: departureId,
                tourId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Tour departure not found');
        }

        entity.status = TourDepartureStatus.CANCELLED;
        await this.tourDepartureRepository.save(entity);

        return this.getById(tourId, departureId);
    }

    private async ensureTourExists(tourId: number) {
        const existed = await this.tourRepository.findOne({
            where: { id: tourId },
            select: ['id'],
        });

        if (!existed) {
            throw new NotFoundException('Tour not found');
        }
    }

    private async validateCodeUnique(
        tourId: number,
        code: string,
        excludeId?: number,
    ) {
        const existed = await this.tourDepartureRepository.findOne({
            where: {
                tourId,
                code,
            },
            select: ['id', 'code'],
        });

        if (existed && existed.id !== excludeId) {
            throw new BadRequestException(
                'Departure code already exists in this tour',
            );
        }
    }

    private validateDateLogic(input: {
        departureDate: string;
        returnDate: string;
        registrationDeadline?: string;
    }) {
        const departureDate = new Date(input.departureDate);
        const returnDate = new Date(input.returnDate);

        if (returnDate <= departureDate) {
            throw new BadRequestException(
                'Return date must be greater than departure date',
            );
        }

        if (input.registrationDeadline) {
            const registrationDeadline = new Date(input.registrationDeadline);

            if (registrationDeadline > departureDate) {
                throw new BadRequestException(
                    'Registration deadline must be less than or equal to departure date',
                );
            }
        }
    }

    private mapDepartureOutput(entity: TourDeparture) {
        return {
            ...entity,
            availableSlots: Math.max(0, entity.capacity - entity.bookedSlots),
        };
    }
}
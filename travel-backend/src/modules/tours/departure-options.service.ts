import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourDeparture } from './entities/tour-departure.entity';
import { DepartureOption } from './entities/departure-option.entity';
import { CreateDepartureOptionDto } from './dto/create-departure-option.dto';
import { UpdateDepartureOptionDto } from './dto/update-departure-option.dto';
import { DepartureOptionStatus } from './tour.enums';

@Injectable()
export class DepartureOptionsService {
    constructor(
        @InjectRepository(TourDeparture)
        private readonly tourDepartureRepository: Repository<TourDeparture>,

        @InjectRepository(DepartureOption)
        private readonly departureOptionRepository: Repository<DepartureOption>,
    ) { }

    async getByDepartureId(departureId: number) {
        await this.ensureDepartureExists(departureId);

        const items = await this.departureOptionRepository.find({
            where: { departureId },
            order: {
                id: 'ASC',
            },
        });

        return items;
    }

    async getById(departureId: number, optionId: number) {
        await this.ensureDepartureExists(departureId);

        const entity = await this.departureOptionRepository.findOne({
            where: {
                id: optionId,
                departureId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Departure option not found');
        }

        return entity;
    }

    async create(departureId: number, dto: CreateDepartureOptionDto) {
        await this.ensureDepartureExists(departureId);
        this.validateTimeLogic(dto);

        const entity = this.departureOptionRepository.create({
            ...dto,
            departureId,
            extraPrice: String(dto.extraPrice ?? 0),
            startTime: dto.startTime ? new Date(dto.startTime) : undefined,
            endTime: dto.endTime ? new Date(dto.endTime) : undefined,
            status: dto.status ?? DepartureOptionStatus.ACTIVE,
        });

        const created = await this.departureOptionRepository.save(entity);
        return this.getById(departureId, created.id);
    }

    async update(
        departureId: number,
        optionId: number,
        dto: UpdateDepartureOptionDto,
    ) {
        await this.ensureDepartureExists(departureId);

        const entity = await this.departureOptionRepository.findOne({
            where: {
                id: optionId,
                departureId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Departure option not found');
        }

        const nextStartTime =
            dto.startTime !== undefined
                ? dto.startTime
                    ? new Date(dto.startTime)
                    : undefined
                : entity.startTime;

        const nextEndTime =
            dto.endTime !== undefined
                ? dto.endTime
                    ? new Date(dto.endTime)
                    : undefined
                : entity.endTime;

        this.validateTimeLogic({
            startTime: nextStartTime ? nextStartTime.toISOString() : undefined,
            endTime: nextEndTime ? nextEndTime.toISOString() : undefined,
        });

        Object.assign(entity, {
            ...dto,
            extraPrice:
                dto.extraPrice !== undefined ? String(dto.extraPrice) : entity.extraPrice,
            startTime: nextStartTime,
            endTime: nextEndTime,
        });

        await this.departureOptionRepository.save(entity);
        return this.getById(departureId, optionId);
    }

    async remove(departureId: number, optionId: number) {
        await this.ensureDepartureExists(departureId);

        const entity = await this.departureOptionRepository.findOne({
            where: {
                id: optionId,
                departureId,
            },
        });

        if (!entity) {
            throw new NotFoundException('Departure option not found');
        }

        await this.departureOptionRepository.remove(entity);

        return {
            message: 'Departure option deleted successfully',
        };
    }

    private async ensureDepartureExists(departureId: number) {
        const existed = await this.tourDepartureRepository.findOne({
            where: { id: departureId },
            select: ['id'],
        });

        if (!existed) {
            throw new NotFoundException('Tour departure not found');
        }
    }

    private validateTimeLogic(input: {
        startTime?: string;
        endTime?: string;
    }) {
        if (input.startTime && input.endTime) {
            const startTime = new Date(input.startTime);
            const endTime = new Date(input.endTime);

            if (endTime < startTime) {
                throw new BadRequestException(
                    'End time must be greater than or equal to start time',
                );
            }
        }
    }
}
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaginationDto } from './pagination.dto';
import { PaginatedResponse } from './paginated-response.interface';

export abstract class BaseCrudService<TEntity extends { id: string | number }> {
    protected constructor(
        protected readonly repository: Repository<TEntity>,
        protected readonly entityName = 'Record',
    ) { }

    async create(payload: DeepPartial<TEntity>): Promise<TEntity> {
        const entity = this.repository.create(payload);
        return this.repository.save(entity);
    }

    async findAll(options?: FindManyOptions<TEntity>): Promise<TEntity[]> {
        return this.repository.find(options);
    }

    async findOne(
        where: FindOptionsWhere<TEntity>,
        options?: Omit<FindManyOptions<TEntity>, 'where'>,
    ): Promise<TEntity> {
        const entity = await this.repository.findOne({
            where,
            ...(options || {}),
        });

        if (!entity) {
            throw new NotFoundException(`${this.entityName} không tồn tại`);
        }

        return entity;
    }

    async update(
        where: FindOptionsWhere<TEntity>,
        payload: DeepPartial<TEntity>,
    ): Promise<TEntity> {
        const entity = await this.findOne(where);
        const merged = this.repository.merge(entity, payload);
        return this.repository.save(merged);
    }

    async remove(where: FindOptionsWhere<TEntity>): Promise<void> {
        const entity = await this.findOne(where);
        await this.repository.softRemove(entity);
    }

    async hardRemove(where: FindOptionsWhere<TEntity>): Promise<void> {
        const entity = await this.findOne(where);
        await this.repository.remove(entity);
    }

    async getPaging(
        pagination: PaginationDto,
        options?: Omit<FindManyOptions<TEntity>, 'skip' | 'take'>,
    ): Promise<PaginatedResponse<TEntity>> {
        const page = pagination.page || 1;
        const limit = pagination.limit || 10;
        const skip = (page - 1) * limit;

        const [data, total] = await this.repository.findAndCount({
            ...(options || {}),
            skip,
            take: limit,
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
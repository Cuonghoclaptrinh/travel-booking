import { Test, TestingModule } from '@nestjs/testing';
import { HotelImagesService } from './hotel-images.service';

describe('HotelImagesService', () => {
  let service: HotelImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelImagesService],
    }).compile();

    service = module.get<HotelImagesService>(HotelImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HotelImagesController } from './hotel-images.controller';
import { HotelImagesService } from './hotel-images.service';

describe('HotelImagesController', () => {
  let controller: HotelImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelImagesController],
      providers: [HotelImagesService],
    }).compile();

    controller = module.get<HotelImagesController>(HotelImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

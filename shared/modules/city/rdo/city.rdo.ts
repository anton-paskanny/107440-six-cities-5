import { Expose } from 'class-transformer';

export class CityRdo {
  @Expose({ name: '_id' })
  public id: string;

  @Expose()
  public name: string;

  @Expose()
  public latitude: number;

  @Expose()
  public longitude: number;
}

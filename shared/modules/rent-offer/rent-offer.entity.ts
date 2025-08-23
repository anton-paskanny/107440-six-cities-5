import {
  defaultClasses,
  getModelForClass,
  modelOptions,
  prop,
  Ref,
  index
} from '@typegoose/typegoose';
import { HouseType, FeatureType } from '../../types/index.js';
import { UserEntity } from '../user/index.js';
import { CityEntity } from '../city/index.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface RentOfferEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'rentOffers'
  }
})
// Add indexes at class level
@index({ cityId: 1, createdAt: -1 })
@index({ cityId: 1, isPremium: 1, createdAt: -1 })
@index({ createdAt: -1 })
@index({ commentCount: -1 })
@index({ userId: 1 })
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class RentOfferEntity extends defaultClasses.TimeStamps {
  @prop({ trim: true, required: true })
  public title!: string;

  @prop({ trim: true })
  public description!: string;

  @prop()
  public publishDate!: Date;

  @prop({
    ref: CityEntity,
    required: true
  })
  public cityId!: Ref<CityEntity>;

  @prop()
  public preview!: string;

  @prop()
  public images!: string[];

  @prop()
  public isPremium!: boolean;

  @prop({ default: false })
  public isFavorite?: boolean;

  @prop()
  public rating!: number;

  @prop({
    type: () => String,
    enum: HouseType
  })
  public houseType!: HouseType;

  @prop()
  public rooms!: number;

  @prop()
  public guests!: number;

  @prop()
  public price!: number;

  @prop({
    type: () => String,
    enum: FeatureType
  })
  public features!: FeatureType[];

  @prop({
    ref: UserEntity,
    required: true
  })
  public userId!: Ref<UserEntity>;

  @prop({ default: 0 })
  public commentCount!: number;

  @prop({ required: true })
  public latitude!: number;

  @prop({ required: true })
  public longitude!: number;
}

export const RentOfferModel = getModelForClass(RentOfferEntity);

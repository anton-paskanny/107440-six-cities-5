import {
  defaultClasses,
  getModelForClass,
  prop,
  modelOptions,
  Ref,
  index
} from '@typegoose/typegoose';
import { UserEntity } from '../user/user.entity.js';
import { RentOfferEntity } from '../rent-offer/index.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface FavoriteEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'favorites',
    timestamps: true
  }
})
@index({ userId: 1 })
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class FavoriteEntity extends defaultClasses.TimeStamps {
  @prop({
    ref: UserEntity,
    required: true
  })
  public userId: Ref<UserEntity>;

  @prop({
    ref: 'RentOfferEntity',
    required: true,
    default: []
  })
  public favorites: Ref<RentOfferEntity>[];
}

export const FavoriteModel = getModelForClass(FavoriteEntity);

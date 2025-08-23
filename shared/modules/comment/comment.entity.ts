import {
  defaultClasses,
  getModelForClass,
  modelOptions,
  prop,
  Ref,
  index
} from '@typegoose/typegoose';
import { RentOfferEntity } from '../rent-offer/index.js';
import { UserEntity } from '../user/index.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface CommentEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'comments'
  }
})
@index({ rentOfferId: 1, createdAt: -1 })
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class CommentEntity extends defaultClasses.TimeStamps {
  @prop({
    trim: true,
    required: true
  })
  public text: string;

  @prop({ min: 1, max: 5, default: 0 })
  public rating: number;

  @prop({
    ref: RentOfferEntity,
    required: true
  })
  public rentOfferId: Ref<RentOfferEntity>;

  @prop({
    ref: UserEntity,
    required: true
  })
  public userId: Ref<UserEntity>;
}

export const CommentModel = getModelForClass(CommentEntity);

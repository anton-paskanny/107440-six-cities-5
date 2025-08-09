import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  BaseController,
  DocumentExistsMiddleware,
  HttpError,
  HttpMethod,
  PrivateRouteMiddleware,
  ValidateObjectIdMiddleware
} from '../../libs/rest/index.js';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { FavoriteService, FavoriteRdo, ParamFavoriteReq } from './index.js';
import { RentOfferService } from '../rent-offer/rent-offer.service.interface.js';
import { fillDTO } from '../../helpers/index.js';

@injectable()
export default class FavoriteController extends BaseController {
  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    @inject(Component.FavoriteService)
    private readonly favoriteService: FavoriteService,
    @inject(Component.RentOfferService)
    private readonly rentOfferService: RentOfferService
  ) {
    super(logger);

    this.logger.info('Register routes for FavoriteController…');

    // GET /favorites — list favorites for the authenticated user
    this.addRoute({
      path: '/',
      method: HttpMethod.Get,
      handler: this.getFavorite,
      middlewares: [new PrivateRouteMiddleware()]
    });

    // PUT /favorites/:rentOfferId — add an offer to favorites
    this.addRoute({
      path: '/:rentOfferId',
      method: HttpMethod.Put,
      handler: this.addFavorite,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateObjectIdMiddleware('rentOfferId'),
        new DocumentExistsMiddleware(
          this.rentOfferService,
          'RentOffer',
          'rentOfferId'
        )
      ]
    });

    // DELETE /favorites/:rentOfferId — remove an offer from favorites
    this.addRoute({
      path: '/:rentOfferId',
      method: HttpMethod.Delete,
      handler: this.removeFavorite,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateObjectIdMiddleware('rentOfferId'),
        new DocumentExistsMiddleware(
          this.rentOfferService,
          'RentOffer',
          'rentOfferId'
        )
      ]
    });
  }

  public async getFavorite(
    { tokenPayload }: Request,
    res: Response
  ): Promise<void> {
    const { id } = tokenPayload || {};

    const result = await this.favoriteService.findByUserId(id);
    const filledData = fillDTO(FavoriteRdo, result);
    filledData?.favorites?.forEach((item) => (item.isFavorite = true));
    this.ok(res, filledData);
  }

  public async addFavorite(
    { params, tokenPayload }: Request<ParamFavoriteReq>,
    res: Response
  ): Promise<void> {
    const { id } = tokenPayload || {};

    const duplicate = await this.favoriteService.findFavoriteById({
      userId: id,
      rentOfferId: params.rentOfferId
    });

    if (duplicate) {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        `Rent Offer with id ${params.rentOfferId} is already added into favorite list.`,
        'FavoriteController'
      );
    }

    const result = await this.favoriteService.addToFavorite({
      userId: id,
      rentOfferId: params.rentOfferId
    });

    const filledData = fillDTO(FavoriteRdo, result);
    filledData?.favorites?.forEach((item) => (item.isFavorite = true));
    this.ok(res, filledData);
  }

  public async removeFavorite(
    { params, tokenPayload }: Request<ParamFavoriteReq>,
    res: Response
  ): Promise<void> {
    const { id } = tokenPayload || {};

    const favoriteObj = await this.favoriteService.findFavoriteById({
      userId: id,
      rentOfferId: params.rentOfferId
    });

    if (!favoriteObj) {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        `Rent Offer with id ${params.rentOfferId} does not exist in favorite list.`,
        'FavoriteController'
      );
    }

    const result = await this.favoriteService.removeFromFavorite({
      userId: id,
      rentOfferId: params.rentOfferId
    });

    const filledData = fillDTO(FavoriteRdo, result);
    filledData?.favorites?.forEach((item) => (item.isFavorite = true));
    this.ok(res, filledData);
  }
}

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DocumentType } from '@typegoose/typegoose';
import {
  BaseController,
  DocumentExistsMiddleware,
  HttpError,
  HttpMethod,
  PrivateRouteMiddleware,
  UploadFileMiddleware,
  UploadMutlipleFilesMiddleware,
  ValidateDtoMiddleware,
  ValidateObjectIdMiddleware
} from '../../libs/rest/index.js';
import { inject, injectable } from 'inversify';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { fillDTO } from '../../helpers/index.js';
import {
  RentOfferRdo,
  DetailedRentOfferRdo,
  RentOfferEntity
} from './index.js';
import { CommentRdo, CommentService } from '../comment/index.js';
import { RentOfferService } from './rent-offer.service.interface.js';
import { ParamRentOfferId } from './types/param-rentOfferId.type.js';
import { CreateRentOfferRequest } from './types/create-rent-offer-request.type.js';
import { UpdateRentOfferRequest } from './types/update-rent-offer-request.type.js';
import {
  DEFAULT_DISCUSSED_OFFER_COUNT,
  DEFAULT_NEW_OFFER_COUNT,
  MAX_OFFER_IMAGES
} from './rent-offer.constants.js';
import { CreateRentOfferDto, UpdateRentOfferDto } from './index.js';
import { FavoriteEntity, FavoriteService } from '../favorite/index.js';
import { GetRentOffers } from './types/get-rent-offers-request.type.js';
import { SortOption } from '../../libs/rest/index.js';
import { Config, RestSchema } from '../../libs/config/index.js';
import { UploadPreviewRdo } from './rdo/upload-preview.rdo.js';
import { UploadImagesRdo } from './rdo/upload-images.rdo.js';

@injectable()
export default class RentOfferController extends BaseController {
  constructor(
    @inject(Component.Logger) protected logger: Logger,
    @inject(Component.RentOfferService)
    private readonly rentOfferService: RentOfferService,
    @inject(Component.CommentService)
    private readonly commentService: CommentService,
    @inject(Component.FavoriteService)
    private readonly favoriteService: FavoriteService,
    @inject(Component.Config) private readonly configService: Config<RestSchema>
  ) {
    super(logger);

    this.logger.info('Register routes for RentOfferController');
    this.addRoute({
      path: '/:rentOfferId',
      method: HttpMethod.Get,
      handler: this.show,
      middlewares: [
        new ValidateObjectIdMiddleware('rentOfferId'),
        new DocumentExistsMiddleware(
          this.rentOfferService,
          'RentOffer',
          'rentOfferId'
        )
      ]
    });
    this.addRoute({ path: '/', method: HttpMethod.Get, handler: this.index });
    this.addRoute({
      path: '/',
      method: HttpMethod.Post,
      handler: this.create,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateDtoMiddleware(CreateRentOfferDto)
      ]
    });
    this.addRoute({
      path: '/:rentOfferId',
      method: HttpMethod.Delete,
      handler: this.delete,
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
    this.addRoute({
      path: '/:rentOfferId',
      method: HttpMethod.Patch,
      handler: this.update,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateObjectIdMiddleware('rentOfferId'),
        new ValidateDtoMiddleware(UpdateRentOfferDto),
        new DocumentExistsMiddleware(
          this.rentOfferService,
          'RentOffer',
          'rentOfferId'
        )
      ]
    });
    this.addRoute({
      path: '/:rentOfferId/comments',
      method: HttpMethod.Get,
      handler: this.getComments,
      middlewares: [
        new ValidateObjectIdMiddleware('rentOfferId'),
        new DocumentExistsMiddleware(
          this.rentOfferService,
          'RentOffer',
          'rentOfferId'
        )
      ]
    });
    this.addRoute({
      path: '/:rentOfferId/preview',
      method: HttpMethod.Post,
      handler: this.uploadPreview,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateObjectIdMiddleware('rentOfferId'),
        new UploadFileMiddleware(
          this.configService.get('UPLOAD_DIRECTORY'),
          'preview'
        ),
        new DocumentExistsMiddleware(
          this.rentOfferService,
          'RentOffer',
          'rentOfferId'
        )
      ]
    });
    this.addRoute({
      path: '/:rentOfferId/images',
      method: HttpMethod.Post,
      handler: this.uploadGalleryImages,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateObjectIdMiddleware('rentOfferId'),
        new UploadMutlipleFilesMiddleware(
          this.configService.get('UPLOAD_DIRECTORY'),
          'galleryImages',
          MAX_OFFER_IMAGES
        ),
        new DocumentExistsMiddleware(
          this.rentOfferService,
          'RentOffer',
          'rentOfferId'
        )
      ]
    });
  }

  public async index({ tokenPayload, query }: GetRentOffers, resp: Response) {
    const { id } = tokenPayload || {};
    const { limit, sort = SortOption.Default } = query;

    let rentOffers: DocumentType<RentOfferEntity>[];

    // Handle different sorting options
    switch (sort) {
      case SortOption.New:
        rentOffers = await this.rentOfferService.findNew(
          limit || DEFAULT_NEW_OFFER_COUNT
        );
        break;
      case SortOption.Discussed:
        rentOffers = await this.rentOfferService.findDiscussed(
          limit || DEFAULT_DISCUSSED_OFFER_COUNT
        );
        break;
      default:
        rentOffers = await this.rentOfferService.find(limit);
        break;
    }

    let favoritesObj: DocumentType<FavoriteEntity> | null;

    if (id) {
      favoritesObj = await this.favoriteService.findByUserId(id);
    }

    rentOffers.forEach((offer) => {
      offer.isFavorite =
        favoritesObj?.favorites?.some((favOffer) => favOffer.id === offer.id) ||
        false;
    });

    this.ok(resp, fillDTO(RentOfferRdo, rentOffers));
  }

  public async show(
    { params, tokenPayload }: Request<ParamRentOfferId>,
    res: Response
  ): Promise<void> {
    const { rentOfferId } = params;
    const { id } = tokenPayload || {};

    const offer = await this.rentOfferService.findById(rentOfferId);

    let isFavorite = false;

    if (id) {
      isFavorite = await this.favoriteService.isFavorite({
        userId: id,
        rentOfferId
      });
    }

    offer!.isFavorite = isFavorite;

    this.ok(res, fillDTO(DetailedRentOfferRdo, offer));
  }

  public async create(
    { body, tokenPayload }: CreateRentOfferRequest,
    res: Response
  ): Promise<void> {
    const result = await this.rentOfferService.create({
      ...body,
      userId: tokenPayload.id
    });
    const offer = await this.rentOfferService.findById(result.id);
    this.created(res, fillDTO(RentOfferRdo, offer));
  }

  public async delete(
    { params, tokenPayload }: Request<ParamRentOfferId>,
    res: Response
  ) {
    const { id } = tokenPayload || {};
    const { rentOfferId } = params;

    await this.checkUserIdMatchOfferId(id, rentOfferId);

    const removedOffer = await this.rentOfferService.deleteById(rentOfferId);

    await this.commentService.deleteByRentOfferId(rentOfferId);

    this.noContent(res, removedOffer);
  }

  public async update(
    { body, params, tokenPayload }: UpdateRentOfferRequest,
    res: Response
  ) {
    const { id } = tokenPayload || {};
    const { rentOfferId } = params;

    await this.checkUserIdMatchOfferId(id, rentOfferId);

    const updatedOffer = await this.rentOfferService.updateById(
      params.rentOfferId,
      body
    );

    let isFavorite = false;

    if (id) {
      isFavorite = await this.favoriteService.isFavorite({
        userId: id,
        rentOfferId
      });
    }

    updatedOffer!.isFavorite = isFavorite;

    this.ok(res, fillDTO(DetailedRentOfferRdo, updatedOffer));
  }

  public async getComments(
    { params }: Request<ParamRentOfferId>,
    res: Response
  ): Promise<void> {
    const comments = await this.commentService.findByRentOfferId(
      params.rentOfferId
    );
    this.ok(res, fillDTO(CommentRdo, comments));
  }

  public async uploadPreview(
    { params, file, tokenPayload }: Request<ParamRentOfferId>,
    res: Response
  ) {
    const { id } = tokenPayload || {};
    const { rentOfferId } = params;

    await this.checkUserIdMatchOfferId(id, rentOfferId);

    const updateDto = { preview: file?.filename };
    await this.rentOfferService.updateById(rentOfferId, updateDto);
    this.created(res, fillDTO(UploadPreviewRdo, updateDto));
  }

  public async uploadGalleryImages(
    { files, params, tokenPayload }: Request<ParamRentOfferId>,
    res: Response
  ) {
    const { id } = tokenPayload || {};
    const { rentOfferId } = params;

    await this.checkUserIdMatchOfferId(id, rentOfferId);

    if (!Array.isArray(files)) {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        'Invalid input data for rent offer files',
        'DefaultRentOfferController'
      );
    }

    const imageFilenames: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        imageFilenames.push(file.filename);
      }

      const updateDto = { images: imageFilenames };
      await this.rentOfferService.updateById(rentOfferId, updateDto);

      this.created(res, fillDTO(UploadImagesRdo, updateDto));
    } else {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        'No images were found to upload',
        'DefaultRentOfferController'
      );
    }
  }

  public async checkUserIdMatchOfferId(
    userId: string,
    rentOfferId: string
  ): Promise<void> {
    const offer = await this.rentOfferService.findById(rentOfferId);

    if (offer?.userId.toString() !== userId) {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        'Attemt to modify wrong rent offer',
        'DefaultRentOfferController'
      );
    }
  }
}

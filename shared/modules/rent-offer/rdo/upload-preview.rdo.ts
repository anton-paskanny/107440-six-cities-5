import { Expose } from 'class-transformer';

export class UploadPreviewRdo {
  @Expose()
  public preview: string;
}

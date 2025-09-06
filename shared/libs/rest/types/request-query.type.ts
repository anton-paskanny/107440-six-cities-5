import { SortOption } from './sort-option.enum.js';

export type RequestQuery = {
  limit?: number;
  sort?: SortOption;
};

import { InferSelectModel } from 'drizzle-orm';
import {
  customers,
  folders,
  prices,
  products,
  subscriptions,
  users,
  workspaces,
} from '../../../migrations/schema';
import { files } from './schema';

export type workspace = InferSelectModel<typeof workspaces>;
export type User = InferSelectModel<typeof users>;
export type Folder = InferSelectModel<typeof folders>;
export type File = InferSelectModel<typeof files>;
export type Product = InferSelectModel<typeof products>;
export type Price = InferSelectModel<typeof prices> & { products?: Product[] };
export type Customer = InferSelectModel<typeof customers>;
export type Subscription = InferSelectModel<typeof subscriptions> & {
  prices: Price;
};

export type ProductWithPrice = Product & {
  prices?: Price[];
};

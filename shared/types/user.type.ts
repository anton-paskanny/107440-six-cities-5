export enum UserType {
  Regular = 'regular',
  Pro = 'pro'
}

export type User = {
  firstName: string;
  lastName: string;
  email: string;
  avatarPath: string;
  type: UserType;
};

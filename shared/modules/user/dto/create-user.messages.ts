export const CreateUserMessages = {
  email: {
    invalidFormat: 'email must be a valid address'
  },
  firstname: {
    invalidFormat: 'firstname is required',
    lengthField: 'min length is 1, max is 15'
  },
  lastname: {
    invalidFormat: 'lastname is required',
    lengthField: 'min length is 1, max is 15'
  },
  password: {
    invalidFormat: 'password is required',
    lengthField: 'min length for password is 6, max is 12'
  },
  type: {
    invalid: 'Type must be Pro or Regular'
  }
} as const;

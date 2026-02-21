import { User } from "../../generated/prisma/client";

export type RegisterUserRequest = {
  username: string;
  password: string;
  fullname: string;
};

export type UserResponse = {
  username: string;
  fullname: string;
};

export function toUserResponse(user: User): UserResponse {
  return {
    username: user.username,
    fullname: user.fullname,
  };
}

import { IsNotEmpty, MinLength } from "class-validator";

export class ResetPasswordDto {
    @MinLength(6)
    @IsNotEmpty()
    newPassword!: string
}
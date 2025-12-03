
import { IsNotEmpty,IsEmail } from "class-validator";

export class ForgotPassowrdDto {
    
    @IsNotEmpty()
    @IsEmail()
    email!: string
}

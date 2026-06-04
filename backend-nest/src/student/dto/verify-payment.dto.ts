import { IsString, MaxLength } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @MaxLength(100)
  razorpay_order_id: string;

  @IsString()
  @MaxLength(100)
  razorpay_payment_id: string;

  @IsString()
  @MaxLength(200)
  razorpay_signature: string;
}

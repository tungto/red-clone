import { getModelForClass, prop } from '@typegoose/typegoose';
import { ObjectId } from 'mongoose';

export class Token {
	_id!: ObjectId;

	@prop({ required: true })
	public userId!: number;

	@prop({ required: true })
	public token!: string;

	@prop({ default: Date.now, expires: 60 * 1 })
	public createdAt!: Date;
}

export const TokenModel = getModelForClass(Token);

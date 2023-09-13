import { DataSource } from 'typeorm';
import { configDotenv } from 'dotenv';
import { __prod__ } from 'src/constants';

configDotenv();

export const AppDataSource = new DataSource({
	type: 'postgres',
	database: __prod__ ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV,
	host: __prod__ ? process.env.DB_HOST_PROD : process.env.DB_HOST_DEV,
	port: 5432,
	username: __prod__
		? process.env.DB_USERNAME_PROD
		: process.env.DB_USERNAME_DEV,
	password: __prod__
		? process.env.DB_PASSWORD_PROD
		: process.env.DB_PASSWORD_DEV,
	logging: true,
	entities: ['dist/entities/*.js'],
	migrations: ['dist/migrations/*.js'],
});

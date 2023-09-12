import { DataSource } from 'typeorm';
import { configDotenv } from 'dotenv';

configDotenv();

export const AppDataSource = new DataSource({
	type: 'postgres',
	database: 'reddit-for-migrations',
	port: 5432,
	username: process.env.DB_USERNAME_DEV,
	password: process.env.DB_PASSWORD_DEV,
	logging: true,
	entities: ['dist/entities/*.js'],
	migrations: ['dist/migrations/*.js'],
});

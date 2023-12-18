require('source-map-support').install();

import MongoStore from 'connect-mongo';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import morgan from 'morgan';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { DataSource } from 'typeorm';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import { Upvote } from './entities/Upvote';
import { User } from './entities/User';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { Context } from './types/Context';
import { buildDataLoaders } from './utils/dataLoaders';
import path from 'path';
import { ApolloServer } from '@apollo/server';
import pkg from 'body-parser';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import {
	ApolloServerPluginLandingPageLocalDefault,
	ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';

const { json } = pkg;

configDotenv();

const appDataSource = new DataSource({
	type: 'postgres',
	...(__prod__
		? {
				url: process.env.DB_URL_PROD,
				database: process.env.DB_NAME_PROD,
				username: process.env.DB_USERNAME_PROD,
				password: process.env.DB_PASSWORD_PROD,
		  }
		: {
				database: process.env.DB_NAME_DEV,
				username: process.env.DB_USERNAME_DEV,
				password: process.env.DB_PASSWORD_DEV,
		  }),
	logging: true,
	...(__prod__
		? {
				extra: {
					ssl: { rejectUnauthorized: false },
				},
				ssl: true,
		  }
		: {}),
	...(__prod__ ? {} : { synchronize: true }),
	entities: [User, Post, Upvote],
	migrations: [path.join(__dirname, '/migrations/*')],
});

const main = async () => {
	console.time('main');
	const dataSource = await appDataSource.initialize();

	if (__prod__) {
		console.log('RUN MIGRATIONS!!!');
		await dataSource.runMigrations();
	}

	const app = express();
	const httpServer = http.createServer(app);

	//cors
	app.use(
		cors({
			origin: __prod__
				? [
						process.env.CORS_ORIGIN_PROD!,
						'https://studio.apollographql.com',
				  ]
				: process.env.CORS_ORIGIN_DEV,
			credentials: true,
		})
	);

	// logging
	app.use(morgan('dev'));

	// parse request
	app.use(express.json());

	// * Better if separate DEV and PROD, use only one here for convenience
	const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_MONGO_USERNAME}:${process.env.SESSION_DB_MONGO_PASSWORD}@cluster0.vh93vvy.mongodb.net/?retryWrites=true&w=majority`;

	//connect mongoose
	await mongoose.connect(mongoUrl!);

	console.log('MongoDB Connected!');

	app.set('trust proxy', 1);

	app.use(
		session({
			name: COOKIE_NAME,
			store: MongoStore.create({ mongoUrl }),
			cookie: {
				// maxAge: 1000 * 60 * 60, // one hour
				maxAge: 1000 * 60 * 60, // 1 h
				httpOnly: true, // JS front end cannot access the cookie
				sameSite: __prod__ ? 'none' : 'lax', // todo check about this, why false not working
				secure: __prod__,
			},
			secret: process.env.SESSION_COOKIE_SECRET as string,
			saveUninitialized: false, // don't save empty sessions, right from the start
			resave: false,
		})
	);

	// apollo server
	const apolloServer = new ApolloServer<Context>({
		schema: await buildSchema({
			resolvers: [UserResolver, HelloResolver, PostResolver],
			validate: false,
		}),
		persistedQueries: false,

		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			process.env.NODE_ENV === 'production'
				? ApolloServerPluginLandingPageProductionDefault({
						graphRef: 'my-graph-id@my-graph-variant',
						footer: false,
				  })
				: ApolloServerPluginLandingPageLocalDefault({ footer: false }),
		],
	});

	await apolloServer.start();

	app.use(
		'/graphql',
		cors<cors.CorsRequest>({
			origin: [
				process.env.CORS_ORIGIN_PROD!,
				process.env.CORS_ORIGIN_DEV!,
				process.env.CORS_ORIGIN_APOLLO!,
			],
		}),
		json(),
		expressMiddleware(apolloServer, {
			context: async ({ req, res }) => ({
				req,
				res,
				connection: dataSource,
				dataLoaders: buildDataLoaders(),
			}),
		})
	);
	app.use('/', (_req, res) => {
		res.send('Hello from red clone');
	});

	// error handlers
	app.use('*', (_req, _res, next) => {
		next(new Error('Not Found!'));
	});

	// start server
	const PORT = process.env.PORT || 4000;

	const APP_URL = __prod__
		? `${process.env.APP_PROD_URL}/graphql`
		: `${process.env.APP_DEV_URL}/graphql`;

	app.listen(PORT, () => {
		console.log(
			`🫡 SERVER STARTED ON PORT: ${PORT}, GRAPHQL SERVER STARTED ON ${APP_URL} 👏`
		);
	});
};

main().catch((err) => {
	console.error('ERROR: 🎃', err);
	process.exit(1);
});

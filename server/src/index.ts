require('source-map-support').install();

import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
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

configDotenv();

console.log('================================================___PROD____');
console.log(__prod__);
console.log({
	type: 'postgres',
	...(__prod__
		? {
				url: process.env.DB_URL_PROD,
				database: process.env.DB_NAME,
				username: process.env.DB_USERNAME_PROD,
				password: process.env.DB_PASSWORD_PROD,
		  }
		: {
				database: 'reddit',
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
				database: 'reddit',
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
		await dataSource.runMigrations();
	}

	const app = express();

	//cors
	app.use(
		cors({
			origin: __prod__
				? process.env.CORS_ORIGIN_PROD
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

	app.use(
		session({
			name: COOKIE_NAME,
			store: MongoStore.create({ mongoUrl }),
			cookie: {
				// maxAge: 1000 * 60 * 60, // one hour
				maxAge: 1000 * 60 * 60, // 1 h
				httpOnly: true, // JS front end cannot access the cookie
				sameSite: 'lax', // todo check about this, why false not working
				secure: __prod__,
				domain: __prod__ ? '.vercel.app' : undefined,
			},
			secret: process.env.SESSION_COOKIE_SECRET as string,
			saveUninitialized: false, // don't save empty sessions, right from the start
			resave: false,
		})
	);

	// apollo server
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [UserResolver, HelloResolver, PostResolver],
			validate: false,
		}),
		persistedQueries: false,
		context: ({ req, res }): Context => ({
			req,
			res,
			connection: dataSource,
			dataLoaders: buildDataLoaders(),
		}),
		plugins: [
			ApolloServerPluginLandingPageGraphQLPlayground({
				settings: {
					'request.credentials': 'include',
				},
			}),
		],
	});

	await apolloServer.start();
	apolloServer.applyMiddleware({ app, cors: false });

	// error handlers
	app.use('*', (_req, _res, next) => {
		next(new Error('Not Found!'));
	});

	// start server
	const port = process.env.PORT || 4000;

	app.listen(port, () => {
		console.log(
			`🫡 ✈️ SERVER STARTED ON PORT: ${port}, GRAPHQL SERVER STARTED ON localhost:${port}${apolloServer.graphqlPath} 👏`
		);
	});
};

main().catch((err) => {
	console.error('ERROR: 🎃', err);
	process.exit(1);
});

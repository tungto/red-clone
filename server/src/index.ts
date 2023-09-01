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
import { DataSource, DataSourceOptions } from 'typeorm';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import { User } from './entities/User';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { Context } from './types/Context';
import { Upvote } from './entities/UpVote';

configDotenv();
const option: DataSourceOptions = {
	type: 'postgres',
	database: 'reddit',
	username: process.env.DB_USERNAME_DEV,
	password: process.env.DB_PASSWORD_DEV,
	logging: true,
	synchronize: true,
	entities: [User, Post, Upvote],
};
const appDataSource = new DataSource(option);

const main = async () => {
	console.time('main');
	const connection = await appDataSource.initialize();

	const app = express();

	//cors
	app.use(
		cors({
			origin: 'http://localhost:3000',
			credentials: true,
		})
	);

	// logging
	app.use(morgan('dev'));

	// parse request
	app.use(express.json());

	const mongoUrl = process.env.SESSION_DB_MONGO_URI?.replace(
		'<password>',
		process.env.SESSION_DB_MONGO_PASSWORD!
	);

	//connect mongoose
	await mongoose.connect(mongoUrl!, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	console.log(
		'COOKIE_NAME',
		COOKIE_NAME,
		__prod__,
		process.env.SESSION_COOKIE_SECRET
	);

	console.log('MongoDB Connected');

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

		context: ({ req, res }): Context => ({
			req,
			res,
			connection,
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

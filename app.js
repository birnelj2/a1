require('dotenv').config();
const express = require('express');
const config = require('./config/config');
const compression = require ('compression');
const helmet = require('helmet');
const https= require("https");
const fs = require('fs');
const http=require("http");




const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
//const MongoStore = require('connect-mongo');
//const mongoSanitize = require('express-mongo-sanitize');
const redis = require('redis');
const connectRedis = require('connect-redis')


const User = require("./models/user");

const userRouter = require('./routes/user.routes');
const postRouter = require('./routes/post.routes');


const app = express();

app.set('view engine', 'ejs');
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(compression());
//app.use(mongoSanitize());
app.use(express.static('public'));

  
app.set('trust proxy', 1); // trust first proxy

const port = config.get('port') || 3000;

//configure redis client
const redisClient = redis.createClient({
	host: config.get('redis_host'),
	port: config.get('redis_port')
})

//tell us if we can establish redis connection
redisClient.on('error', function (err) {
    console.log('no redis connection ' + err);
});
redisClient.on('connect', function (err) {
    console.log('successful redis connection');
});

//configure session
app.use(session({
	//store: new RedisStore({ client: redisClient }),
	secret: config.get('secret'),
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: false,
		httpOnly: false,
		maxAge: 1000*60*10 //session age in ms
	}
}))



app.use(passport.initialize());
app.use(passport.session());



app.use(function(req, res, next) {
	res.locals.isAuthenticated=req.isAuthenticated();
	next();
});

app.use('/user', userRouter);

app.use('/post', postRouter);

app.all('*', function(req, res) {
  res.redirect("/post/about");
});

const server = https.createServer({
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.cert')
}, app).listen(port,() => {
console.log('Listening ...Server started on port ' + port);
})
/*
const server = http.createServer({}, app).listen(port,() => {
console.log('Listening ...Server started on port ' + port);
})
*/
module.exports = app;
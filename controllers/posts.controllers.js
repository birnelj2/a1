require('dotenv').config();
const config = require('../config/config');
const Post = require("../models/post");
const PostSQL = require("../models/postSQL");
var db = require('./db')
const IOredis = require('ioredis');

const homeStartingContent =
	'The home pages lists all the blogs from all the users.';

/*const composePost = (req, res) => {
	const post = new Post({
    username: req.user.username,
		title: req.body.postTitle,
		content: req.body.postBody
	});

	post.save();
	res.redirect('/post');
};
*/

//get ioredis client connection
const ioredis = new IOredis({
	port: config.get('redis_port'),
	host: config.get('redis_host')
})

const composePost = (req, res) => {

	console.log(req.user.username)
	console.log(req.body.postTitle)
	console.log(req.body.postBody)
	console.log(req.user.postId)

	//put post into database
	db.query('Insert into posts(username,title,content) values(?,?,?) ', [req.user.username, req.body.postTitle, req.body.postBody], function (error, results, fields) {
		if (error) {
			console.log("Error");
		}
		else {
			console.log("Successfully posted");

			db.query('Select * from posts ',  function(error, results, fields) {
				if (error){
					console.log("db query error");
				}else{
					//put our data also into the redis cache
					console.log("*****  POST NUMBER = "+results.length);
					const postHash = {
						name: req.user.username+'',
						title: req.body.postTitle+'',
						body:req.body.postBody+'',
					};
					const keyString = results.length+''	
					ioredis.hmset(keyString, postHash);
					console.log("ioredis key = "+keyString);
				}
			})

		}

	});

	var postIdVal = db.query('SELECT MAX(id) FROM posts ');
	//put post into redis cache
	const postHash = {
		name: req.user.username+'',
		title: req.user.title+'',
		body:req.body.postBody+'',
	};

	const keyString = postIdVal+''	
	ioredis.hmset(keyString, postHash);
	ioredis.set("basic", "test");

	res.redirect('/post');
}

const displayAllPosts = (req, res) => {

	console.log("trying to display posts")
	db.query('Select * from posts ',  function(error, results, fields) {
        if (error) 
            {
                console.log("Error");
            }
       else if(results.length>0)
         {
            console.log(results.length)
            console.log(results)
            //console.log("redirect")
            //res.redirect('register')
			let posts=[];
			/*
			for (var r in results){
				console.log(r)
				console.log(r.id)
				console.log(r.title)
				console.log(r.content)
				posts.push(new PostSQL(r.id,r.username,r.title,r.content));
			}
			*/
			// iterate for all the rows in result
			Object.keys(results).forEach(function(key) {
				var r = results[key];
				console.log(r)
				console.log(r.id)
				console.log(r.username)
				console.log(r.title)
				console.log(r.content)
				posts.push(new PostSQL(r.id,r.username,r.title,r.content));
			});
			res.render('home', {
				startingContent: homeStartingContent,//,
				posts: posts
			});
        }
        else
        {
            res.render('home', {
				startingContent: homeStartingContent,//,
				posts: []
			});
        }
       
    });
	
	//res.render('home', {
	//	startingContent: homeStartingContent})
		
	/*Post.find({}, function(err, posts) {
		res.render('home', {
			startingContent: homeStartingContent//,
			//posts: posts
		});
	});*/
};
/*async function displayPost (req, res)  {
	const requestedPostId = req.params.postId;

	Post.findOne({ _id: requestedPostId }, function(err, post) {
		res.render('post', {
			title: post.title,
			content: post.content
		});
	});
};*/

async function displayPost (req, res)  {
	const requestedPostId = req.params.postId;
	//ioredis
	ioredis.hexists(requestedPostId+'', "body", (err, result) => {
		if (result == 1){

			ioredis.hgetall(requestedPostId+'', (err, resultAll) => {
				res.render('post', {
					title: resultAll['title'],
					content: resultAll['body'],
				});
			});

		} else {
			//not in redis cache, so going to database
			console.log("trying to display posts")
			db.query('Select * from posts where id=? ', [requestedPostId],  function(error, results, fields) {
			if (error) 
				{
					console.log("Error");
				}
			else{
				r=results[0];
				res.render('post', {
					title: r.title,
					content: r.content
				});
			}
	
			})
		};
	});
	
};

module.exports = {
	displayAllPosts,
	displayPost,
    composePost
};
/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

process.env.DB = 'mongodb://admin:ThePassword.@cluster0-shard-00-00-hulqw.mongodb.net:27017,cluster0-shard-00-01-hulqw.mongodb.net:27017,cluster0-shard-00-02-hulqw.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority';

const CONNECTION_STRING = process.env.DB;

//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(CONNECTION_STRING, (err,db) => {
        if(err) return console.error(err);
        
        db.collection('lib').find().toArray((err,docs)=>{
          if(err) return console.error(err);
          else if (docs === null) return res.json({error:'empty library'});
          else {
            //let count = docs.comments.length;
            return res.json(docs.map(a => {return {_id:a._id,title:a.title,commentcount:a.comments.length}}));
          }
        })
        db.close();
      })
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      if(Object.keys(req.body) === null || title === '')
        return res.json('title not provided');
    
     else
      MongoClient.connect(CONNECTION_STRING, (err,db) => {
        if(err) return console.log(err);
        
        return new Promise((resolve,reject) => {
          
          db.collection('lib').findOne({title:title},(err,docs)=>{
            if(err) return reject(err);
            else if(docs === null) return resolve({isPresent:false});
            else return resolve({isPresent:true});
          })
          
        }).then( (data) => {
          if(!data.isPresent){
          db.collection('lib').insertOne({title:title,comments:[]},(err,docs) => {
            if(err || docs === null) return res.json({error:err});
            else return  res.json(docs.ops[0]);
          })
          }
          else return res.json({error:'book already availabe'});
        })
        db.close();
      }) 
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      
     MongoClient.connect(CONNECTION_STRING, (err,db) => {
       if(err) return console.error(err);
       
       db.collection('lib').deleteMany({},(err,doc) => {
         if(err || doc === null) return res.json('no book exists');
         else return res.json('complete delete successful');
       })
     })
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
       console.log(bookid);
    
      if(bookid.match(/[A-F0-9]{24}$/gi) === null)
        return res.json('invalid id');
    
     else
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      MongoClient.connect(CONNECTION_STRING, (err,db) => {
        if(err) return console.error(err);
        
        db.collection('lib').findOne({_id:ObjectId(bookid)},(err,docs)=>{
          console.log(docs);
          if(err || docs === null) return res.json('invalid id');
          else {
            return res.json(docs);
          }
        })      
      })
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      MongoClient.connect(CONNECTION_STRING, (err,db) => {
        if(err) return console.error(err);
        
        db.collection('lib').updateOne({_id: ObjectId(bookid)},{
          $push: {comments: comment}
        } , (err,docs) => {
          if(err) return console.error(err);
          else return res.redirect('/api/books/'+bookid);
        })
        db.close();
      })
    
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
    
     MongoClient.connect(CONNECTION_STRING, (err,db) => {
       if(err) return console.error(err);
       
       db.collection('lib').deleteOne({_id:ObjectId(bookid)},(err,doc) => {
         if(err || doc === null) return res.json('no book exists');
         else return res.json('delete successful');
       })
     })
      
    });
  
};

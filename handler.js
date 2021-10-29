'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const {v4 : uuidv4} = require('uuid');

const postesTable = process.env.POSTES_TABLE;

function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}

function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}

module.exports.createPoste = (event, context, callback) => {
  
  const reqBody = JSON.parse(event.body);
  
  
  if (
    !reqBody.title ||
    reqBody.title.trim() === '' ||
    !reqBody.body ||
    reqBody.body.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'Post must have a title and body and they must not be empty'
      })
    );
  }
  
  

  const poste = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    userId: 1,
    title: reqBody.title,
    body: reqBody.body
  };

  return db
    .put({
      TableName: postesTable,
      Item: poste
    })
    .promise()
    .then(() => {
      callback(null, response(201, poste));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};

module.exports.getAllPostes = (event, context, callback) => {
  return db
    .scan({
      TableName: postesTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get number of posts
module.exports.getPostes = (event, context, callback) => {
  const numberOfPostes = event.pathParameters.number;
  const params = {
    TableName: postesTable,
    Limit: numberOfPostes
  };
  return db
    .scan(params)
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get a single post
module.exports.getPoste = (event, context, callback) => {
  const id = event.pathParameters.id;

  const params = {
    Key: {
      id: id
    },
    TableName: postesTable
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'Post not found' }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Update a post
module.exports.updatePoste = (event, context, callback) => {
  const id = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const { body, title } = reqBody;

  const params = {
    Key: {
      id: id
    },
    TableName: postesTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET title = :title, body = :body',
    ExpressionAttributeValues: {
      ':title': title,
      ':body': body
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Delete a post
module.exports.deletePoste = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id: id
    },
    TableName: postesTable
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Post deleted successfully' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};

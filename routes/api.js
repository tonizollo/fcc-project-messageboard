'use strict';
//const cors = require('cors')

// Include the mongoose messageboard model
const MessageBoard = require('../models/messageboard.js');

module.exports = function (app) {

  //app.use(cors()); // for testing on localhost

// The following middleware is to handle the removal of the last character of a redirect path - not sure why this is happening
/*
app.use(function(req, res, next) {
  // If the path ends with a slash and is not just "/"
  if (req.path.substr(-1) === '/' && req.path.length > 1) {
    const query = req.url.slice(req.path.length); // Preserve query parameters
    res.redirect(req.path.slice(0, -1) + query); // Redirect to path without trailing slash
  } else {
    next(); // Continue to the next middleware or route handler
  }
});
*/
  // Threads ------------------------------------------------------------------------------------------------
  app.route('/api/threads/:board')

    // View board - 10 most recent threads with max 3 replies each
    .get(function (req, res) {
      // Payload: loaded from POST redirect
      // Response: [{
      //    "_id": "6933f2a6c953bf0012b16c22",
      //    "text": "Toni thread text",
      //    "created_on": "2025-12-06T09:08:53.911Z",
      //    "bumped_on": "2025-12-06T09:08:53.911Z",
      //    "replies": [],
      //    "replycount": 0 }, ...]
      // Note: latest 3 replies shown only per thread
      console.log('GET /api/threads/:board',req.params);
      console.log(req.params, req.body),
      // Get 10 most recent threads
      getBoardThreads(req.params.board, (error, threadArray) => {
        if (error) {
          console.log('getBoardThreads error:',error);
          return res.send(error)
        }
        // Success - Convert database records to required JSON response array
        let responseJSON = createBoardThreadsJSON(threadArray);
        console.log('getBoardThreads returning JSON ...');
        res.json(responseJSON);
        console.log('getBoardThreads returned JSON');
      });
    })
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    // New thread
    .post(function (req, res) {
      // Notes from sample app"
      
      // Toni, Toni/, style, jquery, vcd?, Toni (get)
      // 302 found: board=Toni&text=00&delete_password=delete
      // /b/Toni: html page
      // jsonResponse array


      // Payload: board=Toni&text=Toni+thread+text&delete_password=delete
      // Redirect: /b/:board (see response in GET)
      console.log('POST /api/threads/:board (params, body):',req.params, req.body);
      // Destructure request parameters
      const { text, delete_password } = req.body;
      const { board } = req.params;
      // Process new thread and store in database
      processNewThread(board, text, delete_password, (error, response) => {
        if (error) {
          console.log('Error return from processNewThread:',error)
          return res.send(error)
        }
        // Success - Redirect client to the board page
        const redirectPath = '/b/' + board + "/";
        console.log('About to redirect to:', redirectPath);

        return res.redirect(redirectPath);
        console.log('redirect done');
      });
    })

    // Report thread

    .put(function (req, res) {
      // Payload: board=Toni&thread_id=69341fc4c953bf0012b16c24+
      // Payload is different from /b/:board page: report_id=69365caa06352100134e3625
      // Response: reported
      console.log('PUT /api/threads/:board',req.params, req.body);
      // *** Important Note: the landing page "/" and "/b/:board" pages requests are different:
      // -> landing page: req.params: {board}, req.body: {board, thread_id}
      // -> board page: req.params: {board}, req.body: {report_id}
      let report_id;
      if (req.body.report_id) {
        report_id = req.body.report_id;
      } else {
        report_id = req.body.thread_id;
      }
      // Update the reported field in the thread db record
      reportThread(req.params.board, report_id, (error, response) => {
        if (error) {
          console.log('api PUT error')
          return res.send(error)
        }
        // Success - thread was reported
        console.log('api PUT sending response ...')
        res.send('reported');
        console.log('api PUT sent')
      });
    })

    // Delete thread
    .delete(function (req, res) {
      // Payload: board=Toni&thread_id=69341fc4c953bf0012b16c24+&delete_password=delete
      // Response: success OR incorrect password
      console.log('DELETE /api/threads/:board',req.params,req.body);
      // Destructure request parameters
      const { thread_id, delete_password } = req.body;
      const { board } = req.params;
      deleteThread(board, thread_id, delete_password, (error, response) => {
        if (error) {
          console.log('api DELETE error')
          return res.send(error)
        }
        // Success - thread was deleted or incorrect password was provided
        console.log('api DELETE sending response ...')
        res.send(response);
        console.log('api DELETE sent response')
      });
    });

  // Replies ------------------------------------------------------------------------------------------------    
  app.route('/api/replies/:board')

    // View replies for a board post
    .get(function (req, res) {
      // Payload: 
      // Response: (redirect from post) 
      // {"_id": "6934231106352100134e3611",
      //    "text": "44",
      //    "created_on": "2025-12-06T12:35:29.327Z",
      //    "bumped_on": "2025-12-06T12:37:31.445Z",
      //    "replies": [ { "_id": "6934238b06352100134e3612", "text": "reply to 44", "created_on": "2025-12-06T12:37:31.445Z" } ]  }
      console.log('GET /api/replies/:board (params,query,body):',req.params, req.query, req.body);
      // Get current thread with all of its replies
      getOneBoardThread(req.params.board, req.query.thread_id, (error, thread) => {
        if (error) {
          console.log('api GET replies error')
          return res.send(error)
        }
        // Success - Convert database records to required JSON response array
        let responseJSON = createOneBoardThreadJSON(thread);
        console.log('api GET replies returning JSON ...')
        res.json(responseJSON);
        console.log('api GET replies returned')
      });
    })

    // New reply
    .post(function (req, res) {
      // Payload: thread_id=6934231106352100134e3611&text=reply+to+44&delete_password=delete
      // Redirect: /b/:board/:_id (see response in GET)
      console.log('POST /api/replies/:board',req.params, req.body);
      // Destructure request parameters
      const { thread_id, text, delete_password } = req.body;
      const { board } = req.params;
      addReplyToThread(board, thread_id, text, delete_password, (error, response) => {
        if (error) {
          console.log('Error return form addReplyToThread:',error)
          console.log('api POST replies error')
          return res.send(error)
        }
        // Success - Redirect client to the thread page
        const redirectPath = '/b/' + board + '/' + thread_id + '/';
        console.log('api POST replies about to redirect to:',redirectPath);
        return res.redirect(redirectPath);
        console.log('api POST replies redirected');
      });
    })

    // Report reply
    .put(function (req, res) {
      // Payload: thread_id=6934231106352100134e3611&reply_id=6934238b06352100134e3612
      // Response: reported
      // note that an alert dialog is raised: reported
      console.log('PUT /api/replies/:board',req.params, req.body);
      // Destructure request parameters
      const { thread_id, reply_id } = req.body;
      const { board } = req.params;
      // Update the reported field in the thread reply db record
      reportReply(board, thread_id, reply_id, (error, response) => {
        if (error) {
          console('api PUT replies error')
          return res.send(error)
        }
        // Success - thread was reported
        console.log('api PUT replies returning reported ...')
        res.send('reported');
        console.log('api PUT replies returned')
      });
    })
    
    // Delete reply
    .delete(function (req, res) {
      // Payload: thread_id=6934231106352100134e3611&reply_id=6934238b06352100134e3612&delete_password=delete
      // Response: success
      // note that an alert dialog is raised: success
      // note that we need to amend the replycounter
      console.log('DELETE /api/replies/:board',req.params, req.body);
      // Destructure request parameters
      const { thread_id, reply_id, delete_password } = req.body;
      const { board } = req.params;
      deleteReply(board, thread_id, reply_id, delete_password, (error, response) => {
        if (error) {
          console.log('api DELETE replies error');
          return res.send(error)
        }
        // Success - thread was deleted or incorrect password was provided
        console.log('api DELETE replies sending json ...');
        res.send(response);
        console.log('api DELETE replies sent');
      });
    });
};

// Functions ------------------------------------------------------------------------------------------------------
// Save new thread to database
function processNewThread(board, text, delete_password, callback) {
  console.log('In processNewThread:',board, text, delete_password);
  // Create an instance of MessageBoard
  const newThread = new MessageBoard({
    board: board,
    text: text,
    delete_password: delete_password,
    replies: []
  });
  // Save document and process any errors
  newThread.save(function(err, data) {
    if (err) {
      console.log('-> error saving new thread:',err);
      console.log('-> callback to err');
      return callback(err)
    }
    console.log('-> processNewThread callback with data:',data);
    callback(null, data);
    console.log('-> processNewThread callback with data done');
  });
};
// -----------------------------------------------------------------------------------------------
// getBoardThreads - fetch 10 most recent threads
function getBoardThreads(board, callback) {
  console.log('In getBoardThreads:',board);
  // Define query conditions look for all the current threads for "board"
  const conditions = {board: board};
  // Define projection (empty object {} returns all fields, or null can be used)
  const projection = {}; 
  // Define options for sort and limit
  const options = {
    sort: { createdAt: -1 }, // Sort by createdAt descending (-1)
    limit: 10          // Limit to 10 results
  };
  MessageBoard.find(conditions, projection, options, (err, threadArray) => {
    if (err) {
      console.log('getBoardThreads error - callback with error')
      return callback(err);
    }
    // Return the 10 most recent documents
    //console.log("The 10 most recent documents are:", threadArray);
    console.log('getBoardThreads success - callback with data ...')
    callback(null, threadArray)
    console.log('getBoardThreads success - callback complete')
  });
};
// -----------------------------------------------------------------------------------------------
// Format input database record into responseJSON for board threads - latest 3 replies per thread
function createBoardThreadsJSON(threadArray) {
  console.log('In createBoardThreadsJSON');
  // database record format: (threadArray)          | JSON format:
  // _id: 69358216edff9f0744f27162                  | { "_id": "6934231106352100134e3611",
  // reported: true                                 |   "text": "44",
  // board: "Toni"                                  |   "created_on": "2025-12-06T12:35:29.327Z",
  // text: "t1"                                     |   "bumped_on": "2025-12-06T12:37:31.445Z",
  // delete_password: "delete"                      |   "replies": [{ "_id": "6934238b06352100134e3612", 
  // replies: Array (empty)                         |                 "text": "reply to 44",
  // createdAt: 2025-12-07T13:33:10.808+00:00       |                 "created_on": "2025-12-06T12:37:31.445Z" }, ... ]
  // updatedAt: 2025-12-07T13:33:10.808+00:00       |  }
  // __v: 0                                         | 

  const responseJSON = threadArray.map(item => {
    // Destructure "item" to pick the required keys for json return
    const { _id, text, createdAt, updatedAt, replies } = item; 
    // Reformat latest 3 replies (last 3, as they are added sequentially in time)
    const repliesJSON = [];
    //console.log('formatting JSON replies:',replies,replies.length);
    const startIndex = Math.max(0, replies.length - 3);
    //console.log('start index is:',startIndex);
    for (let i=startIndex; i<replies.length; i++) {
      repliesJSON.push({
        "_id": replies[i]._id,
        "text": replies[i].text,
        "created_on": replies[i].createdAt
      })
    }
    
    // Construct response
    return {
      "_id": _id,
      "text": text,
      "created_on": createdAt,
      "bumped_on": updatedAt,
      "replies": repliesJSON,
      "replycount": replies.length
    }
  });
  // Return JSON response object
  console.log('createBoardThreadsJSON returing responseJSON')
  return responseJSON;
};
// -----------------------------------------------------------------------------------------------
// Format input database record into responseJSON for a single board thread
function createOneBoardThreadJSON(thread) {
  // database record format: (threadArray)          | JSON format:
  // _id: 69358216edff9f0744f27162                  | { "_id": "6934231106352100134e3611",
  // reported: true                                 |   "text": "44",
  // board: "Toni"                                  |   "created_on": "2025-12-06T12:35:29.327Z",
  // text: "t1"                                     |   "bumped_on": "2025-12-06T12:37:31.445Z",
  // delete_password: "delete"                      |   "replies": [{ "_id": "6934238b06352100134e3612", 
  // replies: Array (empty)                         |                 "text": "reply to 44",
  // createdAt: 2025-12-07T13:33:10.808+00:00       |                 "created_on": "2025-12-06T12:37:31.445Z" }, ... ]
  // updatedAt: 2025-12-07T13:33:10.808+00:00       |  }
  // __v: 0                                         | 

  // Destructure thread to pick the required keys for json return
  const { _id, text, createdAt, updatedAt, replies } = thread; 
  // Reformat all replies
  const repliesJSON = [];
  if (replies.length > 0) {
    for (let i=0; i<replies.length; i++) {
      repliesJSON.push({
        "_id": replies[i]._id,
        "text": replies[i].text,
        "created_on": replies[i].createdAt
      })
    }
  }
  // Construct response
  const responseJSON =  {
    "_id": _id,
    "text": text,
    "created_on": createdAt,
    "bumped_on": updatedAt,
    "replies": repliesJSON,
    "replycount": replies.length
  }
  // Return JSON response object
  return responseJSON;
};
// -----------------------------------------------------------------------------------------------
// Report thread by updating the reported field in the db record to true
function reportThread(board, thread_id, callback) {
  console.log('In reportThread:',board, thread_id);
  // Define query conditions - thread_id, board
  const conditions = {
    board: board,
    _id: thread_id
  };
  console.log('conditions:',conditions);
  // Update reported to true
  const update = {
    reported: true
  }; 
  // Return the updated document
  const options = {
    new: true
  };
  MessageBoard.findOneAndUpdate(conditions, update, options, (err, updatedThread) => {
    if (err) {
      console.log('reportThread error - callback ')
      return callback(err);
    }
    // Return the 10 most recent documents
    console.log("The updated thread:", updatedThread);
    console.log('reportThread success - returning ... ')
    callback(null, updatedThread)
    console.log('reportThread success - returned')
  });
};
// -----------------------------------------------------------------------------------------------
// Delete thread by removing the record in the db - return "success" or "incorrect password"
function deleteThread(board, thread_id, delete_password, callback) {
  console.log('In deleteThread:',board, thread_id, delete_password)
  // Define query conditions - thread_id, board
  const conditions = {
    board: board,
    _id: thread_id,
    delete_password: delete_password
  };
  console.log('conditions:',conditions);
  // Delete record and return appropriate status
  MessageBoard.findOneAndDelete(conditions, (err, deletedThread) => {
    if (err) {
      console.log('deleteThread error - callback')
      return callback(err);
    }
    // If record is null, password was incorrect (record not found)
    if (deletedThread) {
      console.log('deleteThread success - callback ...')
      callback(null, 'success');
      console.log('deleteThread success callback done')
    } else {
      console.log('deleteThread incorrect password - callback...')
      callback(null, 'incorrect password');
      console.log('deleteThread incorrect password callback done')
    }
  });
};
// -----------------------------------------------------------------------------------------------
// Add a reply to a thread on a board
function addReplyToThread(board, thread_id, text, delete_password, callback) {
  console.log('In addReplyToThread:',board, thread_id, text, delete_password)
  // Define query conditions - thread_id, board
  const conditions = {
    board: board,
    _id: thread_id
  };
  console.log('conditions:',conditions);
  // Create reply record and push into array
  const update = {
    $push: { replies: {
              text: text,
              delete_password: delete_password,
              reported: false
            }
    }
  }; 
  // Return the updated document
  const options = {
    upsert: true,   // Create the document if it doesn't exist
    new: true       // Returns the updated document
  };
  MessageBoard.findOneAndUpdate(conditions, update, options, (err, threadWithReply) => {
    if (err) {
      console.log('addReplyToThread error - callback')
      return callback(err);
    }
    // Return the updated thread with reply
    //console.log("The updated thread with reply:", threadWithReply);
    console.log('addReplyToThread response - callback ...')
    callback(null, threadWithReply);
    console.log('addReplyToThread response callback')
  });
};
// -----------------------------------------------------------------------------------------------
// getOneBoardThread - fetch all replies for one thread
function getOneBoardThread(board, thread_id, callback) {
  console.log('In getOneBoardThread:', board, thread_id)
  // Define query conditions look for all the current threads for "board"
  const conditions = {
    board: board,
    _id: thread_id
  };
  MessageBoard.findOne(conditions, (err, thread) => {
    if (err) {
      console.log('getOneBoardThread error - callback');
      return callback(err);
    }
    // Return the thread
    //console.log("The returned thread is:", thread);
    console.log('getOneBoardThread response - callback ...');
    callback(null, thread)
    console.log('getOneBoardThread response callback');
  });
};
// -----------------------------------------------------------------------------------------------
// Report reply by updating the reported field in the db thread record replies to true
function reportReply(board, thread_id, reply_id, callback) {
  console.log('In reportReply:', thread_id, reply_id)
  // Define query conditions - thread_id, board, reply_id
  // Need to search id in subschema and update
  const conditions = {
    board: board,               // current board
    _id: thread_id,             // id of thread
    "replies._id": reply_id     // id of replies in subdocument "replies"
  };
  console.log('conditions:',conditions);
  // Update reported to true
  const update = {
    $set: {
      "replies.$[replyElem].reported": true      // Update "reported" in the subdocument to true
    }
  }; 
  // Return the updated document
  const options = {
    new: true,
    arrayFilters: [ // Define the condition for the 'replyElem' identifier
      { 'replyElem._id': reply_id }
    ]
  };
  MessageBoard.findOneAndUpdate(conditions, update, options, (err, reportedReplyThread) => {
    if (err) {
      console.log('reportReply error - callback')
      return callback(err);
    }
    // Return the 10 most recent documents
    //console.log("The reported reply thread:", reportedReplyThread);
    console.log('reportReply response - callback ...')
    callback(null, reportedReplyThread)
    console.log('reportReply response callback')
  });
};
// -----------------------------------------------------------------------------------------------
// Delete reply by changing the subdocument record text in the db to [deleted] - return "success" or "incorrect password"
function deleteReply(board, thread_id, reply_id, delete_password, callback) {
  console.log('In deleteReply:',board, thread_id, reply_id, delete_password)
  // Define query conditions - thread_id, board
  const conditions = {
    board: board,
    _id: thread_id,
    'replies._id': reply_id,    // Search within the 'replies' array for the subdocument _id
    'replies.delete_password': delete_password  // Match the reply delete_password
  };
  //console.log('conditions:',conditions);
  // Update subdocument by removing entry (this is not required - only update the text)
  /*
  const update = {
    $pull: {
      replies: {
        _id: reply_id,
        delete_password: delete_password
      }
    }
  }; 
  */
  // Update text to [deleted]
  const update = {
    $set: {
      "replies.$[replyElem].text": '[deleted]'      
    }
  }; 
  // Return the updated document (thread and replies)
  const options = {
    new: true,
    arrayFilters: [ // Define the condition for the 'replyElem' identifier
      { 'replyElem._id': reply_id } 
    ]
  };

  // Delete reply and return appropriate status
  MessageBoard.findOneAndUpdate(conditions, update, options, (err, deletedReply) => {
    if (err) {
      console.log('deleteReply error - callback')
      return callback(err);
    }
    // If record is null, password was incorrect (subdocument not found)
    console.log('deleted reply record:', deletedReply)
    if (deletedReply) {
      console.log('deleteReply success - callback ...')
      callback(null, 'success');
      console.log('deleteReply success callback')
    } else {
      console.log('deleteReply incorrect pw - callback ...')
      callback(null, 'incorrect password');
      console.log('deleteReply incorrect pw callback')
    }
  });
};
// -----------------------------------------------------------------------------------------------

'use strict';

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post( (req, res) => {
      console.log('POST /api/threads/:board', req.params, req.body);
      //res.send('POST Request received');
      res.redirect(`/b/${req.params.board}`);
    })

    .get ( (req, res) => {
      console.log('GET /api/threads/:board', req.params, req.body);
      res.send('Processed GET')
    })
    
  app.route('/api/replies/:board');

};

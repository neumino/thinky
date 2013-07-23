var thinky = require( 'thinky' );
var Todo     = thinky.models['Todo'];
var utils    = require( 'connect' ).utils;

exports.index = function ( req, res, next ){
  var user_id = req.cookies ?
    req.cookies.user_id : undefined;

  if (user_id !== undefined) {
    Todo.
      filter({ user_id : user_id }).
      orderBy( 'updated_at' ).
        run( function ( err, todos ){
          if( err ) return next( err );
          res.render( 'index', {
            title : 'Express Todo Example',
            todos : todos
          });
      });
  }
  else {
    res.render( 'index', {
      title : 'Express Todo Example',
      todos : []
    });
  }
};

exports.create = function ( req, res, next ){
  new Todo({
      user_id    : req.cookies.user_id,
      content    : req.body.content
      //Cool stuff: Since we passed a default function, we don't have to define update_at, the function will be called to set the date.
      //updated_at : Date.now()
  }).save( function ( err, todo ){
    if( err ) return next( err );

    res.redirect( '/' );
  });
};

exports.destroy = function ( req, res, next ){
  Todo.get( req.params.id, function ( err, todo ){
    var user_id = req.cookies ?
      req.cookies.user_id : undefined;

    if( todo.user_id !== req.cookies.user_id ){
      return utils.forbidden( res );
    }

    todo.delete(function ( err, todo ){
      if( err ) return next( err );

      res.redirect( '/' );
    });
  });
};

exports.edit = function( req, res, next ){
  var user_id = req.cookies ?
      req.cookies.user_id : undefined;

  Todo.
    filter({ user_id : user_id }).
    orderBy( 'updated_at' ).
    run( function ( err, todos ){
      if( err ) return next( err );

      res.render( 'edit', {
        title   : 'Express Todo Example',
        todos   : todos,
        current : req.params.id
      });
    });
};

exports.update = function( req, res, next ){
  Todo.get( req.params.id, function ( err, todo ){
    var user_id = req.cookies ?
      req.cookies.user_id : undefined;

    if( todo.user_id !== user_id ){
      return utils.forbidden( res );
    }

    todo.content    = req.body.content;
    todo.updated_at = Date.now();
    todo.save( function ( err, todo, count ){
      if( err ) return next( err );

      res.redirect( '/' );
    });
  });
};

exports.current_user = function ( req, res, next ){
  var user_id = req.cookies ?
      req.cookies.user_id : undefined;

  if( !user_id ){
    res.cookie( 'user_id', utils.uid( 32 ));
  }

  next();
};

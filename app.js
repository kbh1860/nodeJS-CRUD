const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const serve = require('serve-static');

const dbConfig = require("./config/db");
const main = require('./routes/main/index')
const logout = require('./routes/logout/index');
const hidden = require('./routes/hidden/index');
const write = require('./routes/write/index');
const board = require('./routes/board/index');
const editForm = require('./routes/editForm/index');
const writeComment = require('./routes/writeComment/index');
const showComment = require('./routes/showComment/index');
const askID = require("./routes/askID/index");
const view = require("./routes/view/index");

const session = require('express-session');
const store = require('express-mysql-session')(session);
const path = require('path');
const { userInfo } = require('os');
var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({extended:false}));
app.use('/upload', express.static('upload'));
app.use('/logout', logout);
app.use('/main', main);
app.use('/hidden', hidden);
app.use('/write', write);
app.use('/board', board);
app.use('/editForm', editForm);
app.use('/showComment', showComment);
app.use('/writeComment', writeComment);
app.use('/askID', askID);
app.use('/view', view);

app.use(session({
    secret : "key",
    resave: true,
    saveUninitialized: true
    })
);


var dbInform = {
    host : dbConfig.host,
    port : dbConfig.port,
    user : dbConfig.user,
    password : dbConfig.password,
    database : dbConfig.database
};

var dbConn = mysql.createConnection(dbInform);
dbConn.connect();

var storage = multer.diskStorage({
    destination: (req, file, callback) =>{
        callback(null, 'upload');
    },

    filename: (req, file, callback) => {
        let array = file.originalname.split('.');
        array[0] = array[0] + '_';
        array[1] = '.' + array[1];
        array.splice(1, 0, Date.now().toString());
        const result = array.join('');
        callback(null, result);
    }
});

var upload = multer({storage});


app.get('/', (req, res) =>{
    res.redirect('/main');
});

app.get('/login', (req, res) =>{
    res.render('login');
})

app.post('/login', (req, res) => {
    var id = req.body.username;
    var pw = req.body.password;

    var query = 'SELECT * FROM userInform WHERE ID=?';
    dbConn.query(query, [id], (err, results) =>{
        if(err){
            console.log(err);
        }

        if(!results[0]){
            res.redirect('/login');
        }
        var userInform = results[0];

        if(id == userInform.ID && pw == userInform.PW){
            req.session.user = {
                id : userInform.ID,
                pw : userInform.PW,
                authorized : true,
            };
            console.log(req.session.user)
            res.redirect('/hidden');
        }
        else{
            res.redirect('/login');
        }
    });
});

app.post('/logout', (req, res) =>{
    req.session.destroy((err) =>{
        res.redirect("/");
    })
});

app.get('/hidden', (req,res) => {
    if(!req.session.user){
        res.redirect('/main');
    }
    else res.render('hidden');
});

app.get('/write', (req, res) =>{
    if(!req.session.user){
        res.redirect('/main');
    }
    else res.render('write');
});

app.post('/write', upload.single('uploadFile'), (req, res)=>{
    var id = req.body.id;
    var content = req.body.content;
    if(req.file == null){
        var query = 'INSERT INTO Board(ID, content) VALUES(?, ?)';
        dbConn.query(query, [id, content], (err) =>{
            if(err){
                console.log(err);
            }
            else res.redirect('/board');
        });
    }

    else{
        const fileName = req.file.filename;
        const fileType = req.file.mimetype;

        var query = 'INSERT INTO Board(ID, content, fileName, fileType) VALUES(?, ?, ?, ?)';
        dbConn.query(query, [id, content, fileName, fileType] , (err)=>{
            if(err) console.log(err);
            else res.redirect('/board');
        });
    }

});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    var id = req.body.username;
    var pw = req.body.password;

    var query = "INSERT INTO userInform(ID, PW) VALUES(?, ?)";
    dbConn.query(query, [id, pw], (err) => {
        if(err){
            console.log(err);
            res.redirect('/main');
        }
    });

    res.redirect('/login');
});

app.get('/board', (req, res)=>{
    if(!req.session.user) res.redirect('/main');
    else{
        var query = 'SELECT * FROM board';
        dbConn.query(query, (err, rows)=>{
            if(err) console.error(err);
            res.render('board', {rows});
        });
    }
});

app.get('/editForm/:id', (req, res)=>{
    var id = req.params.id;
    var query = 'SELECT content FROM Board WHERE ID=?';
    dbConn.query(query, [id], (err,rows)=>{
        res.render('editForm', {id, rows});
    }); 
});


app.post('/edit/:id', (req, res) =>{
    var id = req.params.id;
    var edit = req.body.edit;
   var query = "UPDATE Board SET content=? WHERE ID=?";
   dbConn.query(query,[edit,id], (err,rows)=>{
        if(err) console.log(err);
        query = 'SELECT * FROM Board';
        dbConn.query(query, (err,rows)=>{
            res.render('board', {rows});
        });
   });
});

app.get('/delete/:id', (req, res) => {
     var deleteID = req.params.id;
     var query = "DELETE FROM board WHERE ID=?";
     dbConn.query(query, [deleteID], (err) =>{
        if(err) console.log(err);
        query = 'SELECT * FROM board';

        dbConn.query(query, (err, rows)=>{
            if(err) console.error(err);
            console.log(rows);
            res.render('board', {rows});
        });
     });
}); 

app.get('/write/:id', (req,res)=>{
    res.render("writeComment", {id});
});

app.get('/deleteBoard', (req, res) =>{
    res.render("deleteBoard");
});

app.get('/writeComment/:whom', (req, res)=>{
    var dst = req.param('id');
    var comment = req.param('comment');
    var whom = req.params.whom;

    console.log(dst);
    var query = "INSERT INTO Comment(Whom, ID, Comment) VALUES(?, ?, ?);"
    dbConn.query(query, [whom , dst, comment], (err, rows)=>{
        if(err) console.log(err);
        
        query = 'SELECT * FROM board';

        dbConn.query(query, (err, rows) =>{
            if(err) console.log(err);
            res.render('board', {rows});
        });
    });
});

app.get('/askID', (req,res)=>{
    res.render('askID');
});

app.post('/askID', (req, res)=>{
    var dstID = req.body.id;

    var query = 'SELECT * FROM comment WHERE id=?';
    dbConn.query(query, [dstID], (err, rows)=>{
        if(rows.length == 0){
            query = 'SELECT * FROM board';
            dbConn.query(query, (err, rows)=>{
                res.render('board', {rows});
            }); 
        }

        else{
            res.render('showComment', {rows});
        }
    })
})

app.get("/view/:id", (req,res)=>{
    id = req.params.id;
    var query = "SELECT content FROM board WHERE ID=?";
    dbConn.query(query, [id], (err, content) => {
        if(err) console.log(err);
        query = "SELECT * FROM comment WHERE Whom=?";
        dbConn.query(query, [id], (err, comment)=>{
            if(err) console.log(err);
            if(comment == null){
                query =  'SELECT fileName FROM Board WHERE ID=?';
                dbConn.query(query, [id], (err, fileName)=>{
                    if(fileName == null){
                        res.render('view', {id, content});
                    }
                    else{
                        query = 'SELECT fileType FROM Board WHERE ID=?';
                        dbConn.query(query,[id], (err, fileType)=>{
                            res.render('view', {id, content,fileName, fileType, comment});
                        });
                    }
                });
            }
            else{
                query = 'SELECT fileName FROM Board WHERE ID=?';
                dbConn.query(query, [id], (err, fileName)=>{
                    if(fileName == null){
                        res.render('view', {id, content, comment});
                    }

                    else{
                        query = 'SELECT fileType FROM Board WHERE ID=?';
                        dbConn.query(query,[id], (err, fileType)=>{
                            res.render('view', {id, content, fileName, fileType, comment});
                        });
                    }
                });
            }
        });
    });
})

app.listen(4000);
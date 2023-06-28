const express = require('express');
const path = require('path');
const ejs = require('ejs');
const router = express.Router();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '..', '..', 'views')));

router.get('/board', (req, res)=>{
    res.render('board');
});

module.exports = router;
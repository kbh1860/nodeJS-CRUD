const express = require('express');
const path = require('path');
const ejs = require('ejs');
const router = express.Router();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '..', '..', 'views')));
router.get('/', (req, res) =>{
    res.render('main');
});

module.exports = router;
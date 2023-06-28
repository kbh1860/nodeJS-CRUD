const express = require('express');
const path = require('path');
const ejs = require('ejs');
const router = express.Router();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '..', '..', 'views')));
router.get('/hidden', (req, res) =>{
    res.render('hidden');
});

module.exports = router;
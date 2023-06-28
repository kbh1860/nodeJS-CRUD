const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/logout', (req, res) =>{
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'main.ejs'));
});

module.exports = router;
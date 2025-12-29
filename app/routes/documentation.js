const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/documentation', (req, res) => {
    const docPath = path.join(__dirname, '../../README.md');
    fs.readFile(docPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Could not read documentation file.' });
        }
        res.type('text/markdown').send(data);
    });
});

module.exports = router;

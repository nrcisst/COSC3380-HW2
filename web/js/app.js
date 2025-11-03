// Placeholder for JavaScript application logic.
const express = require("express")
const app = express()
const path = require('path')

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.listen(8080, () => {});

app.get('/index.html', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'index.html'))
});

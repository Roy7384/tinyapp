const express = require("express");
const res = require("express/lib/response");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// handlers when client requests corresponding endpoints
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// pass the urlDatabase to ejs template to display urls_index page
app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// endpoint to return a page that shows a single URL and its shortened form
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render('urls_show.ejs', templateVars);
});

// setup server to listen incoming requests made to port: PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
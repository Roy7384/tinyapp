// function to generate a unique shortURL
const generateRandomString = function(urlDB) {

  // helper function to generate the random string from character set of 0-9, A-Z and a-z
  const randomValidCharCode = function() {
    let result = '';
  
    for (let i = 0; i < 6; i++) {
      let randomCharCode = 60;
      while ((randomCharCode > 57 && randomCharCode < 65)
          || (randomCharCode > 90 && randomCharCode < 97)) {
        randomCharCode = Math.floor(48 + Math.random() * 74);
      }
      result += String.fromCharCode(randomCharCode);
    }
  
    return result;
  };

  // set a starting point to start the generation process
  let result = Object.keys(urlDB)[0];
  // keep generating string if the generated string exists in urlDB already
  while (urlDB[result]) {
    result = randomValidCharCode();
  }
  return result;

};

// Server codes
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const userDatabase = {
  default : {id: 'default', email: 'default', password: 'default'}
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


// get /urls
// pass the urlDatabase to ejs template to display urls_index page
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: userDatabase[req.cookies['user_id']] };
  res.render('urls_index', templateVars);
});

// get /urls/new
// route to render url submit page
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies['user_id']]
  };
  res.render('urls_new', templateVars);
});

// route to handle the add new url post request from client
app.post('/urls', (req, res) => {
  const newShortURL = generateRandomString(urlDatabase);
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = newLongURL;
  res.redirect(`/urls/${newShortURL}`);
});

// get /urls/:shortURL (urls_show ejs template)
// route to return a page that shows a single URL and its shortened form
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: userDatabase[req.cookies['user_id']]
  };


  res.render('urls_show.ejs', templateVars);
});

// route to handle the delete post request
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect('/urls');
});

// route to handle the edit post request
app.post('/u/:shortURL/edit', (req, res) => {
  const newLongURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = newLongURL;
  res.redirect('/urls');
});

// redirect shortURL to longURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// route for user login using cookie
app.post('/login', (req, res) => {
  const userName = req.body.username;
  res.cookie('username', userName);
  res.redirect('/urls');
});

// route for user logout and clear cookie
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// route to get /registration page
app.get('/registration', (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies['user_id']]
  };
  res.render('urls_regis', templateVars);
});

// route to handle post request from registration page
app.post('/registration', (req, res) => {
  const userRandomID = generateRandomString(userDatabase);
  userDatabase[userRandomID] = {
    id: userRandomID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', userRandomID);
  res.redirect('/urls');
});

// setup server to listen incoming requests made to port: PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
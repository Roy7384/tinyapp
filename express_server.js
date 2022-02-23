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

// function to validate is email or both email and password match in the userDababase
const userValidator = function(userE, userDatabase, userP) {
  if (!userP) {
    for (const id in userDatabase) {
      if (userE === userDatabase[id].email) {
        return true;
      }
    }
  }
  if (userP) {
    for (const id in userDatabase) {
      if (userE === userDatabase[id].email && userP === userDatabase[id].password) {
        return id;
      }
    }
  }
  return false;
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
  default : {id: 'default', email: 'default@com', password: 'default'}
};

// handlers when client requests corresponding endpoints
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(userDatabase);
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

// route for user logout and clear cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
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
  const currentUserEmail = req.body.email;
  const currentUserPW = req.body.password;
  // check if email or password is empty
  if (!(currentUserEmail && currentUserPW)) {
    res.status(400).send('<h1>Error 400<br>Email or password is missing</h1>');
    return;
  }
  // check if email already in userDatabase
  if (userValidator(currentUserEmail, userDatabase)) {
    res.status(400).send(`<h1>Error 400<br>Email <u>${currentUserEmail}</u> already been registered`);
    return;
  }
  // store user into database
  userDatabase[userRandomID] = {
    id: userRandomID,
    email: currentUserEmail,
    password: currentUserPW
  };
  
  res.cookie('user_id', userRandomID);
  res.redirect('/urls');
});

// route get to render user login page request
app.get('/login', (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies.user_id]
  };
  res.render('urls_login', templateVars);
});

// route for POST /login
app.post('/login', (req, res) => {
  const currentUserEmail = req.body.email;
  const currentUserPW = req.body.password;
  let currentUserId = undefined;
  
  // return 403 error if no email is matched
  if (!userValidator(currentUserEmail, userDatabase)) {
    res.status(403).send(`<h1>Error 403<br>Email <u>${currentUserEmail}</u> has not been registered`);
    return;
  }

  
  // get the user_id from userDatabase from mathing email
  currentUserId = userValidator(currentUserEmail, userDatabase, currentUserPW);
  
  // setup cookie for successful login
  if (currentUserId) {
    res.cookie('user_id', currentUserId);
    res.redirect('/urls');
  } else { // return 403 error if email is matched but password is wrong
    res.status(403).send(`<h1>Error 403<br>Password wrong`);
  }
});

// setup server to listen incoming requests made to port: PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
/*
 * +-----------------------------------------+
 * | Dependencies, middleware and data setup |
 * +-----------------------------------------+
 */
const {
  generateRandomString,
  userValidator,
  getURLfromId,
  shortURLValidator,
  dateStrGen
} = require('./helpers/helperFunctions');
const {
  urlDatabase,
  userDatabase
} = require('./data/data');

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const PORT = 8080; // default port 8080
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// set up global variable so that middleware can parse urlDatabase according to userID for the rest of routes to use
let userID, urlsBID, templateVars;

// parse urls according to logged in user for the rest of route to use
app.use('/', (req, res, next) => {
  userID = req.cookies.user_id;
  urlsBID = getURLfromId(userID, urlDatabase);
  templateVars = {
    urls: urlsBID,
    user: userDatabase[userID],
    allUrlDB: urlDatabase
  };
  next();
});

/*
 * +----------------+
 * | All GET Routes |
 * +----------------+
 */
// for debugging purpose, can use curl to check database without refresh webpage
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// get /
app.get('/', (req, res) => {
  if (userID) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/registration');
});

// get /urls
// pass the urlDatabase to ejs template to display urls_index page
app.get('/urls', (req, res) => {
  res.render('urls_index', templateVars);
});

// get /urls/new
// route to render url submit page
app.get('/urls/new', (req, res) => {

  if (!templateVars.user) {
    res.redirect('/registration');
    return;
  }
  res.render('urls_new', templateVars);
});

// get /urls/:shortURL (urls_show ejs template)
// route to return a page that shows a single URL and its shortened form
app.get('/urls/:shortURL', (req, res) => {
  const validation = shortURLValidator(userID, req.params.shortURL, urlDatabase);
  
  if (validation === "shortURL does not exist") {
    res.status(404).send("<h1>Error 404<br>short URL does not exist in our database!");
    return;
  }
  templateVars['shortURL'] = req.params.shortURL;
  templateVars['longURL'] = urlDatabase[req.params.shortURL].longURL;
  
  res.render('urls_show.ejs', templateVars);
});

// redirect shortURL to longURL // todo: edge case GET this path directly with unvalid shortURL
app.get('/u/:shortURL', (req, res) => {
  let longURL;
  for (const shortURL in urlDatabase) {
    if (req.params.shortURL === shortURL) {
      longURL = urlDatabase[shortURL].longURL;
    }
  }
  res.redirect(longURL);
});

// route to get /registration page
app.get('/registration', (req, res) => {
  res.render('urls_regis', templateVars);
});

// route get to render user login page request
app.get('/login', (req, res) => {
  res.render('urls_login', templateVars);
});

/*
 * +-----------------+
 * | All POST Routes |
 * +-----------------+
 */
// route to handle the add new url post request from client
app.post('/urls', (req, res) => {
  const createDate = dateStrGen();
  const newShortURL = generateRandomString(urlDatabase);
  const longURL = req.body.longURL;
  urlDatabase[newShortURL] = { longURL, userID, createDate};
  res.redirect(`/urls/${newShortURL}`);
});

// route to handle the delete post request
app.post('/urls/:shortURL/delete', (req, res) => {
  const validation = shortURLValidator(userID, req.params.shortURL, urlDatabase);

  if (validation === "shortURL does not exist") {
    res.status(404).send("<h1>Error 404<br>short URL does not exist in our database!");
    return;
  }

  if (validation) {
    delete urlDatabase[req.params.shortURL];
  }

  res.redirect('/urls');
});

// route to handle the edit post request
app.post('/u/:shortURL/edit', (req, res) => {
  const validation = shortURLValidator(userID, req.params.shortURL, urlDatabase);

  if (validation === "shortURL does not exist") {
    res.status(404).send("<h1>Error 404<br>short URL does not exist in our database!");
    return;
  }

  if (validation) {
    const newLongURL = req.body.longURL;
    urlDatabase[req.params.shortURL] = { longURL: newLongURL, userID, createDate: dateStrGen() };
  }
  res.redirect('/urls');
});

// route for user logout and clear cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// route to handle post request from registration page
app.post('/registration', (req, res) => {
  const userRandomID = generateRandomString(userDatabase);
  const { email, password } = req.body;
  
  // check if email or password is empty
  if (!(email && password)) {
    res.status(400).send('<h1>Error 400<br>Email or password is missing</h1>');
    return;
  }
  // check if email already in userDatabase
  if (userValidator(email, userDatabase)) {
    res.status(400).send(`<h1>Error 400<br>Email <u>${email}</u> already been registered`);
    return;
  }
  // store user into database
  userDatabase[userRandomID] = {
    id: userRandomID,
    email,
    password
  };
  
  res.cookie('user_id', userRandomID);
  res.redirect('/urls');
});

// route for POST /login
app.post('/login', (req, res) => {

  const { email, password } = req.body;
  let currentUserId = undefined;
  
  // return 403 error if no email is matched
  if (!userValidator(email, userDatabase)) {
    res.status(403).send(`<h1>Error 403<br>Email <u>${email}</u> has not been registered`);
    return;
  }

  // get the user_id from userDatabase from mathing email
  currentUserId = userValidator(email, userDatabase, password);
  
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
  console.log(`TinyApp server listening on port ${PORT}!`);
});
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
  dateStrGen,
  uniqueVisitorTracker,
  historyTracker
} = require('./helpers/helperFunctions');
const {
  urlDatabase,
  userDatabase
} = require('./data/data');

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");

const PORT = 8080; // default port 8080
const app = express();

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'user_id',
  keys: ['rrl', 'rolex', 'sub']
}));

// set up global variable so that middleware can parse urlDatabase according to userID for the rest of routes to use
let userID, urlsBID, templateVars;

// parse urls according to logged in user for the rest of route to use
app.use('/', (req, res, next) => {
  userID = req.session.user_id;
  urlsBID = getURLfromId(userID, urlDatabase);
  templateVars = {
    urls: urlsBID,
    user: userDatabase[userID],
    allUrlDB: urlDatabase
  };
  next();
});

/*
 * +-------------------+
 * | Custom middleware |
 * +-------------------+
 */

// middleware to validate passed in shortURL
app.use('/*/:shortURL', (req, res, next) =>  {
  if (req.params.shortURL === 'new') {
    return next();
  }
  const validation = shortURLValidator(userID, req.params.shortURL, urlDatabase);
  
  if (validation === "shortURL does not exist") {
    res.status(404).send("<h1>Error 404<br>short URL does not exist in our database!</h1>");
    return;
  }
  next();
});

// middleware to validate correct user info is provided for any POST related request
app.use('/urls', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  const { email } = userDatabase[userID]; // get email by ID, will be undefined if not logged in
  const validationStatus = userValidator(email, userDatabase);

  if (!validationStatus) {  // if validation fail
    res.status(403).send("<h1>Error 403 - Forbidden</h1>");
    return;
  }
  next();
});

/*
* +----------------+
* | All GET Routes |
* +----------------+
*/

// get / acording to whether user is logged in or not
app.get('/', (req, res) => {
  if (userID) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/registration');
});

// route to get /registration page
app.get('/registration', (req, res) => {
  if (templateVars.user) {
    res.redirect('/urls');
    return;
  }
  res.render('urls_regis', templateVars);
});

// route get to render user login page request
app.get('/login', (req, res) => {
  if (templateVars.user) {
    res.redirect('/urls');
    return;
  }
  res.render('urls_login', templateVars);
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
    res.redirect('/login');
    return;
  }
  res.render('urls_new', templateVars);
});

// get /urls/:shortURL (urls_show ejs template)
// route to return a page that shows a single URL and its shortened form
app.get('/urls/:shortURL', (req, res) => {
  
  templateVars['shortURL'] = req.params.shortURL;
  templateVars['longURL'] = urlDatabase[req.params.shortURL].longURL;
  
  res.render('urls_show.ejs', templateVars);
});

// redirect shortURL to longURL // todo: edge case GET this path directly with unvalid shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURLrequested = req.params.shortURL;
  const thisURL = urlDatabase[shortURLrequested];
  thisURL.clickCount ++;  // update click counts ie. number of visits

  // update unique visitor count
  uniqueVisitorTracker(req.session, thisURL, userDatabase);
  
  // update visit history
  historyTracker(thisURL, req.session.user_id);

  let longURL;
  for (const shortURL in urlDatabase) {
    if (shortURLrequested === shortURL) {
      longURL = urlDatabase[shortURL].longURL;
    }
  }
  res.redirect(longURL);
});

/*
 * +---------------------------+
 * | All POST and other Routes |
 * +---------------------------+
 */

// route to handle the add new url post request from client
app.post('/urls', (req, res) => {
  const createDate = dateStrGen();
  const newShortURL = generateRandomString(urlDatabase);
  const longURL = req.body.longURL;

  urlDatabase[newShortURL] = {
    longURL,
    userID,
    createDate,
    clickCount: 0,
    uniqueVisitors: [],
    visitHistory: []
  };

  res.redirect(`/urls/${newShortURL}`);
});

// route to handle the DELETE request
app.delete('/urls/:shortURL', (req, res) => {
  
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// route to handle the edit PATCH request
app.patch('/urls/:shortURL', (req, res) => {

  const newLongURL = req.body.longURL;
  urlDatabase[req.params.shortURL].longURL = newLongURL;
  res.redirect('/urls');
});

// route for user logout and clear cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// route to handle post request from registration page
app.post('/registration', (req, res) => {
  const userRandomID = generateRandomString(userDatabase);
  const { email } = req.body;
  const oringinPassword = req.body.password;
  const password = bcrypt.hashSync(oringinPassword, 10);
  
  // check if email or password is empty
  if (!(email && oringinPassword)) {
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
  
  req.session.user_id = userRandomID;
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

  currentUserId = userValidator(email, userDatabase, password) && password;
  
  // setup cookie for successful login
  if (currentUserId) {
    req.session.user_id = currentUserId;
    res.redirect('/urls');
  } else { // return 403 error if email is matched but password is wrong
    res.status(403).send(`<h1>Error 403<br>Password wrong`);
  }
});

// setup server to listen incoming requests made to port: PORT
app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});
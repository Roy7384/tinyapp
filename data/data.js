// test Database for urls and users
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "default",
    createDate: '2/23/2022'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "default",
    createDate: '2/21/2022'
  }
};
const userDatabase = {
  default : {id: 'default', email: 'default@com', password: 'default'}
};

module.exports = { urlDatabase, userDatabase };
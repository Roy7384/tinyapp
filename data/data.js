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
  default : {id: 'default', email: 'default@com', password: '$2a$10$KemRGcOob5j0YuUj5A1koOAHaLXwhiIrCyrRfVI5Z5x.IhBoLB3Qq'}
};

module.exports = { urlDatabase, userDatabase };
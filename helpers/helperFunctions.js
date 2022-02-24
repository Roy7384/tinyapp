const bcrypt = require("bcryptjs");

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
  let result = randomValidCharCode();
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
        return id; // use for checking if email is already in system when registering
      }
    }
  }
  if (userP) {
    for (const id in userDatabase) {
      const passwordCheck = bcrypt.compareSync(userP, userDatabase[id].password);
      if (userE === userDatabase[id].email && passwordCheck) {
        return id; // return the unique id for the user if both email and password match
      }
    }
  }
  return undefined;
};

// function to get URLs according to userId
const getURLfromId = function(userID, urlDatabase) {
  let result = {};
  for (const shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      result[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return result;
};

// function to validate if shortURL exist and if it exists, does it belong to the logged in user
const shortURLValidator = function(userID, shortURL, urlDB) {
  if (Object.keys(urlDB).includes(shortURL)) {
    if (userID === urlDB[shortURL].userID) {
      return true;
    }
    return false;
  }
  return "shortURL does not exist";
};

// function to generate date in readable string
const dateStrGen = function() {
  const dateNow = new Date();
  return dateNow.toLocaleDateString('en-US', {hour: '2-digit', minute:'2-digit'});
};

module.exports = {
  generateRandomString,
  userValidator,
  getURLfromId,
  shortURLValidator,
  dateStrGen
};
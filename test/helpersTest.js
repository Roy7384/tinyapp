const { userValidator } = require('../helpers/helperFunctions');
const { assert } = require('chai');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('userValidation', () => {
  it('should return a user with valid email', () => {
    const user = userValidator("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });

  it('should return undefined when a non-existent email passed in',  () => {
    const user = userValidator('a@a.com', testUsers);
    const expectedResult = undefined;
    assert.equal(user, expectedResult);
  });
});
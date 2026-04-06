const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DB_PATH = process.env.RENDER
  ? '/data/users.json'
  : path.join(__dirname, 'data', 'users.json');

function getUsers() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveUsers(users) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find((u) => u.email === email) || null;
}

function createUser({ email, passwordHash }) {
  const users = getUsers();
  const newUser = {
    id: randomUUID(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

module.exports = { getUsers, saveUsers, findUserByEmail, createUser };

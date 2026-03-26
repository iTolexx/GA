# Dokumentation Omar
## CRD - PUG & HTMX

## SERVER
```js
const express = require("express");
const app = express();
const port = process.env.PORT || 3400;
const escape = require("escape-html");
const session = require("express-session");
const fs = require("fs");
require("pug");

app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    })
);

app.set("view engine", "pug");
app.set("views", "./views");



```
Här skriver du om servern
****
## DATA

```js
// Funktion för att spara data som json i en .json-fil
function saveData(data) {
    fs.writeFileSync("db.json", JSON.stringify(data, null, 3));
}

// Hämta och parsa data till array eller object
function getData() {
    return JSON.parse(fs.readFileSync("db.json").toString());
}

// Funktion för att spara användare i en users.json-fil
function saveUsers(users) {
    fs.writeFileSync("users.json", JSON.stringify(users, null, 3));
}

// Hämta och parsa användardata från users.json
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync("users.json").toString());
    } catch (e) {
        return []; // Returnera en tom array om filen inte finns
    }
}



```
Här skriver du om datahantering
***
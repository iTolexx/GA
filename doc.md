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
 Den här koden startar en webbserver med Express. Den importerar olika paket som behövs, till exempel för sessions (inloggning) och Pug för att skapa webbsidor. Servern kan ta emot data från formulär och är inställd att använda Pug-filer från mappen "views".
***
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
Den här delen hanterar data i projektet. Den sparar och hämtar produkter från db.json och användare från users.json. Om filen med användare inte finns returneras en tom lista istället för att programmet kraschar.
***
## ROUTES


```js
app.get("/", (req, res) => {
    res.render("home", { message: "Home Page" }); //ändrat render-funktionen till att använda Pug istället
});
```
Den här route visar startsidan.
***
## REGISTER

```js
app.get("/", (req, res) => {
    res.render("home", { message: "Home Page" }); //ändrat render-funktionen till att använda Pug istället
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render("home", { message: "Please fill in both fields." });
    }

    const users = getUsers();

    if (users.find(u => u.username == username)) {
        return res.render("home", { message: "User already exists." });
    }

    users.push({ username, password });
    saveUsers(users);

    res.render("home", { content: "Registration successful. You can now log in." });
});
```
Den här delen registrerar en ny användare. Den kontrollerar först att fälten inte är tomma och att användarnamnet inte redan finns. Om allt är okej sparas användaren i users.json
***
## LOGIN

```js
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.render("template", { content: "Invalid username or password." });
    }

    req.session.auth = true;
    req.session.user = username;

    res.render("home", { content: `Welcome ${username}, you are now logged in.` });
});
```
Här loggar användaren in. Programmet kollar om användarnamn och lösenord stämmer. Om det gör det sparas en session, så servern vet att användaren är inloggad.
***
## LOGOUT

```js
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.render("home", { content: "You are now logged out." });
    });
});
```
Den här delen loggar ut användaren genom att ta bort sessionen.
***
## SHOW PRODUCKTS

```js
app.get("/products", (req, res) => {
    const products = getData();

    if (products.length === 0) {
        return res.render("home", { message: "No products yet." });
    }

    res.render("products", { 
    products,
    user: req.session.user
});
});
```
Visar alla produkter från db.json. Om det inte finns några produkter visas ett meddelande istället.
***
## CREATE PRODUCT

```js
app.get("/products/create", (req, res) => {
    if (!req.session.auth) {
        return res.render("template", { content: "You must be logged in to create a product." });
    }

    const { name, price } = req.query;

    if (!name || !price) {
        return res.render("template", { content: "Name and price are required." });
    }

    const products = getData();
    products.push({
    id: Date.now(),
    name,   //så inte alla tar bort anndras produkter
    price,
    owner: req.session.user
});

    saveData(products);
    res.redirect("/products");
});
```
Skapar en ny produkt. Först kontrolleras att användaren är inloggad. Produkten sparas med ett id och kopplas till den användare som skapade den.
***
## CREATE PRODUCT

```js
app.delete("/products/delete/:id", (req, res) => {
    if (!req.session.auth) {
        return res.render("template", { content: "You must be logged in to delete products." });
    }

    const id = req.params.id;
const products = getData();

const product = products.find(p => p.id == id);

if (!product) {
    return res.status(204).end();
}

if (product.owner !== req.session.user) {
    return res.status(204).end();
}

const filtered = products.filter(p => p.id != id);
saveData(filtered);
//^^så inte alla tar bort anndras produkter
    return res.status(200).end();;
});
```
Tar bort en produkt. Den kollar först att användaren är inloggad och att produkten tillhör den användaren. På så sätt kan man inte ta bort någon annans produkt.
***
## HOME-PUG

```pug
extends template.pug 

block content
  h1 HOME
    p=message
  if content 
    p=content

```
 den här sidan är startsidan. Den visar ett meddelande och eventuell information som skickas från servern, till exempel efter login eller registrering.

***
## TEMPLATE-PUG

```pug
doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport", content="width=device-width, initial-scale=1.0")
    title Cat Workshop

    script(src="https://unpkg.com/htmx.org@1.9.10")
    include style.pug

  body
    header
      h2 Cat Workshop 🐱
      include nav.pug

    main
      block content

    #create.section
      h2 Create Product
      form(action="/products/create", method="get")
        input(type="text", name="name", placeholder="Product name", required)
        input(type="text", name="price", placeholder="Price", required)
        input(type="submit", value="Create")

    #register.section
      h2 Register
      form(action="/register", method="post")
        input(type="text", name="username", placeholder="Username", required)
        input(type="password", name="password", placeholder="Password", required)
        input(type="submit", value="Register")

    #login.section
      h2 Login
      form(action="/login", method="post")
        input(type="text", name="username", placeholder="Username", required)
        input(type="password", name="password", placeholder="Password", required)
        input(type="submit", value="Login")
```
Den här filen är huvudmallen för hela sidan. Den innehåller layouten, navigationen och formulär för att skapa produkter, registrera och logga in. Andra sidor använder denna mall.
***
## NAVIGATION-PUG

```pug
nav
a(href="/") HOME
a(href="/products") PRODUCTS
a(href="#create") CREATE
a(href="#register") REGISTER
a(href="#login") LOGIN
a(href="/logout") LOGOUT
```
Den här delen är navigationen. Den innehåller länkar till olika delar av sidan, till exempel produkter, login och register.
***
## PRODUCTS-PUG

```pug
extends template.pug 

block content
  h1 Products
  p Here you can find all the cats in our database.

  #products
    each product in products
      div(class="products", id = "id_"+product.id)
        h3= product.name
        p Price: #{product.price}

        if product.owner === user
          a( href="#"
            hx-delete=`/products/delete/${product.id}`
            hx-target="#id_"+product.id
            hx-swap="outerHTML" 
          ) Delete
```
Den här sidan visar alla produkter. Den loopar igenom listan och visar namn och pris. Om användaren äger produkten visas en delete-knapp som använder HTMX för att ta bort produkten utan att ladda om sidan
***
## STYLE-PUG

```pug
style.
    * {
    box-sizing: border-box;
    margin: 0;
    font-family: system-ui, Arial, sans-serif;
    }
    body {
    background: #f4f4f4;
    color: #333;
    padding: 20px;
    }
    header {
    background: #222;
    color: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    }
    nav {
    margin-top: 10px;
    display: flex;
    gap: 15px;
    }
    nav a {
    color: #ddd;
    text-decoration: none;
    font-weight: bold;
    }
    nav a:hover {
    color: #fff;
    }
    main {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    .section {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    max-width: 600px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    h2 {
    margin-bottom: 15px;
    }
    input {
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 1rem;
    }
    input[type="submit"] {
    background: #ff7a18;
    border: none;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    }
    input[type="submit"]:hover {
    background: #e66a10;
    }
    hr {
    margin: 15px 0;
    }
    .section{
    display: none;
    }
    :target{
    display:block;
    }
    a{
    text-decoration:none;
    color:#303030;
    }
    .products{
    padding:3%;
    border:2px solid red;
    }
```
Den här filen innehåller CSS som styr hur sidan ser ut. Den bestämmer till exempel färger, layout, marginaler och typsnitt. Den används för att göra sidan mer användarvänlig och ge ett snyggare utseende.
***
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

//function render(content) {
  //  const html = fs.readFileSync("template.html").toString();
    //return html.replace("%content%", content);
//}

app.listen(port, () => {
    console.log("Lyssnar på port " + port);
});

app.get("/", (req, res) => {
    res.render("home", { message: "Home Page" }); //ändrat render-funktionen till att använda Pug istället
});

app.get("/cats", (req, res) => {
    res.render("cats"); //renderar cats.pug
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

    res.render("home", { message: "Registration successful. You can now log in." });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.render("template", { content: "Invalid username or password." });
    }

    req.session.auth = true;
    req.session.user = username;

    res.render("template", { content: `Welcome ${username}, you are now logged in.` });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.render("template", { content: "You are now logged out." });
    });
});

app.get("/products", (req, res) => {
    const products = getData();

    if (products.length === 0) {
        return res.render("home", { message: "No products yet." });
    }

    res.render("products", { products });
});

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
        name,
        price
    });

    saveData(products);
    res.redirect("/products");
});

app.get("/products/delete/:id", (req, res) => {
    if (!req.session.auth) {
        return res.render("template", { content: "You must be logged in to delete products." });
    }

    const id = req.params.id;
    const products = getData();

    const filtered = products.filter(p => p.id != id);
    saveData(filtered);

    res.redirect("/products");
});

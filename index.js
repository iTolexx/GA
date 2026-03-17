const express = require("express");
const app = express();
const port = process.env.PORT || 3400;
const escape = require("escape-html");
const session = require("express-session");
const fs = require("fs");

app.use(express.urlencoded({ extended: true }));
// a comment
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    })
);

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

function render(content) {
    const html = fs.readFileSync("template.html").toString();
    return html.replace("%content%", content);
}

app.listen(port, () => {
    console.log("Lyssnar på port " + port);
});

app.get("/", (req, res) => {
    res.send(render("<h2>Cats for sale here</h2>"));
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send(render("Please fill in both fieldss."));
    }

    const users = getUsers();

    if (users.find(u => u.username == username)) {
        return res.send(render("User already exists."));
    }

    users.push({ username, password });
    saveUsers(users);

    res.send(render("Registration successful. You can now log in."));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.send(render("Invalid username or password."));
    }

    req.session.auth = true;
    req.session.user = username;

    res.send(render(`Welcome ${username}, you are now logged in.`));
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.send(render("You are now logged out."));
    });
});

app.get("/products", (req, res) => {
    const products = getData();

    if (products.length === 0) {
        return res.send(render("No products yet."));
    }
    //loopar produktens och visar dem
    const html = products.map(p => `
            <div>
                <h3>${escape(p.name)}</h3>
                <p>Price: ${escape(p.price)}</p>
                <a href="/products/delete/${p.id}">Delete</a>
            </div>
        `)
        .join("<hr>");

    res.send(render(html));
});

app.get("/products/create", (req, res) => {
    if (!req.session.auth) {
        return res.send(render("You must be logged in to create a product."));
    }

    const { name, price } = req.query;

    if (!name || !price) {
        return res.send(render("Name and price are required."));
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
        return res.send(render("You must be logged in to delete products."));
    }

    const id = req.params.id;
    const products = getData();

    const filtered = products.filter(p => p.id != id);
    saveData(filtered);

    res.redirect("/products");
});

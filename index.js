const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
const sequelize = new Sequelize('pet_hospital', 'root2', 'root2', {
  host: 'localhost',
  dialect: 'mysql'
});

const bcrypt = require('bcrypt');

// Define model
const Owner = sequelize.define('Owner', {
    owner_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  first_name: DataTypes.STRING,
  last_name: DataTypes.STRING,
  phone_number: DataTypes.STRING,
  email: DataTypes.STRING
}, {timestamps: false});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Configure Passport authentication strategy
passport.use(new LocalStrategy(
  async function(username, password, done) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (e) {
      return done(e);
    }
  }
));

// Configure Passport persistent login sessions
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error);
    });
});

const session = require('express-session');

app.use(session({ secret: 'secret key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }
  

  

// Enable urlencoded for parsing post requests
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.render(__dirname + '/views/index.ejs');
});

app.get('/profile', ensureAuthenticated, (req, res) => {
    // The user is authenticated, so you can render the profile page
    res.render('profile', { user: req.user });
  });

// Route to display owners
app.get('/owners', (req, res) => {
  Owner.findAll()
    .then(owners => {
      res.render('owners', { owners });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error occurred while retrieving owners");
    });
});

// Route to display form to add owner
app.get('/add-owner', (req, res) => {
    res.render('add-owner');
  });
  
  // Route to handle form submission
  app.post('/add-owner', (req, res) => {
    const { first_name, last_name, phone_number, email } = req.body;
    
    // Create and save new owner
    Owner.create({ first_name, last_name, phone_number, email })
      .then(() => {
        res.redirect('/owners');
      })
      .catch(err => {
        console.error(err);
        res.status(500).send("Error occurred while adding owner");
      });
  });

  app.get('/owners/edit/:id', (req, res) => {
    const id = req.params.id;
  
    Owner.findByPk(id)
      .then(owner => {
        if (owner) {
          res.render('edit-owner', { owner });
        } else {
          res.status(404).send('Owner not found');
        }
      })
      .catch(err => {
        console.error(err);
        res.status(500).send("Error occurred while retrieving owner");
      });
  });

  app.post('/owners/edit/:id', (req, res) => {
    const owner_id = req.params.id;
    const { first_name, last_name, phone_number, email } = req.body;
  
    Owner.update({ first_name, last_name, phone_number, email }, 
        { where: { owner_id } })
      .then(() => {
        res.redirect('/owners');
      })
      .catch(err => {
        console.error(err);
        res.status(500).send("Error occurred while updating owner");
      });
  });
  
  app.delete('/owners/:id', (req, res) => {
    const id = req.params.id;
  
    Owner.destroy({ where: { id } })
      .then(() => {
        res.status(200).send('Owner deleted successfully');
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error occurred while deleting owner');
      });
  });

  app.get('/register', async (req, res) => {
    res.render('register');
});

app.get('/login', async (req, res) => {
    res.render('login');
});

app.get('/logout', ensureAuthenticated, function(req, res){
    req.logout(function(err) {
        if (err) {
            // handle error here
            console.error(err);
            return res.status(500).json({ message: "Logout failed." });
        }
        return res.redirect('/');
    });
});


const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING
  }, { timestamps: false });

  app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

  
app.post('/register', async (req, res) => {
try {
const hashedPassword = await bcrypt.hash(req.body.password, 10);

await User.create({
    username: req.body.username,
    password: hashedPassword,
    email: req.body.email,
    first_name: req.body.first_name,
    last_name: req.body.last_name
  });

res.redirect('/login');
} catch (e) {
console.log(e);
res.redirect('/register');
}
});

//rest api - get
app.get('/api/owners', async function (req,res){
    try {
       const [owners] = await sequelize.query('SELECT * FROM owners');
       res.json({
         owners
       });
    } catch (err) {
      console.error(err);
      res.status(500).json({'error': 'Internal Server Error'});
    }
   })

//rest api - post
   app.post('/api/owners', async function(req,res){
    try {
     const { first_name, last_name, phone, email } = req.body;
     const [results] = await sequelize.query('INSERT INTO owners (first_name, last_name, phone, email) VALUES (?, ?, ?,?)', 
     [first_name, last_name, phone, email]);
     res.json({
      'insertId':results.insertId
    })
   } catch (err) {
       console.error(err);
         res.status(500).json({'error':'Internal Server Error'});
     }
   })
   

app.listen(3000, () => {
  console.log('App listening on port 3000');
});
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';
import dotenv from 'dotenv';
import { router } from './registration.js';
import { router as adminRouter } from './admin.js';

import { findByUsername, findById, comparePasswords } from './login.js';

dotenv.config();

const app = express();

const {
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
  DATABASE_URL: databaseUrl,
} = process.env;

if (!sessionSecret || !databaseUrl) {
  console.error('Missing .env values');
  process.exit(1);
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
}));

async function strat(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    const result = await comparePasswords(password, user.password);

    return done(null, result ? user : null);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

passport.use(new Strategy(strat));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(passport.initialize());
app.use(passport.session());

app.set('views', './views');
app.set('view engine', 'ejs');

function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  let message = '';

  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { message });
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/admin');
  },
);

app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }

  return next();
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.use('/', router);
app.use('/admin', ensureLoggedIn, adminRouter);

function notFoundHandler(req, res, next) { // eslint-disable-line
  const title = 'Síða finnst ekki';
  const subtitle = 'Engin síða fannst fyrir þessa slóð.';
  res.status(404).render('error', { title, subtitle });
}

function errorHandler(err, req, res, next) { // eslint-disable-line
  const title = 'Villa kom upp';
  const subtitle = err.message;
  res.status(500).render('error', { title, subtitle });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});

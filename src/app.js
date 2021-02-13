import express from 'express';
import dotenv from 'dotenv';
import { router } from './registration.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const app = express();

app.use(express.urlencoded({ extended: true }));

// TODO setja upp rest af virkni!
app.set('views', './views');
app.set('view engine', 'ejs');

app.use('/', router);

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

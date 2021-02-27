import express from 'express';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import { insert, select } from './db.js';
import { getDate } from './utils.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

// TODO skráningar virkni
export const router = express.Router();

const nationalIdRegExp = '^[0-9]{6}-?[0-9]{4}$';

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function getSignatures(offset = 0, limit = 50) {
  const signatures = [];
  const result = await select(offset, limit);

  result.rows.forEach((row) => {
    const {
      name = '',
      comment = '',
      signed = '',
    } = row;

    const str = JSON.stringify(signed);

    const date = getDate(str);

    signatures.push({ name, comment, date });
  });

  return signatures;
}

async function signature(req, res, next) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);

  const data = {
    name: '',
    nationalId: '',
    comment: '',
    anonymous: '',
    errorMessages: [],
    signatures: [],
  };

  const result = {
    _links: {
      self: {
        href: `http://localhost:${port}/?offset=${offset}&limit=${limit}`,
      },
    },
    data,
  };

  try {
    const signatures = await getSignatures(offset, limit);
    data.signatures = signatures;
  } catch (err) {
    console.error(err);
    return next();
  }

  if (offset > 0) {
    result._links.prev = {
      href: `http://localhost:${port}/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (data.signatures.length <= limit) {
    result._links.next = {
      href: `http://localhost:${port}/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  return res.render('index', result);
}

async function signaturePost(req, res) {
  // Destructure data from req
  const {
    name = '',
    nationalId = '',
    comment = '',
    anonymous = '',
  } = req.body;

  const errors = validationResult(req);
  let errorMessages = [];

  if (!errors.isEmpty()) {
    // Senda errors yfir
    errorMessages = errors.array().map((i) => i.msg);
  }

  const data = {
    name,
    nationalId,
    comment,
    anonymous,
    errorMessages,
  };

  if (anonymous) {
    data.name = 'Nafnlaust';
  }

  const result = await insert(data);

  if (result === null) {
    return res.render('databaseError');
  }

  return res.redirect('/');
}

async function getErrors(req, res, next) {
  const {
    name = '',
    nationalId = '',
    comment = '',
    anonymous = '',
  } = req.body;

  const errors = validationResult(req);
  let errorMessages = [];

  const data = {
    name,
    nationalId,
    comment,
    anonymous,
  };

  if (!errors.isEmpty()) {
    // Senda errors yfir
    errorMessages = errors.array().map((i) => i.msg);
    data.errorMessages = errorMessages;
    data.signatures = await getSignatures();

    return res.render('index', data);
  }

  return next();
}

const validate = [
  // TODO: Validate incoming data from POST.
  body('name')
    .isLength({ min: 1, max: 128 })
    .withMessage('Nafn má ekki vera tómt.'),
  body('name')
    .isLength({ max: 128 })
    .withMessage('Nafn má að hámarki vera 128 stafir.'),
  body('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('nationalId')
    .matches(new RegExp(nationalIdRegExp))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
  body('comment')
    .isLength({ max: 400 })
    .withMessage('Athugasend má að hámarki vera 400 stafir.'),
];

const sanitize = [
  body('name').trim().escape(),
  body('nationalId').blacklist('-'),
  body('comment').trim().escape(),
  body('anonymous').toBoolean(),
];

router.get('/', catchErrors(signature));

router.post('/', validate, getErrors, sanitize, catchErrors(signaturePost));

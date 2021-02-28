import express from 'express';
import { numOfSignatures, deleteRow } from './db.js';
import { getSignatures } from './registration.js';

export const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function adminPage(req, res, next) {
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
    offset,
    limit,
    numSigs: null,
  };

  try {
    const signatures = await getSignatures(offset, limit);
    data.signatures = signatures;
  } catch (err) {
    console.error(err);
    return next();
  }

  try {
    const result = await numOfSignatures();
    data.numSigs = result.count;
  } catch (err) {
    console.error(err);
    return next();
  }

  return res.render('admin', data);
}

async function deleteSignature(req, res) {
  if (!req.isAuthenticated) {
    res.redirect('/login');
  }

  const { id } = req.body;

  try {
    const result = await deleteRow(id);
    if (result) {
      return res.redirect('/admin');
    }
  } catch (err) {
    console.error('Error when deleting signature.');
  }

  return res.render('error', {
    title: 'Villa við að eyða',
    subtitle: '',
  });
}

router.get('/', catchErrors(adminPage));
router.post('/delete', catchErrors(deleteSignature));

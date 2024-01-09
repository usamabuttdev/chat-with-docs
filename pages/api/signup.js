import Cookies from 'cookies';
import { sign } from 'jsonwebtoken';
import clientPromise from '../../lib/mongodb';
const { createHash } = require('node:crypto');

export default async function handler(req, res) {
  if (req.method == 'POST') {
    const username = req.body['username'];
    const email = req.body['email'];
    const password = req.body['password'];
    const passwordagain = req.body['passwordagain'];
    if (password != passwordagain) {
      res.redirect("/signup?msg=The two passwords don't match");
      return;
    }
    const client = await clientPromise;
    const db = client.db('Users');
    const users = await db
      .collection('Profiles')
      .find({ $or: [{ Username: username }, { Email: email }] })
      .toArray();
    if (users.length > 0) {
      res.redirect('/signup?msg=A user already exist with this email/username');
      return;
    }
    const password_hash = createHash('sha256').update(password).digest('hex');
    const currentDate = new Date().toUTCString();
    const bodyObject = {
      Username: username,
      Email: email,
      Password: password_hash,
      Created: currentDate,
    };
    const user = await db.collection('Profiles').insertOne(bodyObject);
    const cookies = new Cookies(req, res);
    const token = sign(
      { id: user?.insertedId },
      process.env.NEXT_PUBLIC_SECRET_KEY,
      {
        expiresIn: '24h',
      },
    );

    cookies.set('token', token, {
      maxAge: 24 * 60 * 60 * 1000, // 1 hour in milliseconds
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
    res.redirect('/');
  } else {
    res.redirect('/');
  }
}

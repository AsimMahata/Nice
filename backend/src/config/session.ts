import MongoStore from 'connect-mongo';
import { SessionOptions } from 'express-session';

const secret = process.env.SESSION_SECRET || 'thisshouldbeabettersecret!';
const dbUrl = process.env.MONGO_URI ;

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
      secret: secret
  }
});

const sessionConfig:SessionOptions={
  store,
  name:'session',
  secret:secret,
  resave: false,
  saveUninitialized: true,
  cookie:{
    secure: false,// TODO Set to true only if using HTTPS (production)
    httpOnly: true,
    expires: new Date(Date.now()+ 1000*60*60*24*30),
    maxAge: 1000*60*60*24*30,
    sameSite: 'lax'
  }
};


export default sessionConfig;
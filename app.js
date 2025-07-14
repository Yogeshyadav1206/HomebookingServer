require('dotenv').config();
const DB_PATH=process.env.DB_PATH;
console.log(DB_PATH);
// Core Module
const path = require("path");
const session = require("express-session");
const cors = require('cors');

const MongoDBStore = require("connect-mongodb-session")(session); 
// External Module
const express = require("express");
const { default: mongoose } = require("mongoose");
const multer  = require('multer')

//Local Module
const userRouter = require("./routes/userRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorcontroller = require("./controllers/error");

const app = express();
app.use(express.json()); 


app.set("view engine", "ejs");
app.set("views", "views");



const storage = multer.diskStorage({
  destination: (req, file, cb) =>  {
    cb(null, "uploads/");
  }, filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
})
// backend check for file so thing is that ki frontend se to humne  only jpeg type ki file pass krayi h but vo bypass hokti h to backend pe bi check lgana pdega 

const fileFilter = (req, file, cb) => {
  // accept only jpeg and png files
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'|| file.mimetype === 'image/jpg') {
    cb(null, true); // accept the file
  }
  else {
    cb(null, false); // reject the file
  }
}
const multerOptions = {
  storage,
  fileFilter, 
}
app.use(cors({
  origin: "https://homebooking-client.vercel.app",
  credentials: true
}));
app.use(multer(multerOptions).single('photo')); // for handling multipart/form-data, which is used for file uploads
app.use(express.urlencoded({ extended: true })); // for handling form data in the request body
app.use(express.static(path.join(rootDir, "public")));
// all these are used when client call for images then yha se image send hogi as binary data
app.use('/uploads', express.static(path.join(rootDir, 'uploads'))); // for serving static files from the uploads folder
app.use('/host/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/homelist/uploads', express.static(path.join(rootDir, 'uploads')));

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions' // name of the collection where sessions will be stored
});


//ye part session ko memory me store kr rha h jse hi koi change hota h to server restart hota hand memory reinitialize hoti h to session expire hp jata h to avoid this we store the session in mongoDB
app.use(session({
  //secret key used to sign in the sessionId cookie and encrypt sesssion data
  secret:'secret key',
  //forces the session to be saved back to the session store, even if the session was never modified during the request
  resave:false,
  //forces a session that is "uninitialized" to be saved to the store
  saveUninitialized:true,
  store: store, // by passing store ow it will store our sessins in db instead of memory
  cookie: {
    sameSite: 'none', // Required for cross-site cookies
    secure: true      // Required for HTTPS
  }
}));



app.use((req,res,next)=>{
  req.isLoggedIn=req.session.isLoggedIn;
  // console.log("isLoggedIn",req.isLoggedIn);
  next();
})


app.use(authRouter);
// isme bi middleware se check lga skte h ki jo log in vhi userrouter ko access kr ske but fir hum default page nhi dikha payege so ise koi bi acess kr skta h 
app.use("/", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

app.use(userRouter);
// /host ki koi bi req aayege agr usme islgin true h to hi use next app.use("/host", hostRouter); pe leke jana else redirect kr dena yhi se 
app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

app.use("/host", hostRouter);
app.use(errorcontroller.error);

const PORT = 4003;


mongoose.connect(DB_PATH).then(()=>{
  console.log("mongoose connected");
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err=>{
  console.log(err);
})

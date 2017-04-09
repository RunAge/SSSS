const express = require('express');
const debug = require('debug')('SSSS:index');
const http = require('http'); // If you want use https change http to https and add lines with crt and key
const multer  = require('multer');
const fs = require('fs');
//const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/ss/'); // place where server saving files
  },
  filename: function (req, file, cb) {
    // [Timestamp in ms]-[Filename] ex. 124141241-Nier.png
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Removing files older then 2h
fileCleaner();
setInterval(() => {fileCleaner()}, 60 * 60 * 1000);

const config = {
  port: '3000',
  ifaces: '127.0.0.1', // for any set 0.0.0.0 or undefined without ''
  domain: 'ss.kamide.re', // domain
  origin: 'ss.kamide.re',
  allowedExt: ['png', 'apng', 'jpg', 'jpeg', 'webp', 'webm', 'bmp', 'gif'],
  maxUploadSize: 20 * 1024 * 1024,
  authkey: '' // keyboard cat
}

const upload = multer({ storage: storage, limits: {fileSize: config.maxUploadSize, fileFilter: fileFilter }});
const app = express();
const accessLogStream = fs.createWriteStream(`${__dirname}/access.log`, {flags: 'a'})

app.use(require('morgan')('combined', {stream: accessLogStream}));
app.use(express.static('public'));
app.use(require('cors')({
  origin: config.origin,
  optionsSuccessStatus: 200
}));

app.get('/', (req, res) => res.sendFile(__dirname, 'index.html'));
app.post('/up', authorizator, upload.single('file'), (req, res, next) => {
  if(!next.pass) res.end();
  // If you use SSL change http to https
  res.json({url: `http://${config.domain}/ss/${req.file.filename}`});
});

let server = http.createServer(app);
server.listen(config.port, config.ifaces);

server.on('listening', () => {
  debug(`Server listening on ${config.ifaces || '0.0.0.0'}:${config.port}`);
});

let unauthorizedResponds = [
  "No chyba nie cwelu!",
  "Czy coś cie boli?",
  "Spróbuj jeszcze raz!",
  "Emm... Dzien Dobry!",
  "Nie lubie cie!",
  "FOCH z przytupem",
  "Moze w coś zagramy?",
  "Ale jesteś glupi.",
  "Ojoj link spadł z rowerka.",
  "FORAMTTTTTT!!!!!",
  "rm -rf / polecam",
];

function authorizator(req, res, next){
  if(!req.headers.uploadauthkey || req.headers.uploadauthkey !== config.authkey){
    res.set("Connection", "close");
    // If authkey is missmatch server will respond with one unauthorizedResponds as url
    return res.json({url: unauthorizedResponds[Math.floor(Math.random() * unauthorizedResponds.length)]});
    next.pass = false;
  }
  next.pass = true;
  next();
}

function fileFilter(req, file, cb){
  config.allowedExt.forEach(function(ext) {
    if (!file.originalname.toLowerCase().endsWith(ext)) {
      return cb(new Error('Banned file'), false);
    };
    return cb(null, true);
  });
}

function fileCleaner() {
  fs.readdirSync(`${__dirname}/public/ss/`).forEach(file => {
    let fileDate = file.substr(0,file.indexOf('-'))
    debug("fileDate:", Number(fileDate)+ 24 * 60 * 60 * 1000, " nowDate:", Date.now())
    if(Number(fileDate)+ 24 * 60 * 60 * 1000 < Date.now()) {
      debug('File unlink', true);
      fs.unlinkSync(`${__dirname}/public/ss/${file}`);
    };
  });
}

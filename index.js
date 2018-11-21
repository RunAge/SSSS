const express = require('express');
const debug = require('debug')('SSSS:index');
const http = require('http'); // If you want use https change http to https and add lines with crt and key
const multer  = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/ss/'); // place where server saving files
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // [Timestamp in ms]-[Filename] ex. 124141241-Nier.png
  }
});

// Removing files older then 24h
fileCleaner();
setInterval(() => {fileCleaner()}, 60 * 60 * 1000);

const config = {
  port: '3000',
  ifaces: '127.0.0.1', // for any set 0.0.0.0 or undefined without ''
  domain: 'ss.kamide.re', // domain
  origin: 'ss.kamide.re',
  allowedExt: ['png', 'apng', 'jpg', 'jpeg', 'webp', 'webm', 'bmp', 'gif'],
  maxUploadSize: 20 * 1024 * 1024,
  authkey: '123' // keyboard cat
}

const upload = multer({ storage,
                        limits: {
                          fileSize: config.maxUploadSize, 
                          fileFilter
                        }
                      });
const app = express();

app.use(express.static('public'));
app.use(require('cors')({
  origin: config.origin,
  optionsSuccessStatus: 200
}));

app.get('/', (req, res) => res.sendFile(__dirname, 'index.html'));
app.post('/up', authenticator, upload.single('file'), (req, res) => {
  // If you use SSL change http to https
  res.json({url: `http://${config.domain}/ss/${req.file.filename}`});
});

let server = http.createServer(app);
server.listen(config.port, config.ifaces);

server.on('listening', () => {
  debug(`Server listening on ${config.ifaces || '0.0.0.0'}:${config.port}`);
});

let unauthorizedResponds = [
  "Czy coś cie boli?",
  "Spróbuj jeszcze raz!",
  "Emm... Dzien Dobry!",
  "Nie lubie cie!",
  "FOCH z przytupem",
  "Moze w coś zagramy?",
  "Ojoj link spadł z rowerka.",
  "FORAMTTTTTT!!!!!",
  "rm -rf / polecam",
];

function authenticator(req, res, next){
  if(!req.headers.uploadauthkey || req.headers.uploadauthkey !== config.authkey){
    res.set("Connection", "close");
    // If authkey is missmatch server will respond with one unauthorizedResponds as url
    return res.json({url: unauthorizedResponds[Math.floor(Math.random() * unauthorizedResponds.length)], code: 401});
  }
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

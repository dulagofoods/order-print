const app = require('express')();
const http = require('http').Server(app);


app.get('/public', function (req, res) {
  res.send('<h1>hello</h1>');
});

http.listen(3000, () => {
  console.log('listening');
});
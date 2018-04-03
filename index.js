const app = require("express")();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const printer = require('node-thermal-printer');

printer.init({
  type: 'epson',
  interface: '/dev/usb/lp1',
  width: 46,
  characterSet: 'SLOVENIA',
  removeSpecialCharacters: true,
  replaceSpecialCharacters: true,
  extraSpecialCharacters: {
    "à": 133,
    "À": 133,
    "á": 160,
    "Á": 160,
    "é": 130,
    "É": 130,
    "í": 161,
    "Í": 161,
    "ó": 162,
    "Ó": 162,
    "ú": 163,
    "Ú": 163,
    "ã": 97,
    "Ã": 97,
    "õ": 111,
    "Õ": 111,
    "â": 131,
    "Â": 131,
    "ê": 110,
    "Ê": 69,
    "ô": 147,
    "Ô": 147,
  }
});

printer.isPrinterConnected(function (isConnected) {
  console.log('The printer is connected');
  printer.print('->\n');
  printer.execute();
});

server.listen(3000);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
});

function floatToBRL(number, isCurrency) {

  if (isCurrency) {
    return parseFloat(number).toFixed(2).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      style: 'currency',
      currency: 'BRL'
    }).replace(/\s/g, '');
  } else {
    return parseFloat(number).toFixed(2).toLocaleString('pt-BR').replace(/\s/g, '');
  }

}

io.on('connection', function (socket) {
  console.log('user connected');
  socket.on('hello', msg => {
    console.log(msg);
    // printer.println(msg);
    // printer.execute();
  });
  socket.on('cut paper', state => {
    console.log('cut paper');
    if (state)
      printer.cut();
    printer.execute();
  });
  socket.on('print order', order => {
    console.log(order);
    if (order) {

      printer.setTypeFontA();

      printer.alignCenter();
      printer.printImage('./assets/DuLagoLogo-compact-black.min.png', function (done) {
        printer.alignCenter();
        printer.newLine();
        printer.bold(true);
        printer.println('MARMITARIA DU LAGO');
        printer.bold(false);
        printer.setTextNormal();
        printer.println('Rua Benjamin Caetano Zanbom, 988');
        printer.println('Bandeirantes - PR');
        printer.println('(43) 3542-0021');
        printer.newLine();

        printer.println('------------------------------------------------');
        printer.alignLeft();
        printer.newLine();

        printer.setTextDoubleHeight();

        // consumer name
        printer.print('Cliente: ');
        printer.bold(true);
        printer.print(order.consumerName);
        printer.bold(false);
        printer.newLine();
        printer.newLine();

        // table header
        printer.tableCustom([
          {
            text: 'Item',
            align: 'LEFT',
            width: .8
          },
          {
            text: 'Total',
            align: 'LEFT',
            width: .2
          }
        ]);

        let orderItems = Object.values(order.items);
        orderItems.forEach(orderItem => {
          // table content
          printer.tableCustom([
            {
              text: orderItem.quantity + '-' + orderItem.itemName + ' (' + orderItem.itemPrice + ')',
              align: 'LEFT',
              width: .8,
              bold: true
            },
            {
              text: floatToBRL(orderItem.itemPrice * orderItem.quantity),
              align: 'LEFT',
              width: .2
            }
          ]);

          if (orderItem.note)
            printer.println('  ' + orderItem.note.replace(/\n/g, '\n  '));

        });

        printer.setTextNormal();
        printer.println('------------------------------------------------');
        printer.setTextDoubleHeight();
        printer.tableCustom([
          {
            text: 'Total:  ',
            align: 'RIGHT',
            width: .8
          },
          {
            text: floatToBRL(order.priceAmount, true),
            align: 'LEFT',
            bold: true,
            width: .2
          }
        ]);
        printer.tableCustom([
          {
            text: 'Troco p:  ',
            align: 'RIGHT',
            width: .8
          },
          {
            text: floatToBRL(order.changeOption, true),
            align: 'LEFT',
            bold: true,
            width: .2
          }
        ]);

        printer.newLine();
        printer.println('Retirada: AQUI');

        printer.cut();
        printer.execute();

      });

    }

  });
});
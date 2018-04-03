const app = require("express")();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const printer = require('node-thermal-printer');

printer.init({
  type: 'epson',
  interface: '/dev/usb/lp1',
  width: 46
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
    // console.log(order);
    if (order) {

      printer.setTypeFontA();

      printer.alignCenter();
      printer.bold(true);
      printer.println('MARMITARIA DU LAGO');
      printer.bold(false);
      printer.setTextNormal();
      printer.println('Rua Benjamin Caetano Zanbom, 988');
      printer.println('Bandeirantes - PR');
      printer.println('(43) 3542-0021');
      printer.newLine();

      printer.println('------------------------------------------------');
      printer.newLine();
      printer.alignLeft();

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
            text: orderItem.quantity + '-' + orderItem.itemName + ' (R$' + orderItem.itemPrice + ')',
            align: 'LEFT',
            width: .8,
            bold: true
          },
          {
            text: 'R$' + (orderItem.itemPrice * orderItem.quantity) + ',00',
            align: 'LEFT',
            width: .2
          }
        ]);

      })
    }

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
        text: 'R$' + order.priceAmount,
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
        text: 'R$' + order.orderChange,
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
});
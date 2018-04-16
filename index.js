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

function toFloat(number) {

  try {

    return parseFloat(number);

  } catch (e) {

    console.log('erro com parse');

    return 0;

  }

}

function floatToBRL(number, isCurrency) {

  try {

    if (isCurrency) {
      return parseFloat(number).toFixed(2).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        style: 'currency',
        currency: 'BRL'
      }).replace(/\s/g, '');
    } else {
      return parseFloat(number).toFixed(2).toLocaleString('pt-BR').replace(/\s/g, '');
    }

  } catch (e) {

    console.log('problema no ParseFloat');

    return parseFloat('0').toFixed(2).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      style: 'currency',
      currency: 'BRL'
    }).replace(/\s/g, '');

  }

}

const server = require('http').createServer();
const io = require('socket.io')(server);

server.listen(8080);

io.on('connection', function (socket) {

  console.log('user connected');

  socket.on('print order', order => {
    console.log(order.customer);
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

        printer.println('------------------------------------------------');
        printer.newLine();
        printer.alignLeft();

        // consumer name
        if (order.customer)
        if (order.customer.customerName) {
          printer.setTextDoubleHeight();
          printer.print('Cliente: ');
          printer.bold(true);
          printer.print(order.customer.customerName);
          printer.setTextNormal();
          printer.bold(false);
          printer.newLine();
        }

        // delivery time
        if (order.deliveryTime) {

          printer.setTextDoubleHeight();
          printer.print(!!order.delivery ? 'Entrega: ' : 'Retirada: ');
          printer.bold(true);
          printer.print(order.deliveryTime);

          if (!order.delivery)
            printer.print(' (AQUI)');

          printer.setTextNormal();
          printer.bold(false);
          printer.newLine();

        } else {

          printer.setTextDoubleHeight();
          printer.print(!!order.delivery ? 'Entrega: ' : 'Retirada: ');
          printer.bold(true);
          printer.print(!order.delivery ? 'AQUI' : '???');
          printer.setTextNormal();
          printer.bold(false);
          printer.newLine();

        }

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

        // order items
        if (order.items) {

          printer.setTextDoubleHeight();

          let orderItems = Object.values(order.items);
          orderItems.forEach(orderItem => {

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

            if (orderItem.note) {
              printer.setTextNormal();
              printer.println('  ' + orderItem.note.replace(/\n/g, '\n  '));
              printer.setTextDoubleHeight();
            }

          });

        }

        if (order.billing) {

          printer.setTextNormal();
          printer.println('------------------------------------------------');

          // priceAmount
          if (order.billing.priceAmount) {

            if (order.billing.payments)
              if (Object.values(order.billing.payments).length === 1) {
                printer.tableCustom([
                  {
                    text: 'Total:  ',
                    align: 'RIGHT',
                    width: .8
                  },
                  {
                    text: floatToBRL(order.billing.priceAmount, true),
                    align: 'LEFT',
                    bold: true,
                    width: .2
                  }
                ]);
              } else {
                printer.tableCustom([
                  {
                    text: 'Total:  ',
                    align: 'RIGHT',
                    width: .65
                  },
                  {
                    text: floatToBRL(order.billing.priceAmount, true),
                    align: 'LEFT',
                    bold: true,
                    width: .35
                  }
                ]);
              }

          }

          // payments
          if (order.billing.payments) {
            printer.newLine();
            let orderItems = Object.values(order.billing.payments);
            orderItems.forEach(orderPaymentItem => {

              if (orderPaymentItem.method === 'money') {

                if (orderPaymentItem.isDefault) {

                  printer.tableCustom([
                    {
                      text: 'Pago (Dinheiro):  ',
                      align: 'RIGHT',
                      width: .8
                    },
                    {
                      text: floatToBRL(orderPaymentItem.paidValue, true),
                      align: 'LEFT',
                      bold: true,
                      width: .2
                    }
                  ]);

                } else {

                  printer.tableCustom([
                    {
                      text: 'Pago (Dinheiro):  ',
                      align: 'RIGHT',
                      width: .65
                    },
                    {
                      text: floatToBRL(orderPaymentItem.paidValue, true) + '->' + floatToBRL(orderPaymentItem.referenceValue, true),
                      align: 'LEFT',
                      bold: true,
                      width: .35
                    }
                  ]);

                }

                printer.tableCustom([
                  {
                    text: 'Troco:  ',
                    align: 'RIGHT',
                    width: .65
                  },
                  {
                    text: floatToBRL(toFloat(orderPaymentItem.paidValue) - toFloat(orderPaymentItem.referenceValue), true),
                    align: 'LEFT',
                    bold: true,
                    width: .35
                  }
                ]);


              } else if (orderPaymentItem.method === 'card') {

                if (orderPaymentItem.isDefault) {

                  printer.tableCustom([
                    {
                      text: 'Pago (Cartão):  ',
                      align: 'RIGHT',
                      width: .8
                    },
                    {
                      text: floatToBRL(orderPaymentItem.paidValue, true),
                      align: 'LEFT',
                      bold: true,
                      width: .2
                    }
                  ]);

                } else {

                  printer.tableCustom([
                    {
                      text: 'Pago (Cartão):  ',
                      align: 'RIGHT',
                      width: .65
                    },
                    {
                      text: floatToBRL(orderPaymentItem.paidValue, true) + '->' + floatToBRL(orderPaymentItem.referenceValue, true),
                      align: 'LEFT',
                      bold: true,
                      width: .35
                    }
                  ]);

                }

              } else if (orderPaymentItem.method === 'paid') {

                if (orderPaymentItem.isDefault) {

                  printer.tableCustom([
                    {
                      text: 'Pago:  ',
                      align: 'RIGHT',
                      width: .8
                    },
                    {
                      text: 'PAGO',
                      align: 'LEFT',
                      bold: true,
                      width: .2
                    }
                  ]);

                } else {

                  printer.tableCustom([
                    {
                      text: 'Pago (desconto):  ',
                      align: 'RIGHT',
                      width: .65
                    },
                    {
                      text: floatToBRL(orderPaymentItem.paidValue, true),
                      align: 'LEFT',
                      bold: true,
                      width: .35
                    }
                  ]);

                }

              } else if (orderPaymentItem.method === 'gift') {

                if (orderPaymentItem.isDefault) {

                  printer.tableCustom([
                    {
                      text: 'Pago:  ',
                      align: 'RIGHT',
                      width: .8
                    },
                    {
                      text: 'CORTESIA',
                      align: 'LEFT',
                      bold: true,
                      width: .2
                    }
                  ]);

                } else {

                  printer.tableCustom([
                    {
                      text: 'Pago (cortesia):  ',
                      align: 'RIGHT',
                      width: .65,
                      bold: true
                    },
                    {
                      text: floatToBRL(orderPaymentItem.paidValue, true),
                      align: 'LEFT',
                      bold: true,
                      width: .35
                    }
                  ]);

                }

              }

            });

          } else {

            printer.alignCenter();
            printer.println('VERIFICAR DADOS DE PAGAMENTO \n COM O ATENDIMENTO');
            printer.alignLeft();

          }

        }

        // delivery
        if (order.delivery) {

          printer.setTextNormal();
          printer.bold(false);
          printer.println('------------------------------------------------');

          try {

            printer.newLine();

            if (order.address) {

              printer.alignLeft();

              if (order.address.street) {
                printer.print('Endereço: ');
                if (order.address.street.length > 28) printer.print('\n  ');
                printer.print(order.address.street);
                if (order.address.houseNumber)
                  printer.print(', ' + order.address.houseNumber);
                printer.newLine();
              }

              if (order.address.neighborhood) {
                printer.print('Bairro: ');
                printer.print(order.address.neighborhood);
                printer.newLine();
              }

              if (order.address.addressReference) {
                printer.print('Referência: ');
                printer.print(order.address.addressReference);
                printer.newLine();
              }

            } else {

              printer.println('ENTREGA (FALTA ENDEREÇO)');

            }

          } catch (e) {

            console.log('eita.. houve algum erro tentando imprimir o endereço');

          }

          printer.newLine();

        } else {

          printer.println('------------------------------------------------');
          printer.newLine();
          printer.setTextDoubleHeight();
          printer.bold(true);
          printer.println('Retirada: AQUI');
          printer.bold(false);
          printer.setTextNormal();

        }

        printer.cut();
        printer.execute();

      });

    }
  });
});
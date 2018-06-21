const socket = require('socket.io-client')('https://socket.btcmarkets.net', {secure: true, transports: ['websocket'], upgrade: false})

const pairs = process.env.PAIRS || 'XRP-AUD,BTC-AUD,BCH-AUD,ETC-AUD,ETH-AUD,LTC-AUD,LTC-BTC,ETC-BTC,BCH-BTC,ETH-BTC,XRP-BTC'
const dbhost = process.env.DBHOST || 'marketdatadb'
const dbport = '8086'
const dbname = 'ticks'

socket.on('connect', function() {
  pairs.split(",").forEach(element => {
    let channel = `Ticker-BTCMarkets-${element}`
    console.log(`Joining channel ${channel}`)
    socket.emit('join', `${channel}`)
  });
});

socket.on('newTicker', function(data) {
  console.log(`tick,exchange=btcmarkets,instrument=${data.instrument},currency=${data.currency} bid=${data.bestBid},ask=${data.bestAsk},price=${data.lastPrice} ${data.timestamp}`)
});

socket.on('disconnect', function() {
  console.log(`Disconnected from BTC Markets...`)
});
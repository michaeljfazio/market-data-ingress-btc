const Socket = require('socket.io-client')
const InfluxDB = require('influx')

const api = "https://socket.btcmarkets.net"
const pairs = process.env.PAIRS || 'XRP-AUD,BTC-AUD,BCH-AUD,ETC-AUD,ETH-AUD,LTC-AUD,LTC-BTC,ETC-BTC,BCH-BTC,ETH-BTC,XRP-BTC'
const dbhost = process.env.DBHOST || 'localhost:8086'
const dbname = 'ticks' || process.env.DBNAME

console.log('BTC MARKETS DATA INGRESS\n')
console.log(`API:    ${api}`)
console.log(`PAIRS:  ${pairs}`)
console.log(`DBHOST: ${dbhost}`)
console.log(`DBNAME: ${dbname}\n\n`)

const influx = new InfluxDB.InfluxDB({
  host: dbhost,
  database: dbname,
  schema: [{
    measurement: 'tick',
    fields: {
      bid: InfluxDB.FieldType.INTEGER,
      ask: InfluxDB.FieldType.INTEGER,
      price: InfluxDB.FieldType.INTEGER,
      volume: InfluxDB.FieldType.INTEGER
    },
    tags: ['exchange', 'instrument', 'currency']
  }]
})

influx.getDatabaseNames()
  .then(names => {
    if (!names.includes(dbname)) {
      return influx.createDatabase(dbname)
    }
  }).then(() => {

    const socket = Socket(api, {secure: true, transports: ['websocket'], upgrade: false})
    
    socket.on('connect', function() {
      console.log('CONNECTED!\n')
      pairs.split(",").forEach(element => {
        let channel = `Ticker-BTCMarkets-${element}`
        socket.emit('join', `${channel}`)
      });
    });
    
    socket.on('newTicker', function(data) {
      influx.writePoints([
        {
          measurement: 'tick',
          tags: { exchange: 'btcmarkets', instrument: data.instrument, currency: data.currency },
          fields: { bid: data.bestBid, ask: data.bestAsk, price: data.lastPrice, volume: data.volume24h },
          timestamp: data.timestamp * 1000
        }
      ])
      .then(res => { console.log(`timestamp=${data.timestamp},instrument=${data.instrument},currency=${data.currency},bid=${data.bestBid},ask=${data.bestAsk},price=${data.lastPrice},volume=${data.volume24h}`) })
      .catch(err => { console.error(`Error saving data to InfluxDB! ${err.message}`) })
    });
    
    socket.on('disconnect', function() {
      console.error('DISCONNECTED!')
    });

  })

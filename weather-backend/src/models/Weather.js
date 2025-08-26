const mongoose = require('mongoose');

const WeatherSchema = new mongoose.Schema({
  city: { type: String, required: true },
  normalizedCity: { type: String, index: true },
  country: { type: String },
  coord: {
    lon: Number,
    lat: Number
  },
  main: {
    temp: Number,
    feels_like: Number,
    humidity: Number
  },
  wind: {
    speed: Number
  },
  weather: [
    {
      main: String,
      description: String,
      icon: String
    }
  ],
  raw: Object, 
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });

module.exports = mongoose.model('Weather', WeatherSchema);

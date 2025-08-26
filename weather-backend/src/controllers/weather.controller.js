const Joi = require('joi');
const axios = require('axios');
const Weather = require('../models/Weather');

const citySchema = Joi.object({
  city: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z\s\-'.]{2,60}$/)
    .required()
    .messages({
      'string.pattern.base': 'City contains invalid characters',
      'string.empty': 'City is required'
    })
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});


exports.fetchAndStoreWeather = async (req, res, next) => {
  try {
    const { error, value } = citySchema.validate({ city: req.query.city });
    if (error) {
      error.status = 400;
      throw error;
    }
    const city = value.city;
    const normalizedCity = city.toLowerCase();

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, units: 'metric', appid: apiKey },
      timeout: 10000
    });

    const doc = await Weather.create({
      city,
      normalizedCity,
      country: data.sys?.country || '',
      coord: data.coord || {},
      main: {
        temp: data.main?.temp,
        feels_like: data.main?.feels_like,
        humidity: data.main?.humidity
      },
      wind: { speed: data.wind?.speed },
      weather: (data.weather || []).map(w => ({
        main: w.main,
        description: w.description,
        icon: w.icon
      })),
      raw: data
    });

    res.json({ ok: true, data: doc });
  } catch (err) {
    if (err.response) {
      
      if (err.response.status === 404) {
        err.message = 'City not found';
        err.status = 404;
      } else if (err.response.status === 401) {
        err.message = 'Invalid OpenWeather API key';
        err.status = 401;
      } else {
        err.message = `OpenWeather error: ${err.response.statusText}`;
        err.status = err.response.status;
      }
    }
    next(err);
  }
};


exports.getResults = async (req, res, next) => {
  try {
    const { value, error } = paginationSchema.validate(req.query);
    if (error) { error.status = 400; throw error; }
    const { page, limit } = value;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Weather.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Weather.countDocuments()
    ]);

    res.json({
      ok: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items
    });
  } catch (err) {
    next(err);
  }
};


exports.getResultById = async (req, res, next) => {
  try {
    const item = await Weather.findById(req.params.id);
    if (!item) {
      const e = new Error('Not found');
      e.status = 404;
      throw e;
    }
    res.json({ ok: true, data: item });
  } catch (err) {
    next(err);
  }
};


exports.clearResults = async (req, res, next) => {
  try {
    await Weather.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

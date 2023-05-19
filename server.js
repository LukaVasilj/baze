const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline' https://apis.google.com");
  next();
});

app.listen(3000, function () {
  console.log('listening on 3000');
});

const uri = 'mongodb+srv://lukavasilj51:Mobitel123@staima.tw3kjuy.mongodb.net/';
const client = new MongoClient(uri, { useUnifiedTopology: true });

client.connect().then(() => {
  console.log('Connected to Database');
  const db = client.db('CinemaDB');
  const quotesCollection = db.collection('Theaters');
  const showtimesCollection = db.collection('Showtimes');


  // Define Theater model
  const theaterSchema = new mongoose.Schema({
    TheaterID: Number,
    Name: String,
    Capacity: Number
  });

  const Theater = mongoose.model('Theater', theaterSchema);

  app.get('/create', (req, res) => {
    res.render('create');
  });

  app.get('/', (req, res) => {
    db.collection('Theaters')
      .find()
      .toArray()
      .then(results => {
        res.render('index.ejs', { theaters: results });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });

  app.get('/edit', (req, res) => {
    const theaterID = req.query.theaterID;

    db.collection('Theaters')
      .findOne({ _id: new ObjectId(theaterID) })
      .then(theater => {
        res.render('edit.ejs', { theater });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });

  app.post('/update', (req, res) => {
    const theaterID = req.body.theaterID;
    const newTheaterID = parseInt(req.body.newTheaterID);
    const newName = req.body.newName;
    const newCapacity = parseInt(req.body.newCapacity);

    db.collection('Theaters')
      .updateOne(
        { _id: new ObjectId(theaterID) },
        {
          $set: {
            TheaterID: newTheaterID,
            Name: newName,
            Capacity: newCapacity,
          },
        }
      )
      .then(result => {
        res.redirect('/');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });

  app.post('/quotes', (req, res) => {
    const theaterID = parseInt(req.body.TheaterID);
    const capacity = parseInt(req.body.Capacity);

    quotesCollection
      .insertOne({ TheaterID: theaterID, Name: req.body.Name, Capacity: capacity })
      .then(result => {
        res.redirect('/');
      })
      .catch(error => console.error(error));
  });

  app.get('/view', (req, res) => {
    const theaterID = req.query.theaterID;
  
    db.collection('Theaters')
      .findOne({ _id: new ObjectId(theaterID) }) // Use 'new' keyword before ObjectId
      .then(theater => {
                res.render('view.ejs', { theater });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });

  app.put('/quotes', (req, res) => {
    const nameToChange = req.body.NameToChange;
    const newTheaterID = req.body.TheaterID;
    const newName = req.body.Name;
    const newCapacity = req.body.Capacity;

    quotesCollection
      .findOneAndUpdate(
        { Name: nameToChange },
        {
          $set: {
            TheaterID: parseInt(newTheaterID),
            Name: newName,
            Capacity: parseInt(newCapacity),
          },
        },
        {
          upsert: true,
        }
      )
      .then(result => {
        if (result.ok) {
          res.json('Success');
        } else {
          res.json('Update failed');
        }
      })
      .catch(error => console.error(error));
  });

  app.delete('/delete', (req, res) => {
    const theaterID = req.body.deleteTheaterID;
  
    db.collection('Theaters')
      .deleteOne({ _id: new ObjectId(theaterID) })
      .then(result => {
        if (result.deletedCount === 0) {
          return res.status(404).json('No matching theater found');
        }
        res.json('Theater deleted successfully');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while deleting the theater');
      });
  });

  app.get('/update-data', (req, res) => {
    db.collection('Theaters')
      .find()
      .toArray()
      .then(results => {
        res.json(results); // Send the updated data back to the client
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while updating data');
      });
  });
  
  // Showtimes routes
  app.get('/showtimes', (req, res) => {
    showtimesCollection
      .find()
      .toArray()
      .then(results => {
        res.render('showtimes', { showtimes: results });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });

  app.get('/showtimecreate', (req, res) => {
    db.collection('Theaters')
      .find()
      .toArray()
      .then(theaters => {
        db.collection('Movies')
          .find()
          .toArray()
          .then(movies => {
            res.render('showtimecreate.ejs', { theaters, movies });
          })
          .catch(error => {
            console.error(error);
            res.status(500).send('An error occurred while fetching movies');
          });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while fetching theaters');
      });
  }); 

  app.post('/showtimes', (req, res) => {
    const showtimeID = parseInt(req.body.ShowtimeID);
    const theaterID = parseInt(req.body.TheaterID);
    const movieID = req.body.MovieID;
    const price = parseFloat(req.body.Price);
    const startTime = new Date(req.body.StartTime).toISOString();
    const endTime = new Date(req.body.EndTime).toISOString();

    showtimesCollection
      .insertOne({ ShowtimeID: showtimeID, TheaterID: theaterID, MovieID: movieID, Price: price, StartTime: startTime, EndTime: endTime })
      .then(result => {
        res.redirect('/showtimes');
      })
      .catch(error => console.error(error));
  });
  
  
  app.get('/editShowtime', (req, res) => {
    const showtimeID = req.query.showtimeID;
  
    db.collection('Showtimes')
      .findOne({ _id: new ObjectId(showtimeID) })
      .then(showtime => {
        if (showtime) {
          // Convert StartTime and EndTime to Date objects if they are stored as strings
          showtime.StartTime = new Date(showtime.StartTime);
          showtime.EndTime = new Date(showtime.EndTime);
  
          res.render('showtimesedit.ejs', { showtime: showtime });
        } else {
          res.status(404).send('Showtime not found');
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });
  
  app.post('/updateShowtime', (req, res) => {
    const showtimeID = req.body.showtimeID;
    const newTheaterID = parseInt(req.body.newTheaterID);
    const newMovieID = parseInt(req.body.newMovieID);
    const newPrice = parseFloat(req.body.newPrice);
    const newStartTime = new Date(req.body.newStartTime).toISOString();;
    const newEndTime = new Date(req.body.newEndTime).toISOString();;
  
    db.collection('Showtimes')
      .updateOne(
        { _id: new ObjectId(showtimeID) },
        {
          $set: {
            TheaterID: newTheaterID,
            MovieID: newMovieID,
            Price: newPrice,
            StartTime: newStartTime,
            EndTime: newEndTime,
          },
        }
      )
      .then(result => {
        res.redirect('/showtimes');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });

  app.get('/showtimeview/:showtimeID', (req, res) => {
    const showtimeID = req.params.showtimeID;
  
    showtimesCollection
      .findOne({ _id: new ObjectId(showtimeID) })
      .then(showtime => {
        res.render('showtimeview.ejs', { showtime });
      })
      .catch(error => console.error(error));
  });
  
  app.delete('/deleteshowtime', (req, res) => {
    const showtimeID = req.body.showtimeID;
  
    showtimesCollection
      .deleteOne({ _id: new ObjectId(showtimeID) })
      .then(result => {
        if (result.deletedCount === 0) {
          return res.status(404).json('No matching showtime found');
        }
        res.json('Showtime deleted successfully');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while deleting the showtime');
      });
  });

  // Movies routes

  app.get('/movies', (req, res) => {
    db.collection('Movies')
      .find()
      .toArray()
      .then(movies => {
        res.render('movies.ejs', { movies });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while fetching movies');
      });
  });
  
  app.get('/moviecreate', (req, res) => {
    res.render('moviecreate.ejs');
  });
  
  app.post('/movies', (req, res) => {
    const movieID = parseInt(req.body.MovieID);
    const title = req.body.Title;
    const director = req.body.Director;
    const releaseDate = new Date(req.body.ReleaseDate).toISOString();
    const genreID = parseInt(req.body.GenreID);
  
    db.collection('Movies')
      .insertOne({ MovieID: movieID, Title: title, Director: director, ReleaseDate: releaseDate, GenreID: genreID })
      .then(result => {
        res.redirect('/movies');
      })
      .catch(error => console.error(error));
  });
  
  app.get('/editmovie', (req, res) => {
    const movieID = req.query.movieID;
  
    db.collection('Movies')
      .findOne({ _id: new ObjectId(movieID) })
      .then(movie => {
        if (movie) {
          movie.ReleaseDate = new Date(movie.ReleaseDate);
          res.render('movieedit.ejs', { movie });
        } else {
          res.status(404).send('Movie not found');
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });
  
  app.post('/updatemovie', (req, res) => {
    const movieID = req.body.movieID;
    const newMovieID = req.body.newMovieID;
    const newTitle = req.body.newTitle;
    const newDirector = req.body.newDirector;
    const newReleaseDate = new Date(req.body.newReleaseDate).toISOString();
    const newGenreID = parseInt(req.body.newGenreID);
  
    db.collection('Movies')
      .updateOne(
        { _id: new ObjectId(movieID) },
        {
          $set: {
            MovieID: newMovieID,
            Title: newTitle,
            Director: newDirector,
            ReleaseDate: newReleaseDate,
            GenreID: newGenreID,
          },
        }
      )
      .then(result => {
        res.redirect('/movies');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred');
      });
  });
  
  app.get('/movieview/:movieID', (req, res) => {
    const movieID = req.params.movieID;
  
    db.collection('Movies')
      .findOne({ _id: new ObjectId(movieID) })
      .then(movie => {
        res.render('movieview.ejs', { movie });
      })
      .catch(error => console.error(error));
  });
  
  app.delete('/deletemovie', (req, res) => {
    const movieID = req.body.movieID;
  
    db.collection('Movies')
      .deleteOne({ _id: new ObjectId(movieID) })
      .then(result => {
        if (result.deletedCount === 0) {
          return res.status(404).json('No matching movie found');
        }
        res.json('Movie deleted successfully');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while deleting the movie');
      });
  });
  

});


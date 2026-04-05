const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const db = mongoose.connection.db;
    const coll = db.collection('messages');
    await coll.updateMany(
      { text: { $regex: '^Proposed a meeting' } },
      { $set: { 
          is_proposal: true, 
          proposal_data: { date: '2026-04-06', time: '12:20', topics: 'Discussion', link: 'https://meet.google.com/new' } 
        } 
      }
    );
    console.log('Updated');
    process.exit(0);
  })
  .catch(console.error);

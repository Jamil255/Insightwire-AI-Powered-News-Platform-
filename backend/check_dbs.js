const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const count11 = await db.client.db('Scraped-Articles-11').collection('Articles').countDocuments();
  console.log('Scraped-Articles-11 total:', count11);
  const agg11 = await db.client.db('Scraped-Articles-11').collection('Articles').aggregate([{ $group: { _id: '$biasness', count: { $sum: 1 } } }]).toArray();
  console.log('Scraped-Articles-11 biasness:', agg11);

  const count10 = await db.client.db('Scraped-Articles-10').collection('Articles').countDocuments();
  console.log('Scraped-Articles-10 total:', count10);
  const agg10 = await db.client.db('Scraped-Articles-10').collection('Articles').aggregate([{ $group: { _id: '$biasness', count: { $sum: 1 } } }]).toArray();
  console.log('Scraped-Articles-10 biasness:', agg10);
  process.exit(0);
});
